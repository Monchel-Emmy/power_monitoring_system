import React, { useEffect, useState } from 'react';
import {
  FaPlus, FaBuilding, FaMapMarkerAlt,
  FaThLarge, FaServer,
} from 'react-icons/fa';
import './BuildingConfigurationPage.css';
import { API_BASE, getAuthHeaders } from '../config';

const ZONES_VISIBLE = 6;

const ManagerBuildingZonesPage = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    fetchBuildings();
    const iv = setInterval(fetchBuildings, 30000);
    return () => clearInterval(iv);
  }, []);

  const fetchBuildings = async () => {
    try {
      // Use manager-scoped endpoint so only assigned buildings are returned
      const res = await fetch(`${API_BASE}/api/manager/building-zones`, { headers: getAuthHeaders() });
      const data = await res.json();
      // building-zones returns { buildings: [...] }
      const list = Array.isArray(data) ? data : (data.buildings || []);
      setBuildings(list);
    } catch (err) {
      setError('Failed to fetch buildings.');
    } finally {
      setLoading(false);
    }
  };

  const totals = buildings.reduce(
    (acc, b) => {
      acc.buildings += 1;
      acc.zones    += b.totalZones   || 0;
      acc.devices  += b.totalDevices || 0;
      return acc;
    },
    { buildings: 0, zones: 0, devices: 0 }
  );

  const getZoneDisplay = (building) => {
    const dist = building.zoneDistribution || [];
    return {
      visible:   dist.slice(0, ZONES_VISIBLE),
      moreCount: Math.max(0, dist.length - ZONES_VISIBLE),
    };
  };
  if (loading) return <div className="building-config-page"><p className="loading-msg">Loading...</p></div>;
  if (error)   return <div className="building-config-page"><p className="error-msg">{error}</p></div>;

  return (
    <div className="building-config-page">
      <div className="building-config-header">
        <div>
          <h1>Homes &amp; Rooms</h1>
          <p>Monitor power use by home, room, and device</p>
        </div>
      </div>

      {/* Stats */}
      <div className="building-config-stats">
        <div className="config-stat-card stat-buildings">
          <h3>Homes</h3>
          <p>{totals.buildings}</p>
        </div>
        <div className="config-stat-card stat-zones">
          <h3>Rooms</h3>
          <p>{totals.zones}</p>
        </div>
        <div className="config-stat-card stat-devices">
          <h3>Total Devices</h3>
          <p>{totals.devices}</p>
        </div>
      </div>

      {/* Building cards */}
      {buildings.length === 0 ? (
        <p className="no-buildings">No homes assigned to you yet. Ask an admin to assign homes in User Management.</p>
      ) : (
        <div className="building-list">
          {buildings.map((building) => {
            const { visible, moreCount } = getZoneDisplay(building);
            const zones   = building.totalZones   ?? 0;
            const devices = building.totalDevices ?? 0;
            const status  = building.status || 'active';

            return (
              <div key={building._id} className="building-card">
                <div className="building-card-header">
                  <div className="building-icon-wrap">
                    <FaBuilding className="building-icon" />
                  </div>
                  <div className="building-info">
                    <h2>{building.name}</h2>
                    <p className="building-address">
                      <FaMapMarkerAlt className="pin-icon" /> {building.address || '—'}
                    </p>
                  </div>
                  <div className="building-header-right">
                    <span className={`building-status-tag status-${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </div>
                </div>

                <div className="building-metrics">
                  <div className="metric-card">
                    <FaThLarge className="metric-icon" />
                    <span className="metric-value">{zones}</span>
                    <span className="metric-label">Rooms</span>
                  </div>
                  <div className="metric-card">
                    <FaServer className="metric-icon" />
                    <span className="metric-value">{devices}</span>
                    <span className="metric-label">Devices</span>
                  </div>
                  {building.currentUsageKw != null && (
                    <div className="metric-card">
                      <span className="metric-icon" style={{fontSize:'1.1rem'}}>⚡</span>
                      <span className="metric-value">{building.currentUsageKw}</span>
                      <span className="metric-label">kW Now</span>
                    </div>
                  )}
                </div>

                {visible.length > 0 && (
                  <div className="zone-distribution">
                    <h3>Rooms</h3>
                    <div className="zone-chips-grid">
                      {visible.map((z, idx) => (
                        <div key={z.zoneName || idx} className="zone-chip">
                          <span className="zone-name">{z.zoneName}</span>
                          <span className="zone-devices">{z.devicesCount ?? 0} devices</span>
                        </div>
                      ))}
                      {moreCount > 0 && (
                        <div className="zone-more-chip">+{moreCount} more</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManagerBuildingZonesPage;
