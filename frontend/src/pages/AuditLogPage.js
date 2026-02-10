import React, { useEffect, useState } from 'react';
import { FaFileExport } from 'react-icons/fa';
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
      (event.details || '').toLowerCase().includes(term) ||
      (event.ip || '').toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  const totalEvents = events.length;
  const userActions = events.filter((e) => e.category === 'User Actions').length;
  const securityEvents = events.filter((e) => e.category === 'Security Events').length;
  const systemEvents = events.filter((e) => e.category === 'System Events').length;

  const handleExport = () => {
    if (filteredEvents.length === 0) return;
    const headers = ['Timestamp', 'User', 'Category', 'Action', 'Details', 'IP', 'Status'];
    const rows = filteredEvents.map((e) => [
      e.timestamp || '',
      e.user || '',
      e.category || '',
      e.action || '',
      (e.details || '').replace(/"/g, '""'),
      e.ip || '',
      e.status || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
        <button type="button" className="export-log-btn" onClick={handleExport}>
          <FaFileExport /> Export Log
        </button>
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
              <th>IP Address</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((event) => (
              <tr key={event._id || event.id || Math.random()}>
                <td>{event.timestamp}</td>
                <td>{event.user}</td>
                <td>
                  <span className={`action-dot ${categoryToSlug(event.category)}`} />
                  {event.action}
                </td>
                <td>{event.details}</td>
                <td>{event.ip}</td>
                <td>
                  <span className={`status-pill ${(event.status || 'success').toLowerCase()}`}>
                    {event.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredEvents.length === 0 && (
          <p className="audit-empty">No audit events match your filters.</p>
        )}
      </div>
    </div>
  );
};

export default AuditLogPage;
