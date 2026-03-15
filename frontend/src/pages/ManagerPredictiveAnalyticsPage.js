import React, { useEffect, useState } from 'react';
import './ManagerPredictiveAnalyticsPage.css';

import { API_BASE, getAuthHeaders } from '../config';

/**
 * Predictive Analytics – What's next.
 * One "predict next" selector, one combined chart (past actual + forecast), four numbers, one plain-language summary.
 * Data = manager's assigned homes only.
 */
const ManagerPredictiveAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/manager/predictive?days=${days}`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [days]);

  const actual = data?.recentActual ?? [];
  const forecastValues = data?.forecastSeries?.values ?? [];
  const combined = [
    ...actual.map((a) => ({ label: a.day || a.label, value: a.usageKwh || 0, type: 'actual' })),
    ...forecastValues.map((v, i) => ({
      label: i === 0 ? 'Tomorrow' : `Day ${i + 1}`,
      value: v || 0,
      type: 'forecast',
    })),
  ];

  const allValues = [...actual.map((a) => a.usageKwh || 0), ...forecastValues];
  const maxVal = allValues.length ? Math.max(...allValues, 1) : 1;
  const chartH = 240;
  const chartW = 700;
  const pad = { t: 12, r: 16, b: 36, l: 52 };
  const plotW = chartW - pad.l - pad.r;
  const plotH = chartH - pad.t - pad.b;
  const n = allValues.length;
  const step = Math.max(1, n - 1);

  const getPath = (startIdx, endIdx, values) => {
    if (!values.length || endIdx <= startIdx) return '';
    return values.map((val, i) => {
      const idx = startIdx + i;
      const x = pad.l + (idx / step) * plotW;
      const y = pad.t + plotH - (val / maxVal) * plotH;
      return `${x},${y}`;
    }).reduce((acc, pt, i) => acc + (i === 0 ? `M ${pt}` : ` L ${pt}`), '');
  };

  const actualValues = actual.map((a) => a.usageKwh || 0);
  const actualPath = getPath(0, actualValues.length, actualValues);
  const forecastPath = actualValues.length > 0 && forecastValues.length > 0
    ? getPath(actualValues.length - 1, n, [actualValues[actualValues.length - 1], ...forecastValues])
    : getPath(0, forecastValues.length, forecastValues);

  const getPointCoords = (i) => {
    if (i < 0 || i >= allValues.length) return null;
    const val = allValues[i];
    const x = pad.l + (i / step) * plotW;
    const y = pad.t + plotH - (val / maxVal) * plotH;
    return { x, y };
  };

  const tomorrowKwh = data?.tomorrowsForecastKwh ?? data?.forecastSeries?.values?.[0] ?? 0;
  const totalForecastKwh = data?.totalForecastKwh ?? (data?.forecastSeries?.values || []).reduce((s, v) => s + (v || 0), 0);
  const changePct = data?.forecastChangePercent ?? 0;
  const confidence = data?.predictionAccuracyLabel || '—';

  let inShort = 'Choose how many days to forecast. Predictions are based on your homes’ recent usage.';
  if (data && !loading) {
    inShort = `Over the next ${days} day${days !== 1 ? 's' : ''} we expect about ${Number(totalForecastKwh).toLocaleString()} kWh in total. Tomorrow we expect about ${Number(tomorrowKwh).toLocaleString()} kWh. ${confidence !== '—' ? `Confidence: ${confidence}.` : ''}`;
  }

  return (
    <div className="manager-page manager-predictive-page">
      <header className="predict-section-header">
        <div>
          <h1>What&apos;s next</h1>
          <p className="section-desc">See predicted energy use. Choose how many days to forecast.</p>
        </div>
        <select
          className="predict-period-select"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          disabled={loading}
          aria-label="Forecast period"
        >
          <option value={1}>Next 1 day</option>
          <option value={3}>Next 3 days</option>
          <option value={7}>Next 7 days</option>
          <option value={14}>Next 14 days</option>
        </select>
      </header>

      <div className="predict-kpi-row">
        <div className="predict-kpi">
          <span className="predict-kpi-label">Expected tomorrow</span>
          <span className="predict-kpi-value">{loading ? '—' : `${Number(tomorrowKwh).toLocaleString()} kWh`}</span>
        </div>
        <div className="predict-kpi">
          <span className="predict-kpi-label">Expected total (forecast period)</span>
          <span className="predict-kpi-value">{loading ? '—' : `${Number(totalForecastKwh).toLocaleString()} kWh`}</span>
        </div>
        <div className="predict-kpi">
          <span className="predict-kpi-label">Trend vs recent</span>
          <span className={`predict-kpi-value ${changePct < 0 ? 'down' : changePct > 0 ? 'up' : ''}`}>
            {loading ? '—' : `${changePct >= 0 ? '+' : ''}${changePct}%`}
          </span>
        </div>
        <div className="predict-kpi">
          <span className="predict-kpi-label">Confidence</span>
          <span className="predict-kpi-value">{loading ? '—' : confidence}</span>
        </div>
      </div>

      <div className="predict-chart-card predict-combined-card">
        <h2 className="predict-chart-title">Past and forecast</h2>
        <p className="predict-chart-desc">Left: last 7 days actual. Right: predicted use for your chosen period.</p>
        {loading ? (
          <div className="predict-chart-placeholder">Loading…</div>
        ) : combined.length ? (
          <div className="predict-chart-wrap">
            <div className="predict-chart-row">
              <div className="predict-y-axis">
                {[100, 75, 50, 25, 0].map((pct) => {
                  const v = Math.round((maxVal * pct) / 100);
                  const show = v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v;
                  return <div key={pct} className="predict-y-tick">{show}</div>;
                })}
              </div>
              <div className="chart-svg-tooltip-wrap">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="predict-svg" preserveAspectRatio="xMidYMid meet">
                  {[0, 0.25, 0.5, 0.75, 1].map((r) => (
                    <line key={r} x1={pad.l} y1={pad.t + (1 - r) * plotH} x2={chartW - pad.r} y2={pad.t + (1 - r) * plotH} className="predict-grid" />
                  ))}
                  {actualPath && <path d={actualPath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                  {forecastPath && <path d={forecastPath} fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 4" />}
                  {combined.map((d, i) => {
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
                {hoveredPoint != null && combined[hoveredPoint.index] && (
                  <div
                    className="chart-tooltip"
                    style={{
                      left: `${((hoveredPoint.x - pad.l) / plotW) * 100}%`,
                      top: 0,
                      transform: 'translate(-50%, -100%)',
                    }}
                  >
                    <div className="chart-tooltip-title">{combined[hoveredPoint.index].label}</div>
                    <div className="chart-tooltip-value">{Number(combined[hoveredPoint.index].value).toLocaleString()} kWh</div>
                    <div className="chart-tooltip-sub">{combined[hoveredPoint.index].type === 'actual' ? 'Actual' : 'Forecast'}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="predict-x-axis">
              {combined.map((d, i) => (
                <span key={i} className="predict-x-tick">{d.label?.length > 8 ? d.label.slice(0, 6) : d.label}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="predict-chart-placeholder">No forecast data. Data is for your assigned homes.</div>
        )}
        <div className="predict-legend predict-legend-dual">
          <span><span className="predict-legend-dot" style={{ background: '#2563eb' }} /> Actual (past 7 days)</span>
          <span><span className="predict-legend-dot" style={{ background: '#16a34a' }} /> Forecast</span>
        </div>
      </div>

      <div className="predict-in-short-card">
        <h2 className="predict-in-short-title">In short</h2>
        <p className="predict-in-short-text">{inShort}</p>
      </div>

      {data?.anomalies?.length > 0 && (
        <div className="predict-anomalies-card">
          <h2 className="predict-chart-title">Unusual days</h2>
          <p className="predict-chart-desc">Days when usage was much higher or lower than usual.</p>
          <ul className="predict-anomalies-list">
            {data.anomalies.slice(0, 5).map((a, i) => (
              <li key={i}>
                {new Date(a.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} — {a.value} kWh
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ManagerPredictiveAnalyticsPage;
