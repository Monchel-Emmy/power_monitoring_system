import React, { useEffect, useState, useRef } from 'react';
import { FaFileExport, FaFileCsv, FaFilePdf } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AuditLogPage.css';

import { API_BASE } from '../config';

const categoryOptions = [
  'All Categories',
  'User Actions',
  'Device Changes',
  'System Events',
  'Security Events',
];

const categoryToSlug = (cat) => (cat || '').toLowerCase().replace(/\s+/g, '-');

const AuditLogPage = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(5);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/audit-log`);
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load audit log', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
    const matchesCategory =
      category === 'All Categories' || event.category === category;
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      (event.user || '').toLowerCase().includes(term) ||
      (event.action || '').toLowerCase().includes(term) ||
      (event.details || '').toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  // Pagination logic
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const totalEvents = events.length;
  const userActions = events.filter((e) => e.category === 'User Actions').length;
  const securityEvents = events.filter((e) => e.category === 'Security Events').length;
  const systemEvents = events.filter((e) => e.category === 'System Events').length;

  const formatDate = (raw) => {
    if (!raw) return '';
    const d = new Date(raw);
    if (isNaN(d)) return raw;
    return d.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const exportFilename = (ext) =>
    `audit-log-${new Date().toISOString().slice(0, 10)}.${ext}`;

  const handleExportCSV = () => {
    if (filteredEvents.length === 0) return;
    const headers = ['#', 'Date & Time', 'User', 'Category', 'Action', 'Details', 'IP Address', 'Status'];
    const rows = filteredEvents.map((e, i) => [
      i + 1,
      formatDate(e.timestamp),
      e.user || '',
      e.category || '',
      e.action || '',
      (e.details || '').replace(/"/g, '""'),
      e.ip || '',
      e.status || '',
    ]);
    const csv = [
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(',')),
    ].join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFilename('csv');
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  };

  const handleExportPDF = () => {
    if (filteredEvents.length === 0) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    // Header bar
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Audit Log Report', 40, 32);

    // Sub-header info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    const generated = `Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}`;
    doc.text(generated, 40, 44);
    doc.text(`Total Records: ${filteredEvents.length}`, doc.internal.pageSize.getWidth() - 40, 44, { align: 'right' });

    // Summary row
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const summaryY = 68;
    const summaryItems = [
      ['Total Events', totalEvents],
      ['User Actions', userActions],
      ['Security Events', securityEvents],
      ['System Events', systemEvents],
    ];
    const boxW = 120, boxH = 28, gap = 16;
    const startX = 40;
    summaryItems.forEach(([label, val], i) => {
      const x = startX + i * (boxW + gap);
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(x, summaryY, boxW, boxH, 4, 4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text(String(val), x + boxW / 2, summaryY + 17, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(label, x + boxW / 2, summaryY + 26, { align: 'center' });
    });

    // Table
    const statusColors = {
      success: [34, 197, 94],
      warning: [234, 179, 8],
      error: [239, 68, 68],
    };

    autoTable(doc, {
      startY: summaryY + boxH + 16,
      head: [['#', 'Date & Time', 'User', 'Category', 'Action', 'Details', 'IP Address', 'Status']],
      body: filteredEvents.map((e, i) => [
        i + 1,
        formatDate(e.timestamp),
        e.user || '',
        e.category || '',
        e.action || '',
        e.details || '',
        e.ip || '',
        (e.status || 'success').toUpperCase(),
      ]),
      styles: { fontSize: 8, cellPadding: 5, overflow: 'linebreak' },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' },
        1: { cellWidth: 110 },
        2: { cellWidth: 80 },
        3: { cellWidth: 90 },
        4: { cellWidth: 100 },
        5: { cellWidth: 'auto' },
        6: { cellWidth: 80 },
        7: { cellWidth: 55, halign: 'center' },
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 7) {
          const status = (filteredEvents[data.row.index]?.status || 'success').toLowerCase();
          const color = statusColors[status] || statusColors.success;
          const { x, y, width, height } = data.cell;
          doc.setFillColor(...color);
          doc.roundedRect(x + 4, y + 4, width - 8, height - 8, 3, 3, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.text(status.toUpperCase(), x + width / 2, y + height / 2 + 2.5, { align: 'center' });
        }
      },
      margin: { left: 40, right: 40 },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 12,
        { align: 'center' }
      );
    }

    doc.save(exportFilename('pdf'));
    setExportMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="audit-log-page">
        <p className="audit-loading">Loading audit log...</p>
      </div>
    );
  }

  return (
    <div className="audit-log-page">
      <div className="audit-log-header">
        <div>
          <h1>Audit Log</h1>
          <p>Track all system activities and changes</p>
        </div>
        <div className="export-wrapper" ref={exportRef}>
          <button type="button" className="export-log-btn" onClick={() => setExportMenuOpen((v) => !v)}>
            <FaFileExport /> Export Log
          </button>
          {exportMenuOpen && (
            <div className="export-dropdown">
              <button type="button" onClick={handleExportCSV}>
                <FaFileCsv className="export-icon csv" /> Export as CSV
              </button>
              <button type="button" onClick={handleExportPDF}>
                <FaFilePdf className="export-icon pdf" /> Export as PDF
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="audit-summary-cards">
        <div className="audit-summary-card">
          <h3>Total Events</h3>
          <p>{totalEvents}</p>
        </div>
        <div className="audit-summary-card">
          <h3>User Actions</h3>
          <p>{userActions}</p>
        </div>
        <div className="audit-summary-card">
          <h3>Security Events</h3>
          <p className="security-count">{securityEvents}</p>
        </div>
        <div className="audit-summary-card">
          <h3>System Events</h3>
          <p className="system-count">{systemEvents}</p>
        </div>
      </div>

      <div className="audit-filters">
        <input
          type="text"
          className="audit-search-input"
          placeholder="Search audit log..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="audit-category-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categoryOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className="audit-table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Details</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {currentEvents.map((event) => (
              <tr key={event._id || event.id || Math.random()}>
                <td>{formatDate(event.timestamp)}</td>
                <td>{event.user}</td>
                <td>
                  <span className={`action-dot ${categoryToSlug(event.category)}`} />
                  {event.action}
                </td>
                <td>{event.details}</td>
                <td>
                  <span className={`status-pill ${(event.status || 'success').toLowerCase()}`}>
                    {event.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {currentEvents.length === 0 && (
          <p className="audit-empty">No audit events match your filters.</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {indexOfFirstEvent + 1} to {Math.min(indexOfLastEvent, filteredEvents.length)} of {filteredEvents.length} events
          </div>
          <div className="pagination-controls">
            <button 
              className="pagination-btn" 
              onClick={() => paginate(currentPage - 1)} 
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                className={`pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => paginate(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            <button 
              className="pagination-btn" 
              onClick={() => paginate(currentPage + 1)} 
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
