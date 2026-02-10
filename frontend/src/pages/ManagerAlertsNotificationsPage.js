import React, { useState, useEffect } from 'react';
import './ManagerAlertsNotificationsPage.css';

import { API_BASE } from '../config';

const ManagerAlertsNotificationsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alertsRes, statsRes] = await Promise.all([
          fetch(`${API_BASE}/api/alerts?severity=${filterSeverity}&status=${filterStatus}`),
          fetch(`${API_BASE}/api/alerts/stats`),
        ]);
        if (alertsRes.ok) {
          const alertsData = await alertsRes.json();
          setAlerts(alertsData);
        }
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (err) {
        console.error('Failed to load alerts', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [filterSeverity, filterStatus]);

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleStatusUpdate = async (alertId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAlerts(alerts.map((a) => (a._id === alertId ? updated : a)));
      }
    } catch (err) {
      console.error('Failed to update alert', err);
    }
  };

  return (
    <div className="manager-page manager-alerts-page">
      <div className="manager-page-header">
        <h1>Alerts &amp; Notifications</h1>
        <p>
          Centralized view of system alerts, thresholds, and notification delivery
          status
        </p>
      </div>

      <div className="manager-kpi-row">
        <div className="manager-kpi-card">
          <div className="kpi-label">Open Alerts</div>
          <div className="kpi-value">{stats?.openCount ?? '—'}</div>
          <div className="kpi-sub kpi-sub-alert">Requires attention</div>
        </div>
        <div className="manager-kpi-card">
          <div className="kpi-label">Active This Week</div>
          <div className="kpi-value">{stats?.activeThisWeek ?? '—'}</div>
          <div className="kpi-sub">Across all buildings</div>
        </div>
        <div className="manager-kpi-card">
          <div className="kpi-label">Email Delivery</div>
          <div className="kpi-value">{stats?.emailDelivery ?? '—'}%</div>
          <div className="kpi-sub kpi-sub-normal">Healthy</div>
        </div>
        <div className="manager-kpi-card">
          <div className="kpi-label">SMS / Push</div>
          <div className="kpi-value">{stats?.smsPushDelivery ?? '—'}%</div>
          <div className="kpi-sub">Last 7 days</div>
        </div>
      </div>

      <div className="alerts-filters">
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
        >
          <option value="All">All Severities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Open">Open</option>
          <option value="Investigating">Investigating</option>
          <option value="Acknowledged">Acknowledged</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>

      <div className="alerts-table-wrapper">
        {loading ? (
          <div className="alerts-loading">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="alerts-empty">No alerts found. System is healthy!</div>
        ) : (
          <table className="alerts-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Building</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert._id}>
                  <td>{formatTimestamp(alert.timestamp)}</td>
                  <td>{alert.building}</td>
                  <td>
                    {alert.message ? (
                      <span title={alert.message}>{alert.type}</span>
                    ) : (
                      alert.type
                    )}
                  </td>
                  <td>
                    <span className={`severity-pill ${alert.severity.toLowerCase()}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill alerts ${alert.status.toLowerCase()}`}>
                      {alert.status}
                    </span>
                  </td>
                  <td>
                    {alert.status === 'Open' && (
                      <>
                        <button
                          className="alert-action-btn"
                          onClick={() => handleStatusUpdate(alert._id, 'Investigating')}
                        >
                          Investigate
                        </button>
                        <button
                          className="alert-action-btn"
                          onClick={() => handleStatusUpdate(alert._id, 'Acknowledged')}
                        >
                          Acknowledge
                        </button>
                      </>
                    )}
                    {alert.status === 'Investigating' && (
                      <button
                        className="alert-action-btn"
                        onClick={() => handleStatusUpdate(alert._id, 'Resolved')}
                      >
                        Resolve
                      </button>
                    )}
                    {alert.status === 'Acknowledged' && (
                      <button
                        className="alert-action-btn"
                        onClick={() => handleStatusUpdate(alert._id, 'Resolved')}
                      >
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManagerAlertsNotificationsPage;
