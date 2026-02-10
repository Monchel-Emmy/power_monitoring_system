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

  if (loading) return <div className="content-body"><p>Loading admin overview...</p></div>;
  if (error) return <div className="content-body"><p className="error">Error: {error}</p></div>;
  if (!data) return null;

  const { overview, recentUsers, buildings, devices, recentAudit } = data;

  return (
    <>
      {/* <header className="main-header">
          <h1>Administrator</h1>
          <p>System Control Panel</p>
        </header> */}
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
                <h3>Buildings</h3>
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

          <div className="system-configuration-dashboard">
            <h2>1. System Configuration Dashboard</h2>
            <p>Configure global system settings, notifications, security policies, and operational parameters</p>
            <div className="section-header-actions">
              <button className="add-button" onClick={() => navigate('/system-configuration')}>Configure System</button>
            </div>
            <p className="config-summary">Manage data retention, backup, security, notifications, and alert thresholds.</p>
          </div>

          <div className="user-management-interface dashboard-section">
            <h2>2. User Management Interface</h2>
            <p>Manage system users, roles, permissions, and access control with comprehensive user administration tools</p>
            <div className="section-header-actions">
              <button className="add-button" onClick={() => navigate('/user-management')}>Add New User</button>
              <button className="action-button" onClick={() => navigate('/user-management')}>View All Users</button>
              <div className="user-stats">
                <span>Total Users: <strong>{overview.totalUsers}</strong></span>
                <span>Active Users: <strong>{overview.activeUsers}</strong></span>
                <span>Administrators: <strong>{overview.adminCount}</strong></span>
                <span>Managers: <strong>{overview.managerCount}</strong></span>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length === 0 ? (
                  <tr><td colSpan="3">No users yet.</td></tr>
                ) : (
                  recentUsers.map((u) => (
                    <tr key={u._id}>
                      <td>{u.username}<br/>{u.email}</td>
                      <td>{u.role}</td>
                      <td>{u.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="building-unit-configuration dashboard-section">
            <h2>3. Building Unit Configuration</h2>
            <p>Configure building properties, zones, floor plans, and hierarchical organization with spatial management</p>
            <div className="section-header-actions">
              <button className="add-button" onClick={() => navigate('/building-configuration')}>Add Building</button>
              <button className="action-button" onClick={() => navigate('/building-configuration')}>View All Buildings</button>
              <div className="building-stats">
                <span>Total Buildings: <strong>{overview.totalBuildings}</strong></span>
                <span>Total Zones: <strong>{overview.totalZones}</strong></span>
                <span>Devices in Buildings: <strong>{overview.totalDevicesInBuildings ?? buildings.reduce((s,b)=>s+(b.totalDevices||0),0)}</strong></span>
              </div>
            </div>
            <div className="building-list">
              {buildings.length === 0 ? (
                <p>No buildings configured yet.</p>
              ) : (
                buildings.map((b) => (
                  <div className="building-card" key={b._id}>
                    <h3>{b.name}</h3>
                    <p className="address">{b.address}</p>
                    <span className={`status ${b.status}`}>{b.status}</span>
                    <div className="building-details">
                      <span>Floors: <strong>{b.totalFloors}</strong></span>
                      <span>Zones: <strong>{b.totalZones}</strong></span>
                      <span>Devices: <strong>{b.totalDevices}</strong></span>
                      <span>Total Area: <strong>{b.totalArea?.toLocaleString()} sq ft</strong></span>
                    </div>
                    <button className="view-details-button" onClick={() => navigate('/building-configuration')}>View Details</button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="device-management-console dashboard-section">
            <h2>4. Device Management Console</h2>
            <p>Monitor and manage IoT devices, sensors, meters, and gateways with firmware management and diagnostics</p>
            <div className="section-header-actions">
              <button className="add-button" onClick={() => navigate('/device-management')}>Add Device</button>
              <button className="action-button" onClick={() => navigate('/device-management')}>View All Devices</button>
              <div className="device-stats">
                <span>Online: <strong>{overview.onlineDevices}</strong></span>
                <span>Offline: <strong>{overview.offlineDevices ?? 0}</strong></span>
                <span>Warning: <strong>{overview.warningDevices ?? 0}</strong></span>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Battery</th>
                </tr>
              </thead>
              <tbody>
                {devices.length === 0 ? (
                  <tr><td colSpan="5">No devices yet.</td></tr>
                ) : (
                  devices.map((d) => (
                    <tr key={d._id}>
                      <td>{d.name}<br/>{d.id}</td>
                      <td>{d.type}</td>
                      <td>{d.location}</td>
                      <td>{d.status}</td>
                      <td>{d.battery || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="system-health-monitoring dashboard-section">
            <h2>5. System Health Monitoring</h2>
            <p>Real-time monitoring of system resources, performance metrics, server health, and infrastructure status</p>
            <div className="health-metrics">
              <div className="metric-item">
                <span>CPU Usage</span>
                <strong>68%</strong>
              </div>
              <div className="metric-item">
                <span>Memory Usage</span>
                <strong>73%</strong>
              </div>
              <div className="metric-item">
                <span>Network</span>
                <strong>82%</strong>
              </div>
              <div className="metric-item">
                <span>Disk Usage</span>
                <strong>61%</strong>
              </div>
            </div>
            <div className="chart-placeholder">24-Hour System Performance Chart (CPU %, Memory %, Network %)</div>
            <div className="system-uptime-info">
              <span>System Uptime (Last 30 days): <strong>99.8%</strong></span>
              <span>API Response Time (Average latency): <strong>45ms</strong></span>
              <span>Database Status (Connection pool): <strong>Healthy</strong></span>
            </div>
          </div>

          <div className="backup-recovery-controls dashboard-section">
            <h2>6. Backup & Recovery Controls</h2>
            <p>Automated backup management, disaster recovery, data restoration, and system snapshot controls</p>
            <div className="section-header-actions">
              <button className="action-button">Download Backup</button>
              <button className="action-button">Create Backup Now</button>
            </div>
            <div className="backup-summary">
              <span>Last Backup: <strong>2 hours ago</strong> (Completed successfully)</span>
              <span>Next Scheduled: <strong>In 22 hours</strong> (Daily at midnight)</span>
              <span>Backup Size: <strong>2.8 GB</strong> (Total storage used)</span>
              <span>Retention Period: <strong>90 days</strong> (Auto-cleanup enabled)</span>
            </div>
            <div className="config-section">
              <h3>Backup Configuration</h3>
              <div className="config-item">
                <label htmlFor="backup-freq-config">Backup Frequency</label>
                <input type="text" id="backup-freq-config" value="Daily" readOnly />
              </div>
              <div className="config-item">
                <label htmlFor="backup-time-config">Backup Time</label>
                <input type="text" id="backup-time-config" value="00:00" readOnly />
              </div>
              <div className="config-item">
                <label htmlFor="incremental-backups">Incremental Backups</label>
                <input type="checkbox" id="incremental-backups" checked readOnly />
              </div>
            </div>
            <div className="config-section">
              <h3>Recovery Options</h3>
              <div className="config-item">
                <label htmlFor="restore-backup">Restore from Backup</label>
                <select id="restore-backup"><option>Select backup to restore</option></select>
              </div>
              <div className="config-item">
                <label htmlFor="point-in-time-recovery">Point-in-Time Recovery</label>
                <input type="text" id="point-in-time-recovery" placeholder="Restore to specific timestamp" readOnly />
              </div>
              <div className="config-item">
                <label htmlFor="selective-data-restore">Selective Data Restore</label>
                <input type="text" id="selective-data-restore" placeholder="Restore specific tables/data" readOnly />
              </div>
            </div>
            <h3>Recent Backups</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Backup ID</th>
                  <th>Type</th>
                  <th>Date & Time</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>BKP-2024120301</td>
                  <td>Full</td>
                  <td>2024-12-03 00:00</td>
                  <td>2.8 GB</td>
                  <td>success</td>
                  <td><button>Restore</button> <button>Download</button></td>
                </tr>
                <tr>
                  <td>BKP-2024120201</td>
                  <td>Full</td>
                  <td>2024-12-02 00:00</td>
                  <td>2.7 GB</td>
                  <td>success</td>
                  <td><button>Restore</button> <button>Download</button></td>
                </tr>
                <tr>
                  <td>BKP-2024120101</td>
                  <td>Full</td>
                  <td>2024-12-01 00:00</td>
                  <td>2.6 GB</td>
                  <td>success</td>
                  <td><button>Restore</button> <button>Download</button></td>
                </tr>
                <tr>
                  <td>BKP-2024113001</td>
                  <td>Full</td>
                  <td>2024-11-30 00:00</td>
                  <td>2.5 GB</td>
                  <td>success</td>
                  <td><button>Restore</button> <button>Download</button></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="audit-trail-viewer dashboard-section">
            <h2>7. Audit Trail Viewer</h2>
            <p>Comprehensive logging of all system activities, user actions, security events, and change history with filtering and export</p>
            <div className="section-header-actions">
              <button className="action-button" onClick={() => navigate('/audit-log')}>View Full Audit Log</button>
              <button className="action-button" onClick={() => navigate('/audit-log')}>Export Logs</button>
              <div className="audit-stats">
                <span>Total Entries: <strong>{overview.auditEntries}</strong></span>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Category</th>
                  <th>Details</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAudit.length === 0 ? (
                  <tr><td colSpan="6">No audit entries yet.</td></tr>
                ) : (
                  recentAudit.map((a) => (
                    <tr key={a._id}>
                      <td>{a.timestamp}</td>
                      <td>{a.user}</td>
                      <td>{a.action}</td>
                      <td>{a.category}</td>
                      <td>{a.details}</td>
                      <td>{a.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
    </>
  );
}

export default DashboardPage;