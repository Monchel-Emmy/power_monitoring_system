import React, { useEffect, useState } from 'react';
import './SystemConfigurationPage.css';

import { API_BASE } from '../config';

const defaultConfig = {
  dataManagement: { retentionDays: 90, backupFrequency: 'Daily' },
  alerts: { defaultThresholdPercent: 80, emailEnabled: true, smsEnabled: false, pushEnabled: true },
  security: { twoFactorRequired: true, sessionTimeoutMinutes: 30 },
};

const SystemConfigurationPage = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/system/config`);
        const data = await res.json();
        setConfig({
          dataManagement: { ...defaultConfig.dataManagement, ...data.dataManagement },
          alerts: { ...defaultConfig.alerts, ...data.alerts },
          security: { ...defaultConfig.security, ...data.security },
        });
      } catch (err) {
        console.error('Failed to load system config', err);
        setConfig({ ...defaultConfig });
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const updateData = (section, key, value) => {
    setConfig((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/system/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('Failed to save');
      setMessage({ type: 'success', text: 'Configuration saved successfully.' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to save configuration.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="system-config-page">
        <p className="loading-msg">Loading configuration...</p>
      </div>
    );
  }

  const dataManagement = config?.dataManagement ?? defaultConfig.dataManagement;
  const alerts = config?.alerts ?? defaultConfig.alerts;
  const security = config?.security ?? defaultConfig.security;

  return (
    <div className="system-config-page">
      <div className="system-config-header">
        <div>
          <h1>System Configuration</h1>
          <p>Configure global system settings and preferences</p>
        </div>
      </div>

      {message && (
        <div className={`config-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="system-config-section">
        <div className="section-icon data-icon" />
        <div className="section-content">
          <h2>Data Management</h2>
          <p>Configure data retention and backup settings</p>

          <div className="two-column-row">
            <div className="field-group">
              <label htmlFor="data-retention">Data Retention Period (days)</label>
              <input
                id="data-retention"
                type="number"
                className="sc-input"
                min={1}
                max={3650}
                value={dataManagement.retentionDays}
                onChange={(e) => updateData('dataManagement', 'retentionDays', Number(e.target.value) || 90)}
              />
            </div>
            <div className="field-group">
              <label htmlFor="backup-frequency">Backup Frequency</label>
              <select
                id="backup-frequency"
                className="sc-input"
                value={dataManagement.backupFrequency}
                onChange={(e) => updateData('dataManagement', 'backupFrequency', e.target.value)}
              >
                <option value="Hourly">Hourly</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="system-config-section">
        <div className="section-icon alert-icon" />
        <div className="section-content">
          <h2>Alert Configuration</h2>
          <p>Set up alert thresholds and notification preferences</p>

          <div className="field-group">
            <label htmlFor="alert-threshold">Default Alert Threshold (%)</label>
            <input
              id="alert-threshold"
              type="number"
              className="sc-input"
              min={1}
              max={100}
              value={alerts.defaultThresholdPercent}
              onChange={(e) => updateData('alerts', 'defaultThresholdPercent', Number(e.target.value) || 80)}
            />
            <span className="helper-text">
              Trigger alerts when consumption exceeds this threshold
            </span>
          </div>

          <div className="notification-row">
            <div className="notification-item">
              <div className="notif-main">
                <div className="notif-icon email" />
                <div>
                  <h3>Email Notifications</h3>
                  <p>Receive alerts via email</p>
                </div>
              </div>
              <button
                type="button"
                className={`toggle ${alerts.emailEnabled ? 'on' : ''}`}
                onClick={() => updateData('alerts', 'emailEnabled', !alerts.emailEnabled)}
                aria-label="Toggle email notifications"
              />
            </div>

            <div className="notification-item">
              <div className="notif-main">
                <div className="notif-icon sms" />
                <div>
                  <h3>SMS Notifications</h3>
                  <p>Receive alerts via SMS</p>
                </div>
              </div>
              <button
                type="button"
                className={`toggle ${alerts.smsEnabled ? 'on' : ''}`}
                onClick={() => updateData('alerts', 'smsEnabled', !alerts.smsEnabled)}
                aria-label="Toggle SMS notifications"
              />
            </div>

            <div className="notification-item">
              <div className="notif-main">
                <div className="notif-icon push" />
                <div>
                  <h3>Push Notifications</h3>
                  <p>Receive alerts via push notifications</p>
                </div>
              </div>
              <button
                type="button"
                className={`toggle ${alerts.pushEnabled ? 'on' : ''}`}
                onClick={() => updateData('alerts', 'pushEnabled', !alerts.pushEnabled)}
                aria-label="Toggle push notifications"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="system-config-section">
        <div className="section-icon security-icon" />
        <div className="section-content">
          <h2>Security Settings</h2>
          <p>Configure authentication and session management</p>

          <div className="security-card">
            <div className="security-main">
              <div className="security-badge" />
              <div>
                <h3>Two-Factor Authentication</h3>
                <p>Require 2FA for all users</p>
              </div>
            </div>
            <button
              type="button"
              className={`toggle ${security.twoFactorRequired ? 'on' : ''}`}
              onClick={() => updateData('security', 'twoFactorRequired', !security.twoFactorRequired)}
              aria-label="Toggle two-factor authentication"
            />
          </div>

          <div className="field-group">
            <label htmlFor="session-timeout">Session Timeout (minutes)</label>
            <input
              id="session-timeout"
              type="number"
              className="sc-input"
              min={5}
              max={1440}
              value={security.sessionTimeoutMinutes}
              onChange={(e) => updateData('security', 'sessionTimeoutMinutes', Number(e.target.value) || 30)}
            />
          </div>
        </div>
      </div>

      <div className="system-config-footer">
        <button
          type="button"
          className="save-config-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
};

export default SystemConfigurationPage;
