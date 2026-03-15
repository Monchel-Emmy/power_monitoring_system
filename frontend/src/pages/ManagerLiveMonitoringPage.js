import React, { useEffect, useState } from 'react';
import { HiLightningBolt, HiChartBar, HiTrendingUp, HiExclamation, HiHome, HiOfficeBuilding, HiChip } from 'react-icons/hi';
import './ManagerLiveMonitoringPage.css';

import { API_BASE, getAuthHeaders } from '../config';

const ManagerLiveMonitoringPage = () => {
  const [overview, setOverview] = useState(null);
  const [hierarchy, setHierarchy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedHouses, setExpandedHouses] = useState(new Set());
  const [expandedRooms, setExpandedRooms] = useState(new Set());
  const [chartHoveredPoint, setChartHoveredPoint] = useState(null);

  const fetchOverview = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/manager/live-overview`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(res.status === 500 ? 'Server error' : `Server returned ${res.status}`);
      const data = await res.json();
      setOverview(data);
    } catch (err) {
      console.error('Failed to load live overview', err);
      setOverview(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchHierarchy = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/manager/live-hierarchy`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setHierarchy(data);
      if (data.houses?.length) {
        setExpandedHouses((prev) => new Set([...prev, data.houses[0].id]));
      }
    } catch (err) {
      console.error('Failed to load live hierarchy', err);
      setHierarchy(null);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchHierarchy();
    const interval = setInterval(() => {
      fetchOverview();
      fetchHierarchy();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleHouse = (id) => {
    setExpandedHouses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleRoom = (key) => {
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const chartData = overview?.chart?.points?.map((val, i) => ({
    time: overview.chart.labels[i] || '',
    power: val,
  })) || [];

  const maxPower = chartData.length ? Math.max(...chartData.map((d) => d.power), 1) : 600;
  const chartHeight = 200;
  const chartWidth = 600;

  const divisor = Math.max(1, chartData.length - 1);
  const getPath = () => {
    if (!chartData.length) return '';
    const points = chartData.map((d, i) => {
      const x = (i / divisor) * chartWidth;
      const y = chartHeight - (d.power / maxPower) * chartHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;
  };

  const getLinePath = () => {
    if (!chartData.length) return '';
    const points = chartData.map((d, i) => {
      const x = (i / divisor) * chartWidth;
      const y = chartHeight - (d.power / maxPower) * chartHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  const getLiveChartPointCoords = (i) => {
    if (!chartData[i]) return null;
    const x = (i / divisor) * chartWidth;
    const y = chartHeight - (chartData[i].power / maxPower) * chartHeight;
    return { x, y };
  };

  if (!loading && !overview) {
    return (
      <div className="manager-page manager-live-page">
        <div className="manager-page-header">
          <h1>Live Power</h1>
          <p>See your power use in real time</p>
        </div>
        <div className="manager-error-state">
          <p>Unable to load live data.</p>
          <p>If you see &quot;Failed to fetch&quot; elsewhere: the app cannot reach the backend. Run the backend locally (<code>npm start</code> in backend folder, port 4000) or set <code>REACT_APP_API_BASE</code> to your deployed backend URL.</p>
          <p>If the backend is running: ensure the database is seeded (<code>npm run seed</code> in backend).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manager-page manager-live-page">
      <div className="manager-page-header">
        <h1>Live Power</h1>
        <p>See your power use in real time</p>
      </div>

      <div className="manager-kpi-row">
        <div className="manager-kpi-card">
          <div className="kpi-icon kpi-icon-blue">
            <HiLightningBolt />
          </div>
          <div className="kpi-label">Current Power Usage</div>
          <div className="kpi-value">
            {loading ? '—' : overview ? `${overview.currentPowerKw} kW` : '—'}
          </div>
          <div className={`kpi-sub kpi-trend ${(overview?.currentPowerTrendPercent || 0) < 0 ? 'kpi-trend-down' : 'kpi-trend-up'}`}>
            {overview ? `${overview.currentPowerTrendPercent >= 0 ? '+' : ''}${overview.currentPowerTrendPercent}% vs yesterday` : ''}
          </div>
        </div>
        <div className="manager-kpi-card">
          <div className="kpi-icon kpi-icon-green">
            <HiChartBar />
          </div>
          <div className="kpi-label">Average Voltage</div>
          <div className="kpi-value">
            {loading ? '—' : overview ? (overview.averageVoltageV === 0 ? '—' : `${overview.averageVoltageV} V`) : '—'}
          </div>
          <div className="kpi-sub kpi-sub-normal">{overview?.voltageStatus || ''}</div>
        </div>
        <div className="manager-kpi-card">
          <div className="kpi-icon kpi-icon-purple">
            <HiTrendingUp />
          </div>
          <div className="kpi-label">Today&apos;s Consumption</div>
          <div className="kpi-value">
            {loading ? '—' : overview ? `${Number(overview.todaysConsumptionKwh).toLocaleString()} kWh` : '—'}
          </div>
          <div className={`kpi-sub kpi-trend ${(overview?.todaysConsumptionTrendPercent || 0) < 0 ? 'kpi-trend-down' : 'kpi-trend-up'}`}>
            {overview ? `${overview.todaysConsumptionTrendPercent >= 0 ? '+' : ''}${overview.todaysConsumptionTrendPercent}%` : ''}
          </div>
        </div>
        <div className="manager-kpi-card">
          <div className="kpi-icon kpi-icon-yellow">
            <HiExclamation />
          </div>
          <div className="kpi-label">Active Alerts</div>
          <div className="kpi-value">
            {loading ? '—' : overview ? overview.activeAlerts : '—'}
          </div>
          <div className="kpi-sub kpi-sub-alerts">{overview?.activeAlerts !== undefined ? 'devices need attention' : ''}</div>
        </div>
      </div>

        <div className="manager-chart-card">
        <div className="chart-header">
          <h2>Real-Time Power Consumption</h2>
          <p>Your assigned homes — last 24 hours</p>
        </div>
        <div className="chart-area-container chart-area-with-tooltip">
          {chartData.length ? (
            <>
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} className="power-chart-svg" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="powerGradient" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                <g transform="translate(0, 0)">
                  {[0, 150, 300, 450, 600].filter((v) => v <= maxPower).map((v, i) => (
                    <line key={v} x1="0" y1={chartHeight - (v / maxPower) * chartHeight} x2={chartWidth} y2={chartHeight - (v / maxPower) * chartHeight} className="chart-grid-line" />
                  ))}
                  <path d={getPath()} fill="url(#powerGradient)" className="chart-area" />
                  <path d={getLinePath()} fill="none" stroke="#3b82f6" strokeWidth="2" className="chart-line" />
                  {chartData.map((d, i) => {
                    const coords = getLiveChartPointCoords(i);
                    if (!coords) return null;
                    return (
                      <circle
                        key={i}
                        cx={coords.x}
                        cy={coords.y}
                        r={14}
                        fill="transparent"
                        className="live-chart-hover-dot"
                        onMouseEnter={() => setChartHoveredPoint({ index: i, ...coords })}
                        onMouseLeave={() => setChartHoveredPoint(null)}
                      />
                    );
                  })}
                </g>
              </svg>
              {chartHoveredPoint != null && chartData[chartHoveredPoint.index] && (
                <div
                  className="live-chart-tooltip"
                  style={{
                    left: `${(chartHoveredPoint.x / chartWidth) * 100}%`,
                    top: '8px',
                    transform: 'translate(-50%, 0)',
                  }}
                >
                  <div className="live-chart-tooltip-time">{chartData[chartHoveredPoint.index].time}</div>
                  <div className="live-chart-tooltip-value">{chartData[chartHoveredPoint.index].power} kW</div>
                </div>
              )}
            </>
          ) : (
            <div className="chart-loading">No usage data yet for your homes.</div>
          )}
        </div>
        <div className="chart-axis-labels">
          {overview?.chart?.labels?.map((l, i) => (
            <span key={i} className="chart-x-label">{l}</span>
          ))}
        </div>
      </div>

      <div className="live-hierarchy-card">
        <div className="live-hierarchy-header">
          <h2>Live monitoring by home, room & device</h2>
          <p>Power, voltage and current for each device in your assigned homes</p>
        </div>
        {hierarchy?.houses?.length ? (
          <div className="live-hierarchy-list">
            {hierarchy.houses.map((house) => {
              const isHouseOpen = expandedHouses.has(house.id);
              return (
                <div key={house.id} className="hierarchy-house">
                  <button
                    type="button"
                    className="hierarchy-house-btn"
                    onClick={() => toggleHouse(house.id)}
                    aria-expanded={isHouseOpen}
                  >
                    <HiHome className="hierarchy-icon house-icon" />
                    <span className="hierarchy-house-name">{house.name}</span>
                    <span className="hierarchy-house-meta">
                      {house.rooms?.length || 0} room{house.rooms?.length !== 1 ? 's' : ''}
                    </span>
                    <span className="hierarchy-chevron">{isHouseOpen ? '▼' : '▶'}</span>
                  </button>
                  {isHouseOpen && (
                    <div className="hierarchy-rooms">
                      {house.rooms?.length ? house.rooms.map((room) => {
                        const roomKey = `${house.id}-${room.name}`;
                        const isRoomOpen = expandedRooms.has(roomKey);
                        return (
                          <div key={roomKey} className="hierarchy-room">
                            <button
                              type="button"
                              className="hierarchy-room-btn"
                              onClick={() => toggleRoom(roomKey)}
                              aria-expanded={isRoomOpen}
                            >
                              <HiOfficeBuilding className="hierarchy-icon room-icon" />
                              <span className="hierarchy-room-name">{room.name}</span>
                              <span className="hierarchy-room-meta">
                                {room.devices?.length || 0} device{room.devices?.length !== 1 ? 's' : ''}
                              </span>
                              <span className="hierarchy-chevron">{isRoomOpen ? '▼' : '▶'}</span>
                            </button>
                            {isRoomOpen && (
                              <div className="hierarchy-devices">
                                <div className="hierarchy-devices-header">
                                  <span>Device</span>
                                  <span>Power</span>
                                  <span>Voltage</span>
                                  <span>Current</span>
                                  <span>Status</span>
                                </div>
                                {room.devices?.map((dev) => (
                                  <div key={dev.id} className="hierarchy-device-row">
                                    <span className="device-name">
                                      <HiChip className="device-icon" />
                                      {dev.name || dev.id}
                                    </span>
                                    <span className="device-power">{dev.power != null ? `${dev.power} kW` : '—'}</span>
                                    <span className="device-voltage">{dev.voltage != null ? `${dev.voltage} V` : '—'}</span>
                                    <span className="device-current">{dev.current != null ? `${dev.current} A` : '—'}</span>
                                    <span className={`device-status status-${(dev.status || '').toLowerCase()}`}>
                                      {dev.status || '—'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }) : (
                        <p className="hierarchy-empty">No rooms with devices.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : hierarchy === null && overview ? (
          <p className="hierarchy-empty hierarchy-error">Could not load device list. Try refreshing the page.</p>
        ) : (
          <p className="hierarchy-empty">No homes assigned to you. Ask an admin to assign homes in User Management.</p>
        )}
      </div>

      <div className="live-bottom-row">
        <div className="building-usage-card">
          <h2>Your homes</h2>
          <p>Current consumption by assigned home</p>
          <div className="building-bars">
            {overview?.buildingUsage?.length ? overview.buildingUsage.map((b) => {
              const currentPct = b.maxCapacity > 0 ? Math.min(100, (b.currentUsage / b.maxCapacity) * 100) : 0;
              return (
                <div key={b.building} className="building-bar-row">
                  <span className="building-label">{b.building}</span>
                  <div className="building-bar-track">
                    <div className="building-bar-max" style={{ width: '100%' }} title={`Max: ${b.maxCapacity} kW`} />
                    <div className="building-bar-current" style={{ width: `${currentPct}%` }} title={`Current: ${b.currentUsage} kW`} />
                  </div>
                  <span className="building-values">{b.currentUsage} / {b.maxCapacity} kW</span>
                </div>
              );
            }) : <p className="no-data">No homes assigned to you.</p>}
          </div>
          <div className="building-legend">
            <span><span className="legend-dot legend-current" /> Current</span>
            <span><span className="legend-dot legend-max" /> Max</span>
          </div>
        </div>

        <div className="system-status-card">
          <h2>System Status</h2>
          <p>Current operational status</p>
          <div className="status-list">
            <div className="status-item">
              <span className={`status-dot status-${overview?.systemStatus?.allSystems === 'Operational' ? 'ok' : 'warn'}`} />
              <span>All Systems</span>
              <span className={`status-value status-${overview?.systemStatus?.allSystems === 'Operational' ? 'ok' : 'warn'}`}>{overview?.systemStatus?.allSystems || '—'}</span>
            </div>
            <div className="status-item">
              <span className="status-dot status-ok" />
              <span>Data Collection</span>
              <span className="status-value status-ok">{overview?.systemStatus?.dataCollection || 'Active'}</span>
            </div>
            {overview?.systemStatus?.buildings?.map((b, i) => (
              <div key={i} className="status-item">
                <span className={`status-dot status-${b.status === 'Active' ? 'ok' : b.status === 'Warning' ? 'warn' : 'error'}`} />
                <span>{b.name}</span>
                <span className={`status-value status-${b.status === 'Active' ? 'ok' : b.status === 'Warning' ? 'warn' : 'error'}`}>{b.status}</span>
              </div>
            ))}
            <div className="status-item">
              <span className="status-dot status-ok" />
              <span>Network Connection</span>
              <span className="status-value status-ok">{overview?.systemStatus?.network || 'Stable'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerLiveMonitoringPage;
