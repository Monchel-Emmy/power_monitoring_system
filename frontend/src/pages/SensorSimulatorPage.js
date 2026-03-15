import React, { useEffect, useState } from 'react';
import './SensorSimulatorPage.css';

import { API_BASE } from '../config';

/**
 * Sensor Simulator – push test data into the database to simulate sensors.
 * Use this to see Live Monitoring, Analytics, and Predictive update without real hardware.
 */
const SensorSimulatorPage = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [power, setPower] = useState('');
  const [voltage, setVoltage] = useState('220');
  const [current, setCurrent] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/devices`)
      .then((res) => res.json())
      .then((data) => {
        setDevices(Array.isArray(data) ? data : []);
        if (data?.length && !selectedDeviceId) setSelectedDeviceId(String(data[0]._id));
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load devices' }));
  }, []);

  const selectedDevice = devices.find((d) => String(d._id) === String(selectedDeviceId));

  const sendOneReading = async (e) => {
    e.preventDefault();
    if (!selectedDeviceId) {
      setMessage({ type: 'error', text: 'Select a device' });
      return;
    }
    const p = Number(power);
    const v = Number(voltage);
    const c = Number(current);
    if (isNaN(p) || p < 0) {
      setMessage({ type: 'error', text: 'Enter a valid power (kW)' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/sensor-readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: selectedDeviceId,
          powerConsumption: p,
          voltage: isNaN(v) ? 220 : v,
          current: isNaN(c) ? (p * 1000 / (v || 220)) : c,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to add reading');
      setMessage({ type: 'success', text: '1 reading added. Check Live Monitoring!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Request failed' });
    } finally {
      setLoading(false);
    }
  };

  const generateBulk = async (hours = 24) => {
    if (!selectedDeviceId) {
      setMessage({ type: 'error', text: 'Select a device' });
      return;
    }
    setBulkLoading(true);
    setMessage(null);
    const now = new Date();
    const readings = [];
    for (let i = hours - 1; i >= 0; i--) {
      const ts = new Date(now.getTime() - i * 60 * 60 * 1000);
      const baseKw = 20 + Math.random() * 80;
      const v = 218 + Math.random() * 10;
      const c = (baseKw * 1000) / v;
      readings.push({
        deviceId: String(selectedDeviceId),
        timestamp: ts.toISOString(),
        powerConsumption: Math.round(baseKw * 10) / 10,
        voltage: Math.round(v * 10) / 10,
        current: Math.round(c * 10) / 10,
      });
    }
    try {
      const res = await fetch(`${API_BASE}/api/sensor-readings/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readings }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Bulk add failed');
      setMessage({ type: 'success', text: `${data.count || readings.length} readings added. Refresh Live Monitoring & Analytics!` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Request failed' });
    } finally {
      setBulkLoading(false);
    }
  };

  const deleteAllReadings = async () => {
    if (!window.confirm('Delete all sensor readings? Charts and analytics will be empty until you add data again. This cannot be undone.')) {
      return;
    }
    setDeleteAllLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/sensor-readings/delete-all`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to delete readings');
      setMessage({
        type: 'success',
        text: data.deletedCount !== undefined
          ? `All ${data.deletedCount} readings deleted. System is clean — add data again when needed.`
          : (data.message || 'All readings deleted.'),
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Request failed' });
    } finally {
      setDeleteAllLoading(false);
    }
  };

  const loadDemoData = async () => {
    setDemoLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/sensor-readings/demo?clear=1`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to load demo data');
      setMessage({
        type: 'success',
        text: data.count !== undefined
          ? `Demo data loaded: ${data.count} readings for ${data.devicesUsed || 'all'} device(s). Open Live Monitoring or Analytics to see it.`
          : (data.message || 'Demo data loaded.'),
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Request failed' });
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="simulator-page">
      <header className="simulator-header">
        <h1>Sensor Simulator</h1>
        <p className="simulator-desc">
          Send test data to the database as if from real sensors. Then open <strong>Live Monitoring</strong> or <strong>Analytics &amp; Trends</strong> to see it.
        </p>
      </header>

      {message && (
        <div className={`simulator-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="simulator-card simulator-card-demo">
        <h2>Start with demo data</h2>
        <p>Load 7 days of hourly readings for every device so you can try Live Monitoring, Analytics, and Predictive without adding data manually. Existing readings are replaced.</p>
        <button
          type="button"
          className="simulator-btn primary"
          disabled={demoLoading}
          onClick={loadDemoData}
        >
          {demoLoading ? 'Loading…' : 'Load demo data'}
        </button>
      </div>

      <div className="simulator-card">
        <h2>Send one reading</h2>
        <p>Simulate a single sensor reading for the selected device (timestamp = now).</p>
        <form onSubmit={sendOneReading} className="simulator-form">
          <div className="simulator-form-row">
            <label>Device (sensor)</label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              required
            >
              <option value="">Select device</option>
              {devices.map((d) => (
                <option key={d._id} value={String(d._id)}>
                  {d.name} — {d.location || d.id}
                </option>
              ))}
            </select>
          </div>
          <div className="simulator-form-row triple">
            <div>
              <label>Power (kW)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={power}
                onChange={(e) => setPower(e.target.value)}
                placeholder="e.g. 45.5"
              />
            </div>
            <div>
              <label>Voltage (V)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={voltage}
                onChange={(e) => setVoltage(e.target.value)}
                placeholder="220"
              />
            </div>
            <div>
              <label>Current (A)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="auto from P/V"
              />
            </div>
          </div>
          <button type="submit" className="simulator-btn primary" disabled={loading}>
            {loading ? 'Sending…' : 'Send 1 reading'}
          </button>
        </form>
      </div>

      <div className="simulator-card">
        <h2>Bulk generate (simulate history)</h2>
        <p>Add many readings for the selected device so charts and predictions have data.</p>
        <div className="simulator-bulk-actions">
          <button
            type="button"
            className="simulator-btn secondary"
            disabled={!selectedDeviceId || bulkLoading}
            onClick={() => generateBulk(24)}
          >
            {bulkLoading ? 'Adding…' : 'Last 24 hours (hourly)'}
          </button>
          <button
            type="button"
            className="simulator-btn secondary"
            disabled={!selectedDeviceId || bulkLoading}
            onClick={() => generateBulk(24 * 7)}
          >
            Last 7 days (hourly)
          </button>
        </div>
        <p className="simulator-hint">Uses random power/voltage/current. Then open Manager → Live Monitoring or Analytics to see the effect.</p>
      </div>

      <div className="simulator-card">
        <h2>Delete all readings</h2>
        <p>Remove every sensor reading from the database so the system starts with no data. Use this when you want a clean slate for testing.</p>
        <button
          type="button"
          className="simulator-btn danger"
          disabled={deleteAllLoading}
          onClick={deleteAllReadings}
        >
          {deleteAllLoading ? 'Deleting…' : 'Delete all readings'}
        </button>
      </div>

      <div className="simulator-card simulator-tips">
        <h2>Tips</h2>
        <ul>
          <li>After sending data, open <strong>Live Monitoring</strong> (manager) to see current power, chart, and hierarchy.</li>
          <li>Use <strong>Analytics &amp; Trends</strong> to see past consumption by period.</li>
          <li>Use <strong>Predictive Analytics</strong> to see forecasts based on the data you added.</li>
          <li>Assign devices to a manager in User Management, then log in as that manager to see only their homes.</li>
        </ul>
      </div>
    </div>
  );
};

export default SensorSimulatorPage;
