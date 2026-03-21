import React, { useEffect, useState } from 'react';
import './ManagerAnalyticsTrendsPage.css';

import { API_BASE, getAuthHeaders } from '../config';

/**
 * Analytics & Trends – Past consumption only.
 * One period selector, one chart, four numbers, one plain-language summary.
 * Data = manager's assigned homes only (real data from API).
 */
const ManagerAnalyticsTrendsPage = () => {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/manager/analytics-trends?range=${period}`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  const trend = data?.weeklyTrend ?? [];
  const maxKwh = trend.length ? Math.max(...trend.map((d) => d.usageKwh || 0), 1) : 1;
  const chartH = 220;
  const chartW = 640;
  const pad = { t: 12, r: 16, b: 32, l: 48 };
  const plotW = chartW - pad.l - pad.r;
  const plotH = chartH - pad.t - pad.b;

  const getLinePath = () => {
    if (!trend.length) return '';
    const step = Math.max(1, trend.length - 1);
    return trend.map((d, i) => {
      const x = pad.l + (i / step) * plotW;
      const y = pad.t + plotH - ((d.usageKwh || 0) / maxKwh) * plotH;
      return `${x},${y}`;
    }).reduce((acc, pt, i) => acc + (i === 0 ? `M ${pt}` : ` L ${pt}`), '');
  };

  const getPointCoords = (i) => {
    if (!trend[i]) return null;
    const step = Math.max(1, trend.length - 1);
    const x = pad.l + (i / step) * plotW;
    const y = pad.t + plotH - ((trend[i].usageKwh || 0) / maxKwh) * plotH;
    return { x, y };
  };

  const periodLabel = period === '1d' ? 'Last 1 day' : period === '7d' ? 'Last 7 days' : period === '14d' ? 'Last 14 days' : period === '30d' ? 'Last 30 days' : 'Last year';
  const totalKwh = data?.totalConsumptionKwh ?? 0;
  const avgDaily = data?.avgDailyConsumptionKwh ?? 0;
  const changePct = data?.totalConsumptionChangePercent ?? 0;
  const peakKw = data?.peakDemandKw ?? 0;

  let inShort = 'Select a period to see consumption for your assigned homes.';
  if (data && !loading) {
    const changeText = changePct === 0 ? 'about the same as' : changePct < 0 ? `${Math.abs(changePct)}% less than` : `${changePct}% more than`;
    inShort = `In ${periodLabel.toLowerCase()} your homes used ${Number(totalKwh).toLocaleString()} kWh in total. That's ${changeText} the previous period. Average ${Number(avgDaily).toLocaleString()} kWh per day.`;
  }

  return (
    <div className="manager-page manager-analytics-page">
      <header className="predict-section-header">
        <div>
          <h1>Past Consumption</h1>
          <p className="section-desc">See how much energy your homes used. Choose a period below.</p>
        </div>
        <select
          className="predict-period-select"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          disabled={loading}
          aria-label="Time period"
        >
          <option value="1d">Last 1 day</option>
          <option value="7d">Last 7 days</option>
          <option value="14d">Last 14 days</option>
          <option value="30d">Last 30 days</option>
          <option value="1y">Last 1 year</option>
        </select>
      </header>

      <div className="predict-kpi-row">
        <div className="predict-kpi">
          <span className="predict-kpi-label">Total used</span>
          <span className="predict-kpi-value">{loading ? '—' : `${Number(totalKwh).toLocaleString()} kWh`}</span>
        </div>
        <div className="predict-kpi">
          <span className="predict-kpi-label">Average per day</span>
          <span className="predict-kpi-value">{loading ? '—' : `${Number(avgDaily).toLocaleString()} kWh`}</span>
        </div>
        <div className="predict-kpi">
          <span className="predict-kpi-label">Change vs previous period</span>
          <span className={`predict-kpi-value ${changePct < 0 ? 'down' : changePct > 0 ? 'up' : ''}`}>
            {loading ? '—' : `${changePct >= 0 ? '+' : ''}${changePct}%`}
          </span>
        </div>
        <div className="predict-kpi">
          <span className="predict-kpi-label">Peak demand</span>
          <span className="predict-kpi-value">{loading ? '—' : `${peakKw} kW`}</span>
        </div>
      </div>

      <div className="predict-chart-card">
        <h2 className="predict-chart-title">Consumption over time</h2>
        <p className="predict-chart-desc">Daily energy use (kWh) for your assigned homes.</p>
        {loading ? (
          <div className="predict-chart-placeholder">Loading…</div>
        ) : trend.length ? (
          <div className="predict-chart-wrap">
            <div className="predict-chart-row">
              <div className="predict-y-axis">
                {[100, 75, 50, 25, 0].map((pct) => {
                  const v = Math.round((maxKwh * pct) / 100);
                  const show = v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v;
                  return <div key={pct} className="predict-y-tick">{show}</div>;
                })}
              </div>
              <div className="chart-svg-tooltip-wrap">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="predict-svg" preserveAspectRatio="xMidYMid meet">
                  {[0, 0.25, 0.5, 0.75, 1].map((r) => (
                    <line key={r} x1={pad.l} y1={pad.t + (1 - r) * plotH} x2={chartW - pad.r} y2={pad.t + (1 - r) * plotH} className="predict-grid" />
                  ))}
                  <path d={getLinePath()} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {trend.map((d, i) => {
                    const coords = getPointCoords(i);
                    if (!coords) return null;
                    return (
                      <circle
                        key={i}
                        cx={coords.x}
                        cy={coords.y}
                        r={16}
                        fill="transparent"
                        className="chart-hover-dot"
                        onMouseEnter={() => setHoveredPoint({ index: i, ...coords })}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    );
                  })}
                </svg>
                {hoveredPoint != null && trend[hoveredPoint.index] && (
                  <div
                    className="chart-tooltip"
                    style={{
                      left: `${((hoveredPoint.x - pad.l) / plotW) * 100}%`,
                      top: 0,
                      transform: 'translate(-50%, -100%)',
                    }}
                  >
                    <div className="chart-tooltip-title">{trend[hoveredPoint.index].day}</div>
                    <div className="chart-tooltip-value">{Number(trend[hoveredPoint.index].usageKwh).toLocaleString()} kWh</div>
                    {trend[hoveredPoint.index].costFrw != null && (
                      <div className="chart-tooltip-sub">≈ {trend[hoveredPoint.index].costFrw.toLocaleString()} Frw</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="predict-x-axis">
              {trend.map((d, i) => (
                <span key={i} className="predict-x-tick">{d.day?.length > 8 ? d.day.slice(0, 6) : d.day}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="predict-chart-placeholder">No data for this period. Data comes from your assigned homes.</div>
        )}
        <div className="predict-legend">
          <span className="predict-legend-dot" style={{ background: '#2563eb' }} />
          <span>Usage (kWh)</span>
        </div>
      </div>

      <div className="predict-in-short-card">
        <h2 className="predict-in-short-title">In short</h2>
        <p className="predict-in-short-text">{inShort}</p>
      </div>
    </div>
  );
};

export default ManagerAnalyticsTrendsPage;
