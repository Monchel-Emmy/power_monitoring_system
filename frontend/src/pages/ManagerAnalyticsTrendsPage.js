import React, { useEffect, useState } from 'react';
import './ManagerAnalyticsTrendsPage.css';

import { API_BASE } from '../config';

const ManagerAnalyticsTrendsPage = () => {
  const [data, setData] = useState(null);
  const [dateRange, setDateRange] = useState('7d');
  const [loading, setLoading] = useState(false);
  const [chartFullScreen, setChartFullScreen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/manager/analytics-trends?range=${dateRange}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load analytics', err);
        setLoading(false);
      });
  }, [dateRange]);

  useEffect(() => {
    if (!chartFullScreen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') setChartFullScreen(false);
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [chartFullScreen]);

  const weekly = data?.weeklyTrend ?? [];
  const maxUsage = weekly.length ? Math.max(...weekly.map((d) => d.usageKwh || 0), 100) : 16000;
  const maxCost = weekly.length ? Math.max(...weekly.map((d) => d.costDollars || 0), 500) : 3600;

  // Line chart dimensions
  const chartHeight = 220;
  const chartWidth = 700;
  const padding = { top: 10, right: 20, bottom: 36, left: 0 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const getUsageLinePath = () => {
    if (!weekly.length) return '';
    const divisor = Math.max(1, weekly.length - 1);
    const points = weekly.map((d, i) => {
      const x = padding.left + (i / divisor) * plotWidth;
      const pct = maxUsage > 0 ? (d.usageKwh || 0) / maxUsage : 0;
      const y = padding.top + plotHeight - Math.min(pct, 1) * plotHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  const getCostLinePath = () => {
    if (!weekly.length) return '';
    const divisor = Math.max(1, weekly.length - 1);
    const points = weekly.map((d, i) => {
      const x = padding.left + (i / divisor) * plotWidth;
      const pct = maxCost > 0 ? (d.costDollars || 0) / maxCost : 0;
      const y = padding.top + plotHeight - Math.min(pct, 1) * plotHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  const getUsageAreaPath = () => {
    const linePath = getUsageLinePath();
    if (!linePath || !weekly.length) return '';
    const divisor = Math.max(1, weekly.length - 1);
    const lastX = padding.left + plotWidth;
    const baseY = padding.top + plotHeight;
    return `${linePath} L ${lastX},${baseY} L ${padding.left},${baseY} Z`;
  };

  const chartTitle = dateRange === '1d' ? 'Hourly Consumption Trend' :
    dateRange === '7d' || dateRange === '14d' ? 'Daily Consumption Trend' :
    dateRange === '30d' ? 'Weekly Consumption Trend' : 'Monthly Consumption Trend';

  const renderChart = (isFullScreen) => (
    <div className={isFullScreen ? 'line-chart-wrapper line-chart-fullscreen' : 'line-chart-wrapper'}>
      <div className="chart-y-axis">
        {[0, 25, 50, 75, 100].map((percent) => {
          const value = Math.round((maxUsage * percent) / 100);
          const displayValue = value > 1000 ? Math.round(value / 100) * 100 : value > 100 ? Math.round(value / 10) * 10 : value;
          return (
            <div key={percent} className="y-axis-label">
              {displayValue.toLocaleString()}
            </div>
          );
        })}
      </div>
      <div className="line-chart-svg-wrap">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="line-chart-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id={isFullScreen ? 'usageGradientFull' : 'usageGradient'} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.25)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
            </linearGradient>
            <linearGradient id={isFullScreen ? 'costGradientFull' : 'costGradient'} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(34, 197, 94, 0.15)" />
              <stop offset="100%" stopColor="rgba(34, 197, 94, 0)" />
            </linearGradient>
          </defs>
          {[0, 25, 50, 75, 100].map((percent) => {
            const y = padding.top + plotHeight - (percent / 100) * plotHeight;
            return (
              <line key={percent} x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} className="line-chart-grid" />
            );
          })}
          <path d={getUsageAreaPath()} fill={isFullScreen ? 'url(#usageGradientFull)' : 'url(#usageGradient)'} className="line-chart-area" />
          <path d={getUsageLinePath()} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="line-chart-line line-usage" />
          <path d={getCostLinePath()} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="line-chart-line line-cost" />
        </svg>
        <div className="line-chart-x-labels">
          {weekly.map((d, i) => {
            const divisor = Math.max(1, weekly.length - 1);
            const xPct = (padding.left + (i / divisor) * plotWidth) / chartWidth * 100;
            return (
              <span key={`${d.day}-${i}`} className="line-chart-x-label" style={{ left: `${xPct}%`, transform: 'translateX(-50%)' }} title={d.day}>
                {d.day.length > 10 ? d.day.substring(0, 10) + '…' : d.day}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="manager-page manager-analytics-page">
      <div className="analytics-header">
        <div>
          <h1>Analytics &amp; Trends</h1>
          <p>Detailed energy consumption analysis and insights</p>
        </div>
        <select 
          className="analytics-date-filter" 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)}
          disabled={loading}
        >
          <option value="1d">Last 1 Day</option>
          <option value="7d">Last 7 Days</option>
          <option value="14d">Last 14 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="1y">Last 1 Year</option>
        </select>
      </div>

      <div className="manager-kpi-row analytics-kpi-row">
        <div className="manager-kpi-card analytics-kpi-card">
          <div className="kpi-label">Total Consumption</div>
          <div className="kpi-value">{data ? `${Number(data.totalConsumptionKwh).toLocaleString()} kWh` : '—'}</div>
          <div className={`kpi-sub kpi-trend ${(data?.totalConsumptionChangePercent || 0) < 0 ? 'kpi-trend-good' : ''}`}>
            {data ? `${data.totalConsumptionChangePercent >= 0 ? '+' : ''}${data.totalConsumptionChangePercent}% vs last week` : ''}
          </div>
        </div>
        <div className="manager-kpi-card analytics-kpi-card">
          <div className="kpi-label">Peak Demand</div>
          <div className="kpi-value">{data ? `${data.peakDemandKw} kW` : '—'}</div>
          <div className="kpi-sub kpi-sub-muted">{data?.peakTimestamp || ''}</div>
        </div>
        <div className="manager-kpi-card analytics-kpi-card">
          <div className="kpi-label">Average Daily</div>
          <div className="kpi-value">{data ? `${Number(data.avgDailyConsumptionKwh).toLocaleString()} kWh` : '—'}</div>
          <div className="kpi-sub kpi-trend-good">
            {data ? `+${data.avgDailyChangePercent}% vs avg` : ''}
          </div>
        </div>
        <div className="manager-kpi-card analytics-kpi-card">
          <div className="kpi-label">Efficiency Score</div>
          <div className="kpi-value">{data ? `${data.efficiencyScore}/100` : '—'}</div>
          <div className="kpi-sub kpi-trend-good">
            {data ? `+${data.efficiencyChange} points` : ''}
          </div>
        </div>
      </div>

      <div className="analytics-chart-card analytics-chart-card-fit">
        <div className="chart-header chart-header-with-expand">
          <div>
            <h2>{chartTitle}</h2>
            <p>
              {dateRange === '1d' ? 'Hourly energy usage and cost analysis' :
               dateRange === '7d' || dateRange === '14d' ? 'Daily energy usage and cost analysis' :
               dateRange === '30d' ? 'Weekly energy usage and cost analysis' :
               'Monthly energy usage and cost analysis'}
            </p>
          </div>
          {weekly.length > 0 && !loading && (
            <button
              type="button"
              className="chart-expand-btn"
              onClick={() => setChartFullScreen(true)}
              title="View chart full screen"
              aria-label="Expand chart to full screen"
            >
              <span className="chart-expand-icon">+</span>
            </button>
          )}
        </div>
        <div className="weekly-chart-container">
          {loading ? (
            <div className="chart-placeholder-text">Loading chart data...</div>
          ) : weekly.length > 0 ? (
            renderChart(false)
          ) : (
            <div className="chart-placeholder-text">No data available</div>
          )}
        </div>
        <div className="chart-legend">
          <span><span className="legend-swatch legend-usage" /> Usage (kWh)</span>
          <span><span className="legend-swatch legend-cost" /> Cost ($)</span>
        </div>
      </div>

      {/* Full-screen chart overlay */}
      {chartFullScreen && (
        <div className="chart-fullscreen-overlay" role="dialog" aria-modal="true" aria-label="Chart full screen">
          <div className="chart-fullscreen-backdrop" onClick={() => setChartFullScreen(false)} />
          <div className="chart-fullscreen-content" onClick={(e) => e.stopPropagation()}>
            <div className="chart-fullscreen-header">
              <h2>{chartTitle}</h2>
              <button
                type="button"
                className="chart-fullscreen-close"
                onClick={() => setChartFullScreen(false)}
                title="Close full screen"
                aria-label="Close full screen"
              >
                ×
              </button>
            </div>
            <div className="chart-fullscreen-body">
              {renderChart(true)}
            </div>
            <div className="chart-legend chart-fullscreen-legend">
              <span><span className="legend-swatch legend-usage" /> Usage (kWh)</span>
              <span><span className="legend-swatch legend-cost" /> Cost ($)</span>
            </div>
          </div>
        </div>
      )}

      <div className="analytics-two-col">
        <div className="analytics-chart-card">
          <div className="chart-header">
            <h2>Monthly Usage vs Prediction</h2>
            <p>Actual consumption compared to forecast</p>
          </div>
          <div className="monthly-chart-container">
            {loading ? (
              <div className="chart-placeholder-text">Loading chart data...</div>
            ) : data?.monthlyPrediction?.length ? (
              <div className="monthly-chart">
                {data.monthlyPrediction.map((m, i) => {
                  const maxVal = Math.max(...data.monthlyPrediction.map((x) => Math.max(x.actual || 0, x.predicted || 0)), 1);
                  const actualPct = maxVal > 0 ? Math.min((m.actual / maxVal) * 100, 100) : 5;
                  const predPct = maxVal > 0 ? Math.min((m.predicted / maxVal) * 100, 100) : 5;
                  return (
                    <div key={`${m.month}-${i}`} className="monthly-bar-wrap">
                      <div className="monthly-bars">
                        <div 
                          className="monthly-bar predicted" 
                          style={{ height: `${Math.max(predPct, 5)}%` }} 
                          title={`Predicted: ${(m.predicted || 0).toLocaleString()}`} 
                        />
                        <div 
                          className="monthly-bar actual" 
                          style={{ height: `${Math.max(actualPct, 5)}%` }} 
                          title={`Actual: ${(m.actual || 0).toLocaleString()}`} 
                        />
                      </div>
                      <span className="monthly-label">{m.month}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="chart-placeholder-text">No data available</div>
            )}
          </div>
          <div className="chart-legend">
            <span><span className="legend-swatch legend-actual" /> Actual Usage</span>
            <span><span className="legend-swatch legend-predicted" /> Predicted</span>
          </div>
        </div>

        <div className="analytics-chart-card">
          <div className="chart-header">
            <h2>Energy Distribution by Category</h2>
            <p>Breakdown of consumption by usage type</p>
          </div>
          <div className="pie-chart-container">
            {data?.energyDistribution?.length ? (
              <>
                <div
                  className="pie-chart"
                  style={{
                    background: `conic-gradient(${data.energyDistribution.map((e, i) => {
                      const start = data.energyDistribution.slice(0, i).reduce((s, x) => s + x.percent, 0);
                      const end = start + e.percent;
                      return `${e.color} ${start}% ${end}%`;
                    }).join(', ')})`,
                  }}
                />
                <div className="pie-legend">
                  {data.energyDistribution.map((e) => (
                    <div key={e.category} className="pie-legend-item">
                      <span className="pie-dot" style={{ backgroundColor: e.color }} />
                      <span>{e.category} {e.percent}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="chart-placeholder-text">Loading...</div>
            )}
          </div>
        </div>
      </div>

      <div className="analytics-insights-card">
        <div className="chart-header">
          <h2>Key Insights</h2>
          <p>AI-generated recommendations and observations</p>
        </div>
        <div className="insights-grid">
          {data?.keyInsights?.map((insight, i) => (
            <div key={i} className={`insight-card border-${insight.border || 'green'}`}>
              <h3>{insight.title}</h3>
              <p>{insight.recommendation}</p>
              {insight.benefit && <span className="insight-benefit">{insight.benefit}</span>}
              {insight.label && <span className="insight-label">{insight.label}</span>}
              {insight.comment && <span className="insight-comment">{insight.comment}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagerAnalyticsTrendsPage;
