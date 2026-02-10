import React, { useEffect, useState } from 'react';
import { HiLightningBolt, HiChartBar, HiTrendingUp, HiExclamation } from 'react-icons/hi';
import './ManagerLiveMonitoringPage.css';

import { API_BASE } from '../config';

const ManagerLiveMonitoringPage = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/manager/live-overview`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setOverview(data);
      } catch (err) {
        console.error('Failed to load live overview', err);
        setOverview(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
    const interval = setInterval(fetchOverview, 30000);
    return () => clearInterval(interval);
  }, []);

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

  if (!loading && !overview) {
    return (
      <div className="manager-page manager-live-page">
        <div className="manager-page-header">
          <h1>Live Power Monitoring</h1>
          <p>Real-time energy consumption tracking and analysis</p>
        </div>
        <div className="manager-error-state">
          <p>Unable to load live data. Ensure the backend is running and the database is seeded (<code>npm run seed</code> in backend).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manager-page manager-live-page">
      <div className="manager-page-header">
        <h1>Live Power Monitoring</h1>
        <p>Real-time energy consumption tracking and analysis</p>
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
            {loading ? '—' : overview ? `${overview.averageVoltageV} V` : '—'}
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
          <div className="kpi-label">Capacity Usage</div>
          <div className="kpi-value">
            {loading ? '—' : overview ? `${overview.capacityUsagePercent}%` : '—'}
          </div>
          <div className="kpi-sub kpi-sub-alerts">{overview ? `${overview.activeAlerts} Active` : ''}</div>
        </div>
      </div>

      <div className="manager-chart-card">
        <div className="chart-header">
          <h2>Real-Time Power Consumption</h2>
          <p>Live monitoring of electricity usage</p>
        </div>
        <div className="chart-area-container">
          {chartData.length ? (
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
              </g>
            </svg>
          ) : (
            <div className="chart-loading">Loading chart data...</div>
          )}
        </div>
        <div className="chart-axis-labels">
          {overview?.chart?.labels?.map((l, i) => (
            <span key={i} className="chart-x-label">{l}</span>
          ))}
        </div>
      </div>

      <div className="live-bottom-row">
        <div className="building-usage-card">
          <h2>Building Usage Comparison</h2>
          <p>Current consumption by building</p>
          <div className="building-bars">
            {overview?.buildingUsage?.length ? overview.buildingUsage.map((b) => {
              const currentPct = Math.min(100, (b.currentUsage / b.maxCapacity) * 100);
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
            }) : <p className="no-data">No building data. Run seed to populate.</p>}
          </div>
          <div className="building-legend">
            <span><span className="legend-dot legend-current" /> Current Usage</span>
            <span><span className="legend-dot legend-max" /> Max Capacity</span>
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
