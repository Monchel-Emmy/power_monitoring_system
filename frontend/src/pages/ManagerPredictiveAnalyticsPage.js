import React, { useEffect, useState } from 'react';
import './ManagerPredictiveAnalyticsPage.css';

import { API_BASE } from '../config';

const ManagerPredictiveAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [forecastDays, setForecastDays] = useState(7);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPredictive = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/manager/predictive?days=${forecastDays}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load predictive analytics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictive();
  }, [forecastDays]);

  // Prepare chart data
  const forecastSeries = data?.forecastSeries;
  const chartData = forecastSeries?.values?.map((val, i) => {
    const forecast = val || 0;
    const upper = forecastSeries.upperBounds?.[i] || forecast * 1.2;
    const lower = forecastSeries.lowerBounds?.[i] || forecast * 0.8;
    return {
      day: i + 1,
      forecast: Math.max(0, forecast),
      upper: Math.max(forecast, upper),
      lower: Math.max(0, lower),
    };
  }).filter((d) => d.forecast > 0 || d.upper > 0) || [];

  // Ensure we have a valid max value for chart scaling
  const allValues = chartData.flatMap((d) => [d.forecast, d.upper, d.lower]).filter((v) => v > 0);
  const maxValue = allValues.length > 0
    ? Math.max(...allValues, 1000)
    : 15000;
  
  // Debug log
  if (chartData.length === 0 && data) {
    console.log('No chart data:', { forecastSeries, data });
  }
  const chartHeight = 260;
  const chartWidth = 800;
  const padding = 40;

  const getXPosition = (index) => {
    if (chartData.length === 1) return padding + (chartWidth - padding * 2) / 2;
    return padding + (index / Math.max(1, chartData.length - 1)) * (chartWidth - padding * 2);
  };

  const getConfidenceAreaPath = () => {
    if (!chartData.length) return '';
    const points = [];
    chartData.forEach((d, i) => {
      const x = getXPosition(i);
      const yUpper = padding + (1 - Math.min(d.upper / maxValue, 1)) * (chartHeight - padding * 2);
      points.push(`${x},${yUpper}`);
    });
    chartData.slice().reverse().forEach((d, i) => {
      const idx = chartData.length - 1 - i;
      const x = getXPosition(idx);
      const yLower = padding + (1 - Math.min(d.lower / maxValue, 1)) * (chartHeight - padding * 2);
      points.push(`${x},${yLower}`);
    });
    return `M ${points.join(' L ')} Z`;
  };

  const getForecastLinePath = () => {
    if (!chartData.length) return '';
    const points = chartData.map((d, i) => {
      const x = getXPosition(i);
      const y = padding + (1 - Math.min(d.forecast / maxValue, 1)) * (chartHeight - padding * 2);
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };
  return (
    <div className="manager-page manager-predictive-page">
      <div className="manager-page-header">
        <h1>Predictive Analytics</h1>
        <p>
          AI-powered forecasting, anomaly detection, and predictive maintenance for
          optimized energy management
        </p>
      </div>

      <div className="manager-kpi-row">
        <div className="manager-kpi-card">
          <div className="kpi-label">Tomorrow&apos;s Forecast</div>
          <div className="kpi-value">
            {data ? `${data.tomorrowsForecastKwh} kWh` : '—'}
          </div>
          <div className={`kpi-sub ${(data?.forecastChangePercent || 0) >= 0 ? 'kpi-sub-up' : 'kpi-sub-down'}`}>
            {data ? `${data.forecastChangePercent >= 0 ? '+' : ''}${data.forecastChangePercent}%` : ''}
          </div>
        </div>
        <div className="manager-kpi-card">
          <div className="kpi-label">Prediction Accuracy</div>
          <div className="kpi-value">
            {data?.predictionAccuracyLabel || '—'}
          </div>
          <div className="kpi-sub kpi-sub-normal">
            {data ? `${data.predictionAccuracyPercent}%` : ''}
          </div>
        </div>
        <div className="manager-kpi-card">
          <div className="kpi-label">Anomalies (Week)</div>
          <div className="kpi-value">
            {data ? data.weeklyAnomalies : '—'}
          </div>
          <div className="kpi-sub kpi-sub-alert">
            {data ? `${data.activeAnomalies} Active` : ''}
          </div>
        </div>
        <div className="manager-kpi-card">
          <div className="kpi-label">Next Peak Day</div>
          <div className="kpi-value">
            {data ? new Date(data.nextPeakDay).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            }) : '—'}
          </div>
          <div className="kpi-sub">Forecasted</div>
        </div>
      </div>

      <div className="predictive-chart-card">
        <div className="chart-header">
          <div>
            <h2>Consumption Forecasting</h2>
            <p>
              AI-powered predictive modeling with confidence intervals for accurate energy consumption forecasts
            </p>
          </div>
          <div className="forecast-period-selector">
            <select
              className="forecast-select"
              value={forecastDays}
              onChange={(e) => setForecastDays(parseInt(e.target.value, 10))}
              disabled={loading}
            >
              <option value={1}>1 Day</option>
              <option value={2}>2 Days</option>
              <option value={3}>3 Days</option>
              <option value={4}>4 Days</option>
              <option value={5}>5 Days</option>
              <option value={6}>6 Days</option>
              <option value={7}>7 Days</option>
              <option value={30}>1 Month (30 Days)</option>
              <option value={365}>1 Year (365 Days)</option>
            </select>
          </div>
        </div>

        <div className="predictive-chart-container">
          {loading ? (
            <div className="predictive-chart-placeholder">
              <div className="chart-loading-text">Loading forecast data...</div>
            </div>
          ) : chartData.length > 0 ? (
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight + 60}`}
              className="predictive-chart-svg"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(37, 99, 235, 0.2)" />
                  <stop offset="100%" stopColor="rgba(37, 99, 235, 0.05)" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padding + ratio * (chartHeight - padding * 2);
                const value = Math.round(maxValue * (1 - ratio));
                return (
                  <g key={ratio}>
                    <line
                      x1={padding}
                      y1={y}
                      x2={chartWidth - padding}
                      y2={y}
                      className="predictive-grid-line"
                    />
                    <text
                      x={padding - 10}
                      y={y + 4}
                      className="predictive-y-label"
                      textAnchor="end"
                    >
                      {value.toLocaleString()}
                    </text>
                  </g>
                );
              })}
              {/* Confidence interval area */}
              <path
                d={getConfidenceAreaPath()}
                fill="url(#confidenceGradient)"
                className="predictive-confidence-area"
              />
              {/* Forecast line */}
              <path
                d={getForecastLinePath()}
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                className="predictive-forecast-line"
              />
              {/* Data points */}
              {chartData.map((d, i) => {
                const x = getXPosition(i);
                const y = padding + (1 - Math.min(d.forecast / maxValue, 1)) * (chartHeight - padding * 2);
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#2563eb"
                    className="predictive-data-point"
                  />
                );
              })}
              {/* X-axis labels */}
              {chartData.map((d, i) => {
                const x = getXPosition(i);
                const date = new Date();
                date.setDate(date.getDate() + i + 1);
                let label;
                if (forecastDays <= 7) {
                  label = `Day ${i + 1}`;
                } else if (forecastDays === 30) {
                  // Show every 5th day for monthly view
                  if (i % 5 === 0 || i === chartData.length - 1) {
                    label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  } else {
                    label = '';
                  }
                } else {
                  // Show monthly labels for yearly view
                  const prevDate = i > 0 ? new Date(date.getTime() - 24 * 60 * 60 * 1000) : date;
                  if (date.getMonth() !== prevDate.getMonth() || i === 0 || i === chartData.length - 1) {
                    label = date.toLocaleDateString(undefined, { month: 'short' });
                  } else {
                    label = '';
                  }
                }
                if (label) {
                  return (
                    <text
                      key={i}
                      x={x}
                      y={chartHeight - 10}
                      className="predictive-x-label"
                      textAnchor="middle"
                    >
                      {label}
                    </text>
                  );
                }
                return null;
              })}
            </svg>
          ) : (
            <div className="predictive-chart-placeholder">
              <div className="chart-loading-text">
                {data ? 'No forecast data available' : 'Loading forecast data...'}
              </div>
            </div>
          )}
        </div>
        {chartData.length > 0 && (
          <div className="predictive-chart-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#2563eb' }} />
              <span>Forecast</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: 'rgba(37, 99, 235, 0.2)' }} />
              <span>95% Confidence Interval</span>
            </div>
          </div>
        )}
      </div>

      {/* Anomalies section */}
      {data?.anomalies && data.anomalies.length > 0 && (
        <div className="predictive-anomalies-card">
          <div className="chart-header">
            <div>
              <h2>Detected Anomalies</h2>
              <p>AI-detected unusual consumption patterns requiring attention</p>
            </div>
          </div>
          <div className="anomalies-list">
            {data.anomalies.slice(0, 5).map((anomaly, i) => (
              <div key={i} className="anomaly-item">
                <div className="anomaly-severity" data-severity={anomaly.severity || 'medium'}>
                  {anomaly.severity === 'high' ? '🔴' : '🟡'}
                </div>
                <div className="anomaly-details">
                  <div className="anomaly-value">{anomaly.value} kWh</div>
                  <div className="anomaly-date">
                    {new Date(anomaly.timestamp).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                {anomaly.zScore && (
                  <div className="anomaly-score">Z-score: {anomaly.zScore}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerPredictiveAnalyticsPage;

