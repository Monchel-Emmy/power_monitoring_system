import React, { useEffect, useState } from 'react';
import './ManagerCostManagementPage.css';
import { API_BASE } from '../config';

const ManagerCostManagementPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('12m');

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const range = timeRange === '3y' ? '3y' : '12m';
        const res = await fetch(`${API_BASE}/api/manager/cost-management?range=${range}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load cost data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const formatCurrency = (amount) => {
    return `$${Number(amount).toLocaleString()}`;
  };

  const maxCost = data?.monthlyTrend?.length
    ? Math.max(...data.monthlyTrend.map((m) => m.cost), 1)
    : 50000;

  return (
    <div className="manager-page manager-cost-page">
      <div className="manager-page-header">
        <h1>Cost Management</h1>
        <p>
          Monitor energy spend, track budget variance, and identify cost-saving
          opportunities
        </p>
      </div>

      <div className="manager-kpi-row">
        <div className="manager-kpi-card">
          <div className="kpi-label">Current Month Cost</div>
          <div className="kpi-value">
            {loading ? '—' : data ? formatCurrency(data.totalCost) : '—'}
          </div>
          <div className="kpi-sub">{data?.month || ''}</div>
        </div>
        <div className="manager-kpi-card">
          <div className="kpi-label">Budget Variance</div>
          <div className="kpi-value">
            {loading ? '—' : data ? `${data.budgetVariance >= 0 ? '+' : ''}${data.budgetVariance}%` : '—'}
          </div>
          <div className={`kpi-sub ${(data?.budgetVariance || 0) < 0 ? 'kpi-sub-normal' : 'kpi-sub-alert'}`}>
            {data?.budgetVariance < 0 ? 'Under budget' : 'Over budget'}
          </div>
        </div>
        <div className="manager-kpi-card">
          <div className="kpi-label">Peak Demand Charges</div>
          <div className="kpi-value">
            {loading ? '—' : data ? formatCurrency(data.peakDemandCharges) : '—'}
          </div>
          <div className="kpi-sub">This billing period</div>
        </div>
        <div className="manager-kpi-card">
          <div className="kpi-label">Optimization Savings</div>
          <div className="kpi-value">
            {loading ? '—' : data ? formatCurrency(data.savingsFromOptimization) : '—'}
          </div>
          <div className="kpi-sub kpi-sub-normal">Estimated</div>
        </div>
      </div>

      <div className="cost-chart-card">
        <div className="chart-header">
          <div>
            <h2>1. Monthly Cost Trend</h2>
            <p>Track monthly energy spend and identify cost spikes.</p>
          </div>
          <div className="cost-toggle">
            <button
              className={`cost-btn ${timeRange === '12m' ? 'active' : ''}`}
              onClick={() => setTimeRange('12m')}
            >
              12 Months
            </button>
            <button
              className={`cost-btn ${timeRange === '3y' ? 'active' : ''}`}
              onClick={() => setTimeRange('3y')}
            >
              3 Years
            </button>
          </div>
        </div>
        {data?.monthlyTrend?.length ? (
          <div className="cost-chart-container">
            <div className="cost-chart-wrapper">
              <div className="cost-chart-y-axis">
                <div className="cost-y-axis-label">Cost ($)</div>
                <div className="cost-y-axis-ticks">
                  {[100, 75, 50, 25, 0].map((pct) => {
                    const value = Math.round((maxCost * pct) / 100);
                    return (
                      <div key={pct} className="cost-y-axis-tick">
                        <span className="cost-y-axis-tick-line" />
                        <span className="cost-y-axis-tick-label">{formatCurrency(value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="cost-chart">
                {data.monthlyTrend.map((m, i) => {
                  const heightPct = Math.max(8, Math.min(100, (m.cost / maxCost) * 100));
                  const displayLabel = timeRange === '3y'
                    ? (m.month.split(' ')[0] || '') + ' ' + (m.month.split(' ')[1] || '').slice(-2)
                    : (m.month.split(' ')[0] || '').slice(0, 3);
                  return (
                    <div key={i} className="cost-chart-bar-wrap">
                      <div className="cost-chart-bar-area">
                        <div
                          className="cost-chart-bar"
                          style={{ height: `${heightPct}%` }}
                          title={`${m.month}: ${formatCurrency(m.cost)}`}
                        />
                      </div>
                      <span className="cost-chart-label">{displayLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="cost-chart-placeholder">Loading chart...</div>
        )}
      </div>

      <div className="cost-table-card">
        <h2>2. Building Cost Breakdown</h2>
        {loading ? (
          <div className="cost-loading">Loading...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Building</th>
                <th>Monthly Cost</th>
                <th>Budget Variance</th>
              </tr>
            </thead>
            <tbody>
              {data?.buildingCosts?.map((b, i) => (
                <tr key={i}>
                  <td>{b.name}</td>
                  <td>{formatCurrency(b.cost)}</td>
                  <td className={b.variance < 0 ? 'variance-good' : 'variance-bad'}>
                    {b.variance >= 0 ? '+' : ''}{b.variance}%
                  </td>
                </tr>
              ))}
              {(!data?.buildingCosts?.length) && (
                <tr>
                  <td colSpan="3" className="cost-empty">No building data. Run seed to populate.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManagerCostManagementPage;
