import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

import { API_BASE } from '../config';

function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/overview`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const isConnectionError = error && (error === 'Failed to fetch' || error.includes('NetworkError') || error.includes('Load failed'));

  if (loading) return <div className="content-body"><p>Loading admin overview...</p></div>;
  if (error) return (
    <div className="content-body">
      <p className="error">Error: {error}</p>
      {isConnectionError && (
        <p className="error-hint">
          Cannot reach the server. If running locally: start the backend (<code>npm start</code> in the backend folder, port 4000).
          If deployed: set <code>REACT_APP_API_BASE</code> to your backend URL (e.g. https://your-backend.onrender.com).
        </p>
      )}
    </div>
  );
  if (!data) return null;

  const { overview, recentUsers, buildings, devices, recentAudit } = data;

  return (
    <>
      <div className="content-body">
        <div className="admin-control-panel-overview">
          <h2>Admin Control Panel</h2>
          <p>Comprehensive system administration and management dashboard</p>
          <div className="overview-cards">
            <div className="card">
              <h3>System Health</h3>
              <p className="health-status">{overview.systemHealthPercent}% {overview.systemHealth}</p>
            </div>
            <div className="card">
              <h3>Total Users</h3>
              <p className="metric">{overview.totalUsers} <span>({overview.activeUsers} active)</span></p>
            </div>
            <div className="card">
              <h3>Homes</h3>
              <p className="metric">{overview.totalBuildings}</p>
            </div>
            <div className="card">
              <h3>Devices</h3>
              <p className="metric">{overview.totalDevices} <span>({overview.onlineDevices}/{overview.totalDevices} online)</span></p>
            </div>
            <div className="card">
              <h3>Audit Entries</h3>
              <p className="metric">{overview.auditEntries}</p>
            </div>
          </div>
        </div>

        <div className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions-grid">
            <button className="quick-action-btn" onClick={() => navigate('/user-management')}>
              <span className="action-icon">�</span>
              <span>User Management</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/building-configuration')}>
              <span className="action-icon">�</span>
              <span>Building Config</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/device-management')}>
              <span className="action-icon">⚡</span>
              <span>Device Control</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/audit-log')}>
              <span className="action-icon">�</span>
              <span>Audit Trail</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/sensor-simulator')}>
              <span className="action-icon">�</span>
              <span>Sensor Lab</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default DashboardPage;