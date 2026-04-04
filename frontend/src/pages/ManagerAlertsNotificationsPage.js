import React, { useState, useEffect, useCallback } from 'react';
import {
  FaBell, FaCheckCircle, FaExclamationTriangle,
  FaEnvelope, FaTrash, FaWifi,
} from 'react-icons/fa';
import './ManagerAlertsNotificationsPage.css';
import { API_BASE, getAuthHeaders } from '../config';

const fmt = (ts) => {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const SEV = {
  High:   { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
  Medium: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  Low:    { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' },
};

const STA = {
  Open:          { bg: '#fee2e2', color: '#b91c1c' },
  Investigating: { bg: '#fef3c7', color: '#92400e' },
  Acknowledged:  { bg: '#dbeafe', color: '#1d4ed8' },
  Resolved:      { bg: '#dcfce7', color: '#166534' },
};

const typeIcon = (type) => {
  if (type === 'Device Offline') return '📡';
  if (type === 'High Consumption') return '⚡';
  return '🔔';
};

const ManagerAlertsNotificationsPage = () => {
  const [alerts, setAlerts]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [threshold, setThreshold]         = useState(1000);
  const [emailEnabled, setEmailEnabled]   = useState(true);
  const [thresholdInput, setThresholdInput] = useState('1000');
  const [saving, setSaving]               = useState(false);
  const [savedMsg, setSavedMsg]           = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/alerts?limit=200`, { headers: getAuthHeaders() });
      if (res.ok) setAlerts(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchThreshold = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/alerts/threshold`, { headers: getAuthHeaders() });
      if (res.ok) {
        const d = await res.json();
        setThreshold(d.powerThreshold);
        setThresholdInput(String(d.powerThreshold));
        setEmailEnabled(d.emailEnabled);
      }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchAlerts();
    fetchThreshold();
    const iv = setInterval(fetchAlerts, 30000);
    return () => clearInterval(iv);
  }, [fetchAlerts, fetchThreshold]);

  const handleSave = async () => {
    const val = Number(thresholdInput);
    if (isNaN(val) || val <= 0) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/alerts/threshold`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ powerThreshold: val, emailEnabled }),
      });
      if (res.ok) {
        const d = await res.json();
        setThreshold(d.powerThreshold);
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 3000);
      }
    } finally { setSaving(false); }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    const res = await fetch(`${API_BASE}/api/alerts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAlerts((prev) => prev.map((a) => (a._id === id ? updated : a)));
    }
  };

  const handleDelete = async (id) => {
    const res = await fetch(`${API_BASE}/api/alerts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.ok) setAlerts((prev) => prev.filter((a) => a._id !== id));
  };

  const open     = alerts.filter((a) => a.status !== 'Resolved');
  const resolved = alerts.filter((a) => a.status === 'Resolved');

  return (
    <div className="ap">

      {/* Page header */}
      <div className="ap-header">
        <div className="ap-header-left">
          <FaBell className="ap-bell" />
          <div>
            <h1>Alerts &amp; Notifications</h1>
            <p>Triggered automatically when power exceeds threshold or a device goes offline.</p>
          </div>
        </div>
      </div>

      {/* Threshold card — redesigned */}
      <div className="ap-threshold-card">
        <div className="ap-tc-icon-wrap">
          <FaExclamationTriangle />
        </div>
        <div className="ap-tc-body">
          <div className="ap-tc-title">Power Alert Threshold</div>
          <div className="ap-tc-desc">
            An alert is created and an email is sent to all managers when any device reading
            reaches or exceeds this value.
          </div>
          <div className="ap-tc-row">
            <div className="ap-tc-input-group">
              <input
                type="number"
                min="1"
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                placeholder="1000"
              />
              <span className="ap-tc-unit">kW</span>
            </div>
            <label className="ap-tc-email-toggle">
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
              />
              <FaEnvelope className="ap-tc-email-icon" />
              Send email alerts
            </label>
            <button className="ap-tc-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            {savedMsg && (
              <span className="ap-tc-saved">
                <FaCheckCircle /> Saved
              </span>
            )}
          </div>
        </div>
        <div className="ap-tc-also">
          <FaWifi className="ap-tc-wifi" />
          <span>Also alerts when a device goes <strong>Offline</strong></span>
        </div>
      </div>

      {/* Stats */}
      <div className="ap-stats">
        <div className="ap-stat ap-stat-open">
          <span className="ap-stat-num">{open.length}</span>
          <span className="ap-stat-lbl">Open</span>
        </div>
        <div className="ap-stat ap-stat-resolved">
          <span className="ap-stat-num">{resolved.length}</span>
          <span className="ap-stat-lbl">Resolved</span>
        </div>
        <div className="ap-stat">
          <span className="ap-stat-num">{threshold} kW</span>
          <span className="ap-stat-lbl">Threshold</span>
        </div>
        <div className="ap-stat">
          <span className="ap-stat-num" style={{ color: emailEnabled ? '#16a34a' : '#9ca3af' }}>
            {emailEnabled ? 'On' : 'Off'}
          </span>
          <span className="ap-stat-lbl">Email</span>
        </div>
      </div>

      {loading ? (
        <div className="ap-loading">Loading alerts…</div>
      ) : alerts.length === 0 ? (
        <div className="ap-empty">
          <FaCheckCircle className="ap-empty-icon" />
          <p>No alerts yet — system is healthy.</p>
          <span>Alerts appear here when power exceeds {threshold} kW or a device goes offline.</span>
        </div>
      ) : (
        <>
          {/* ── Active alerts ── */}
          <div className="ap-section-header">
            <span className="ap-section-dot dot-open" />
            Active Alerts
            {open.length > 0 && <span className="ap-section-count">{open.length}</span>}
          </div>

          {open.length === 0 ? (
            <div className="ap-section-empty">No active alerts right now.</div>
          ) : (
            <div className="ap-list">
              {open.map((a) => (
                <AlertCard key={a._id} alert={a} onUpdate={handleStatusUpdate} />
              ))}
            </div>
          )}

          {/* ── Resolved ── */}
          {resolved.length > 0 && (
            <>
              <div className="ap-section-header ap-section-header-resolved">
                <span className="ap-section-dot dot-resolved" />
                Resolved
                <span className="ap-section-count resolved-count">{resolved.length}</span>
              </div>
              <div className="ap-list ap-list-resolved">
                {resolved.map((a) => (
                  <AlertCard key={a._id} alert={a} onDelete={handleDelete} resolved />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

/* ── Alert Card ── */
const AlertCard = ({ alert, onUpdate, onDelete, resolved }) => {
  const sev = SEV[alert.severity] || SEV.Low;
  const sta = STA[alert.status]   || STA.Open;

  return (
    <div className={`ap-card ${resolved ? 'ap-card-resolved' : ''}`}
         style={{ borderLeftColor: sev.color }}>

      <div className="ap-card-top">
        <div className="ap-card-badges">
          <span className="ap-badge" style={{ background: sev.bg, color: sev.color }}>
            {alert.severity}
          </span>
          <span className="ap-card-type">
            {typeIcon(alert.type)} {alert.type}
          </span>
          <span className="ap-badge" style={{ background: sta.bg, color: sta.color }}>
            {alert.status}
          </span>
        </div>
        <div className="ap-card-right">
          <span className="ap-card-time">{fmt(alert.timestamp)}</span>
          {resolved && (
            <button className="ap-delete-btn" onClick={() => onDelete(alert._id)} title="Delete">
              <FaTrash />
            </button>
          )}
        </div>
      </div>

      <p className="ap-card-msg">{alert.message}</p>

      <div className="ap-card-meta">
        {alert.building && <span>📍 {alert.building}</span>}
        {alert.device?.name && <span>🔌 {alert.device.name}</span>}
        {alert.value != null && (
          <span>⚡ {alert.value} kW <span className="ap-meta-threshold">(limit: {alert.threshold} kW)</span></span>
        )}
      </div>

      {!resolved && (
        <div className="ap-card-actions">
          {alert.status === 'Open' && (
            <>
              <button onClick={() => onUpdate(alert._id, 'Investigating')}>Investigate</button>
              <button onClick={() => onUpdate(alert._id, 'Acknowledged')}>Acknowledge</button>
            </>
          )}
          {(alert.status === 'Investigating' || alert.status === 'Acknowledged') && (
            <button className="ap-resolve-btn" onClick={() => onUpdate(alert._id, 'Resolved')}>
              <FaCheckCircle /> Mark Resolved
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ManagerAlertsNotificationsPage;
