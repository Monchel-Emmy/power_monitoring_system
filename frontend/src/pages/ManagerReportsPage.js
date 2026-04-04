import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaFileExport, FaFileCsv, FaFilePdf, FaPlus } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './ManagerReportsPage.css';
import { API_BASE, getAuthHeaders } from '../config';

const ManagerReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All Report Types');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newReport, setNewReport] = useState({
    reportType: 'Energy Usage',
    period: 'Last 30 Days',
    startDate: '',
    endDate: '',
  });

  const fetchReports = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (periodFilter !== 'All') params.append('period', periodFilter);
      if (categoryFilter !== 'All Report Types') params.append('category', categoryFilter);

      const res = await fetch(`${API_BASE}/api/manager/reports?${params}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setReports(json.reports || []);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  }, [periodFilter, categoryFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleGenerate = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/manager/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(newReport),
      });
      if (res.ok) {
        const json = await res.json();
        setReports([json.report, ...reports]);
        setShowGenerateModal(false);
        setNewReport({ reportType: 'Energy Usage', period: 'Last 30 Days', startDate: '', endDate: '' });
      }
    } catch (err) {
      console.error('Failed to generate report', err);
    }
  };

  const [openDropdown, setOpenDropdown] = useState(null); // report id with open dropdown
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchReportData = async (report) => {
    const params = new URLSearchParams({
      name: report.name,
      period: report.period,
      category: report.category || '',
      startDate: report.startDate ? new Date(report.startDate).toISOString().split('T')[0] : '',
      endDate: report.endDate ? new Date(report.endDate).toISOString().split('T')[0] : '',
    });
    const res = await fetch(`${API_BASE}/api/manager/reports/export?${params}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Export failed');
    return res.text();
  };

  const handleDownloadCSV = async (report) => {
    try {
      const text = await fetchReportData(report);
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name.replace(/\s+/g, '_').replace(/[^\w\-_.]/g, '')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV download failed', err);
    }
    setOpenDropdown(null);
  };

  const handleDownloadPDF = async (report) => {
    try {
      const text = await fetchReportData(report);
      // Parse CSV rows
      const rows = text.split(/\r?\n/).map((r) => r.split(',').map((c) => c.replace(/^"|"$/g, '').replace(/""/g, '"')));

      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();

      // Header bar
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, pageW, 52, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('⚡ Power Monitoring System', 36, 30);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 180, 180);
      doc.text('Energy Report', 36, 44);
      doc.text(`Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`, pageW - 36, 44, { align: 'right' });

      // Report title
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(report.name, 36, 80);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Period: ${report.period}`, 36, 94);

      // Summary section — find rows between Summary header and By Home header
      const summaryStart = rows.findIndex((r) => r[0] === 'Summary');
      const byHomeStart  = rows.findIndex((r) => r[0] === 'By Home');

      const summaryRows = summaryStart >= 0 && byHomeStart > summaryStart
        ? rows.slice(summaryStart + 1, byHomeStart).filter((r) => r[0] && r[0] !== '')
        : [];

      if (summaryRows.length) {
        autoTable(doc, {
          startY: 110,
          head: [['Metric', 'Value', 'Unit']],
          body: summaryRows,
          styles: { fontSize: 9, cellPadding: 6 },
          headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: { 1: { fontStyle: 'bold', textColor: [30, 41, 59] } },
          margin: { left: 36, right: 36 },
        });
      }

      // By Home section
      const byHomeRows = byHomeStart >= 0
        ? rows.slice(byHomeStart + 1).filter((r) => r[0] && r[0] !== '')
        : [];

      if (byHomeRows.length) {
        autoTable(doc, {
          startY: doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 20 : 200,
          head: [['Home / Building', 'Consumption (kWh)', 'Cost (Frw)', 'Readings']],
          body: byHomeRows,
          styles: { fontSize: 9, cellPadding: 6 },
          headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { left: 36, right: 36 },
        });
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 14, { align: 'center' });
      }

      doc.save(`${report.name.replace(/\s+/g, '_').replace(/[^\w\-_.]/g, '')}.pdf`);
    } catch (err) {
      console.error('PDF download failed', err);
    }
    setOpenDropdown(null);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="manager-page manager-reports-page">
      <div className="manager-page-header">
        <h1>Reports</h1>
        <p>Generate and download energy and cost reports.</p>
      </div>

      <div className="reports-filters">
        <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}>
          <option value="All">All Periods</option>
          <option value="Last 30 Days">Last 30 Days</option>
          <option value="Last Quarter">Last Quarter</option>
          <option value="This Year">This Year</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="All Report Types">All Report Types</option>
          <option value="Energy Usage">Energy Usage</option>
          <option value="Cost">Cost</option>
        </select>
        <button className="new-report-btn" onClick={() => setShowGenerateModal(true)}>
          <FaPlus /> New Report
        </button>
      </div>

      <div className="reports-list-card">
        {loading ? (
          <div className="reports-loading">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="reports-empty">No reports found. Generate a new report to get started.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Report</th>
                <th>Period</th>
                <th>Type</th>
                <th>Size</th>
                <th>Generated</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.period}</td>
                  <td>
                    <span className={`report-type-badge type-${r.type.toLowerCase()}`}>
                      {r.type}
                    </span>
                  </td>
                  <td>{r.size}</td>
                  <td>{formatDate(r.generatedAt)}</td>
                  <td>
                    <div className="report-download-wrap" ref={openDropdown === r.id ? dropdownRef : null}>
                      <button
                        className="download-btn"
                        onClick={() => setOpenDropdown(openDropdown === r.id ? null : r.id)}
                      >
                        <FaFileExport /> Export
                      </button>
                      {openDropdown === r.id && (
                        <div className="report-export-dropdown">
                          <button onClick={() => handleDownloadCSV(r)}>
                            <FaFileCsv className="exp-icon csv" /> Download CSV
                          </button>
                          <button onClick={() => handleDownloadPDF(r)}>
                            <FaFilePdf className="exp-icon pdf" /> Download PDF
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showGenerateModal && (
        <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Generate New Report</h2>
            <div className="modal-form">
              <label>
                Report Type
                <select
                  value={newReport.reportType}
                  onChange={(e) => setNewReport({ ...newReport, reportType: e.target.value })}
                >
                  <option value="Energy Usage">Energy Usage</option>
                  <option value="Cost">Cost</option>
                </select>
              </label>
              <label>
                Period
                <select
                  value={newReport.period}
                  onChange={(e) => setNewReport({ ...newReport, period: e.target.value })}
                >
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last Quarter">Last Quarter</option>
                  <option value="This Year">This Year</option>
                  <option value="Custom">Custom Range</option>
                </select>
              </label>
              {newReport.period === 'Custom' && (
                <>
                  <label>
                    Start Date
                    <input
                      type="date"
                      value={newReport.startDate}
                      onChange={(e) => setNewReport({ ...newReport, startDate: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </label>
                  <label>
                    End Date
                    <input
                      type="date"
                      value={newReport.endDate}
                      onChange={(e) => setNewReport({ ...newReport, endDate: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      min={newReport.startDate}
                    />
                  </label>
                </>
              )}
            </div>
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={() => setShowGenerateModal(false)}>
                Cancel
              </button>
              <button className="modal-btn-generate" onClick={handleGenerate}>
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerReportsPage;
