import React, { useEffect, useState } from 'react';
import './ManagerSustainabilityPage.css';
import { API_BASE } from '../config';

const ManagerSustainabilityPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/manager/sustainability`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load sustainability data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const maxCO2 = data?.monthlyTrend?.length
    ? Math.max(...data.monthlyTrend.map((m) => m.co2Tons), 1)
    : 5;
  
  const maxRenewable = 100; // Renewable is always 0-100%

  return (
    <div className="manager-page manager-sustainability-page">
      <div className="manager-page-header">
        <h1>Sustainability</h1>
        <p>
          Track CO₂ savings, renewable adoption, and sustainability initiatives across
          your buildings
        </p>
      </div>

      <div className="manager-kpi-row">
        <div className="manager-kpi-card">
          <div className="kpi-label">CO₂ Saved (YTD)</div>
          <div className="kpi-value">
            {loading ? '—' : data ? `${data.co2Saved} t` : '—'}
          </div>
          <div className="kpi-sub kpi-sub-normal">vs baseline</div>
        </div>
        <div className="manager-kpi-card">
          <div className="kpi-label">Renewable Share</div>
          <div className="kpi-value">
            {loading ? '—' : data ? `${data.renewableShare}%` : '—'}
          </div>
          <div className="kpi-sub">Energy mix</div>
        </div>
        <div className="manager-kpi-card">
          <div className="kpi-label">Efficiency Score</div>
          <div className="kpi-value">
            {loading ? '—' : data?.efficiencyScore || '—'}
          </div>
          <div className="kpi-sub">Portfolio average</div>
        </div>
        <div className="manager-kpi-card">
          <div className="kpi-label">Active Initiatives</div>
          <div className="kpi-value">
            {loading ? '—' : data?.greenProjects || '—'}
          </div>
          <div className="kpi-sub">In progress</div>
        </div>
      </div>

      <div className="sustainability-progress-card">
        <h2>1. Renewable Energy &amp; Emissions Trend</h2>
        <p>
          Monitor progress towards your sustainability targets, including renewable
          adoption and CO₂ reductions.
        </p>
        {data?.monthlyTrend?.length ? (
          <div className="sustainability-chart-container">
            <div className="sustainability-chart-wrapper">
              <div className="sustainability-chart-y-axis">
                <div className="sustainability-y-axis-label">CO₂ (tons)</div>
                <div className="sustainability-y-axis-ticks">
                  {[100, 75, 50, 25, 0].map((pct) => {
                    const value = Math.round((maxCO2 * pct) / 100 * 10) / 10;
                    return (
                      <div key={pct} className="sustainability-y-axis-tick">
                        <span className="sustainability-y-axis-tick-line" />
                        <span className="sustainability-y-axis-tick-label">{value.toFixed(1)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="sustainability-chart">
                {data.monthlyTrend.map((m, i) => {
                  const co2Height = Math.max(4, (m.co2Tons / maxCO2) * 100);
                  const renewableHeight = Math.max(4, m.renewablePercent);
                  const displayMonth = m.month.split(' ')[0];
                  return (
                    <div key={i} className="sustainability-chart-bar-wrap">
                      <div className="sustainability-chart-bars">
                        <div className="sustainability-bar-area">
                          <div 
                            className="sustainability-bar co2-bar" 
                            style={{ height: `${co2Height}%` }} 
                            title={`${m.month}: CO₂ ${m.co2Tons} t, Renewable ${m.renewablePercent}%`} 
                          />
                        </div>
                        <div className="sustainability-bar-area">
                          <div 
                            className="sustainability-bar renewable-bar" 
                            style={{ height: `${renewableHeight}%` }} 
                            title={`${m.month}: Renewable ${m.renewablePercent}%`} 
                          />
                        </div>
                      </div>
                      <span className="sustainability-chart-label">{displayMonth}</span>
                    </div>
                  );
                })}
              </div>
              <div className="sustainability-chart-y-axis renewable-axis">
                <div className="sustainability-y-axis-label">Renewable (%)</div>
                <div className="sustainability-y-axis-ticks">
                  {[100, 75, 50, 25, 0].map((pct) => (
                    <div key={pct} className="sustainability-y-axis-tick">
                      <span className="sustainability-y-axis-tick-line" />
                      <span className="sustainability-y-axis-tick-label">{pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="sustainability-chart-legend">
              <span><span className="legend-dot co2-dot" /> CO₂ Emissions (tons)</span>
              <span><span className="legend-dot renewable-dot" /> Renewable Share (%)</span>
            </div>
          </div>
        ) : (
          <div className="sustainability-chart-placeholder">Loading chart...</div>
        )}
      </div>

      <div className="sustainability-initiatives-card">
        <h2>2. Sustainability Initiatives</h2>
        {loading ? (
          <div className="sustainability-loading">Loading...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Initiative</th>
                <th>Building</th>
                <th>Impact</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {data?.initiatives?.map((i) => (
                <tr key={i.id}>
                  <td>{i.name}</td>
                  <td>{i.building}</td>
                  <td>
                    <span className={`impact-badge impact-${i.impact.toLowerCase().replace(' ', '-')}`}>
                      {i.impact}
                    </span>
                  </td>
                  <td>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${i.progress}%` }}
                      />
                    </div>
                    <span className="progress-label">{i.progress}%</span>
                  </td>
                </tr>
              ))}
              {(!data?.initiatives?.length) && (
                <tr>
                  <td colSpan="4" className="sustainability-empty">No initiatives data</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManagerSustainabilityPage;
