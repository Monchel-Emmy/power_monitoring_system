import React, { useCallback, useEffect, useState } from 'react';
import './ManagerReportsPage.css';

import { API_BASE } from '../config';

const ManagerReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All Report Types');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newReport, setNewReport] = useState({
    reportType: 'Energy Usage',
    period: 'Last 30 Days',
    format: 'PDF',
  });

  const fetchReports = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (periodFilter !== 'All') params.append('period', periodFilter);
      if (categoryFilter !== 'All Report Types') params.append('category', categoryFilter);

      const res = await fetch(`${API_BASE}/api/manager/reports?${params}`);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport),
      });
      if (res.ok) {
        const json = await res.json();
        setReports([json.report, ...reports]);
        setShowGenerateModal(false);
        setNewReport({ reportType: 'Energy Usage', period: 'Last 30 Days', format: 'PDF' });
      }
    } catch (err) {
      console.error('Failed to generate report', err);
    }
  };

  const handleDownload = async (report) => {
    try {
      const params = new URLSearchParams({
        name: report.name,
        period: report.period,
        category: report.category || '',
      });
      const res = await fetch(`${API_BASE}/api/manager/reports/export?${params}`);
      if (!res.ok) throw new Error('Export failed');
      const text = await res.text();
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
      console.error('Download failed', err);
    }
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
        <p>Generate and download energy, cost, and sustainability reports.</p>
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
          <option value="Sustainability">Sustainability</option>
        </select>
        <button className="new-report-btn" onClick={() => setShowGenerateModal(true)}>
          + New Report
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
                    <button className="download-btn" onClick={() => handleDownload(r)}>
                      Download
                    </button>
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
                  <option value="Sustainability">Sustainability</option>
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
              <label>
                Format
                <select
                  value={newReport.format}
                  onChange={(e) => setNewReport({ ...newReport, format: e.target.value })}
                >
                  <option value="PDF">PDF</option>
                  <option value="XLSX">Excel (XLSX)</option>
                  <option value="CSV">CSV</option>
                </select>
              </label>
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
