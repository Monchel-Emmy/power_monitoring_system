import React, { useEffect, useState } from 'react';
import { HiLightningBolt, HiCurrencyDollar, HiExclamation, HiOfficeBuilding, HiX } from 'react-icons/hi';
import './ManagerMobileMonitoringPage.css';
import { API_BASE } from '../config';

const ManagerMobileMonitoringPage = () => {
  const [data, setData] = useState(null);
  const [detailsBuilding, setDetailsBuilding] = useState(null);
  const [detailsExtra, setDetailsExtra] = useState(null);

  const openDetails = (b) => {
    setDetailsBuilding(b);
    setDetailsExtra(null);
    if (b?.name) {
      fetch(`${API_BASE}/api/manager/building-zones`)
        .then((res) => res.ok ? res.json() : null)
        .then((json) => {
          const full = json?.buildings?.find((x) => x.name === b.name);
          if (full) setDetailsExtra(full);
        })
        .catch(() => {});
    }
  };

  const closeDetails = () => {
    setDetailsBuilding(null);
    setDetailsExtra(null);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/manager/mobile-overview`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load mobile overview', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="manager-page manager-mobile-page">
      <div className="manager-page-header">
        <h1>Mobile Monitoring Module</h1>
        <p>
          Mobile-optimized energy monitoring with offline access, push
          notifications, and touch-friendly controls
        </p>
      </div>

      <div className="mobile-banner">
        <div className="mobile-banner-left">
          <div className="mobile-banner-icon">
            <HiLightningBolt />
          </div>
          <div>
            <h2>Mobile Dashboard Active</h2>
            <p>Optimized for mobile devices</p>
            {data && <span className="mobile-banner-alerts">{data.newAlerts} New Alerts</span>}
          </div>
        </div>
        <div className="mobile-banner-metrics">
          <div className="mobile-metric">
            <span className="mobile-metric-label">Data Synced</span>
            <span className="mobile-metric-value">{data?.dataSynced ?? '3/4'}</span>
          </div>
          <div className="mobile-metric">
            <span className="mobile-metric-label">Push Enabled</span>
            <span className="mobile-metric-value">{data?.pushEnabled ?? 4}</span>
          </div>
          <div className="mobile-metric">
            <span className="mobile-metric-label">Uptime</span>
            <span className="mobile-metric-value">{data?.uptimePercent ?? 98}%</span>
          </div>
        </div>
        <div className="mobile-banner-status">
          <span className="wifi-dot" /> Online
        </div>
      </div>

      <div className="mobile-dashboard-section">
        <h2>1. Mobile-Responsive Dashboard</h2>
        <p>
          Adaptive layout optimized for smartphones and tablets with touch-friendly
          interface and gestures support
        </p>

        <div className="mobile-stat-grid">
          <div className="mobile-stat-card blue">
            <div className="stat-icon"><HiLightningBolt /></div>
            <div className="label">Current Usage</div>
            <div className="value">{data ? `${Number(data.currentUsageKwh).toLocaleString()} kWh` : '—'}</div>
            <div className="sub">{data ? `+${data.usageTrendPercent}% vs yesterday` : ''}</div>
            <div className="stat-chart-icon" />
          </div>
          <div className="mobile-stat-card green">
            <div className="stat-icon"><HiCurrencyDollar /></div>
            <div className="label">Today&apos;s Cost</div>
            <div className="value">{data ? `$${Number(data.todayCost).toLocaleString()}` : '—'}</div>
            <div className="sub">{data ? `${data.costTrendPercent}% savings` : ''}</div>
            <div className="stat-chart-icon" />
          </div>
          <div className="mobile-stat-card amber">
            <div className="stat-icon"><HiExclamation /></div>
            <div className="label">Active Alerts</div>
            <div className="value">{data ? data.activeAlerts : '—'}</div>
            <div className="sub">Requires attention</div>
          </div>
          <div className="mobile-stat-card violet">
            <div className="stat-icon"><HiOfficeBuilding /></div>
            <div className="label">Homes Online</div>
            <div className="value">{data?.buildingsOnline ?? '—'}</div>
            <div className="sub">{data?.buildingsAllActive ? 'All active' : 'Some offline'}</div>
          </div>
        </div>
      </div>

      <div className="mobile-buildings-section">
        <h2>Home Status</h2>
        <div className="mobile-buildings-scroll">
          {(data?.buildings ?? []).map((b) => (
            <div key={b.name} className={`mobile-building-card accent-${b.accent || 'blue'}`}>
              <div className="building-card-icon">
                <HiOfficeBuilding />
              </div>
              <div className="building-card-name">{b.name}</div>
              <div className={`building-card-status status-${b.status?.toLowerCase()}`}>{b.status}</div>
              <div className="building-card-usage">
                <span className="usage-label">Usage</span>
                <span className="usage-value">{b.usageKw} kW</span>
              </div>
              <div className="building-card-bar">
                <div className="building-bar-fill" style={{ width: `${Math.min(100, b.usagePct || 0)}%` }} />
              </div>
              <button type="button" className="building-view-btn" onClick={() => openDetails(b)}>View Details</button>
            </div>
          ))}
          {(!data?.buildings?.length) && (
            <div className="mobile-building-card accent-blue">
              <p className="no-building-data">No homes yet. Run seed or add a home.</p>
            </div>
          )}
        </div>
      </div>

      {detailsBuilding && (
        <div className="mobile-details-overlay" onClick={closeDetails} role="presentation">
          <div className="mobile-details-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="mobile-details-title">
            <div className="mobile-details-header">
              <h2 id="mobile-details-title">{detailsBuilding.name}</h2>
              <button type="button" className="mobile-details-close" onClick={closeDetails} aria-label="Close">
                <HiX />
              </button>
            </div>
            <div className={`mobile-details-status status-${detailsBuilding.status?.toLowerCase()}`}>
              {detailsBuilding.status}
            </div>
            <div className="mobile-details-grid">
              <div className="mobile-details-item">
                <span className="mobile-details-label">Current usage</span>
                <span className="mobile-details-value">{detailsBuilding.usageKw} kW</span>
              </div>
              <div className="mobile-details-item">
                <span className="mobile-details-label">Capacity</span>
                <span className="mobile-details-value">{Math.min(100, Math.round(detailsBuilding.usagePct || 0))}%</span>
              </div>
              {detailsExtra && (
                <>
                  {detailsExtra.address && (
                    <div className="mobile-details-item full">
                    <span className="mobile-details-label">Address</span>
                    <span className="mobile-details-value">{detailsExtra.address}</span>
                    </div>
                  )}
                  <div className="mobile-details-item">
                    <span className="mobile-details-label">Floors</span>
                    <span className="mobile-details-value">{detailsExtra.totalFloors ?? '—'}</span>
                  </div>
                  <div className="mobile-details-item">
                    <span className="mobile-details-label">Rooms</span>
                    <span className="mobile-details-value">{detailsExtra.totalZones ?? '—'}</span>
                  </div>
                  <div className="mobile-details-item">
                    <span className="mobile-details-label">Devices</span>
                    <span className="mobile-details-value">{detailsExtra.totalDevices ?? '—'}</span>
                  </div>
                  {detailsExtra.trend && (
                    <div className="mobile-details-item">
                      <span className="mobile-details-label">Trend</span>
                      <span className="mobile-details-value">{detailsExtra.trend}</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="mobile-details-bar-wrap">
              <span className="mobile-details-label">Usage bar</span>
              <div className="mobile-details-bar">
                <div className="mobile-details-bar-fill" style={{ width: `${Math.min(100, detailsBuilding.usagePct || 0)}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerMobileMonitoringPage;
