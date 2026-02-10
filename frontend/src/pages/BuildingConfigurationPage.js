import React, { useEffect, useState } from 'react';
import './BuildingConfigurationPage.css';
import { FaPlus, FaBuilding, FaMapMarkerAlt, FaEdit, FaLayerGroup, FaThLarge, FaServer } from 'react-icons/fa';
import Modal from '../components/Modal';

import { API_BASE } from '../config';
const ZONES_VISIBLE = 10;

const defaultNewBuilding = {
  name: '',
  address: '',
  status: 'active',
  totalFloors: 1,
  totalZones: 0,
  totalDevices: 0,
  totalArea: 0,
};

const BuildingConfigurationPage = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBuilding, setNewBuilding] = useState({ ...defaultNewBuilding });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentBuilding, setCurrentBuilding] = useState(null);

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/buildings`);
      const data = await res.json();
      setBuildings(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch buildings.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totals = buildings.reduce(
    (acc, b) => {
      acc.buildings += 1;
      acc.zones += b.totalZones || b.zones || 0;
      acc.devices += b.totalDevices || b.devices || 0;
      acc.floors += b.totalFloors || b.floors || 0;
      return acc;
    },
    { buildings: 0, zones: 0, devices: 0, floors: 0 }
  );

  const formatArea = (n) => {
    const num = Number(n) || 0;
    return num.toLocaleString() + ' sq ft';
  };

  const getZoneDisplay = (building) => {
    const dist = building.zoneDistribution || [];
    const visible = dist.slice(0, ZONES_VISIBLE);
    const moreCount = Math.max(0, dist.length - ZONES_VISIBLE);
    return { visible, moreCount };
  };

  const handleAddSubmit = async (e) => {
    e?.preventDefault?.();
    try {
      const payload = {
        name: newBuilding.name.trim(),
        address: newBuilding.address.trim(),
        status: newBuilding.status,
        totalFloors: Number(newBuilding.totalFloors) || 1,
        totalZones: Number(newBuilding.totalZones) || 0,
        totalDevices: Number(newBuilding.totalDevices) || 0,
        totalArea: Number(newBuilding.totalArea) || 0,
      };
      const res = await fetch(`${API_BASE}/api/buildings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to add building');
      const created = await res.json();
      setBuildings((prev) => [...prev, created]);
      setIsAddModalOpen(false);
      setNewBuilding({ ...defaultNewBuilding });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditBuilding = (building) => {
    setCurrentBuilding({ ...building });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e?.preventDefault?.();
    if (!currentBuilding || !currentBuilding._id) return;
    try {
      const payload = {
        name: currentBuilding.name.trim(),
        address: currentBuilding.address.trim(),
        status: currentBuilding.status,
        totalFloors: Number(currentBuilding.totalFloors) || 1,
        totalZones: Number(currentBuilding.totalZones) || 0,
        totalDevices: Number(currentBuilding.totalDevices) || 0,
        totalArea: Number(currentBuilding.totalArea) || 0,
      };
      const res = await fetch(`${API_BASE}/api/buildings/${currentBuilding._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update building');
      const updated = await res.json();
      setBuildings((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
      setIsEditModalOpen(false);
      setCurrentBuilding(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="building-config-page"><p className="loading-msg">Loading...</p></div>;
  if (error) return <div className="building-config-page"><p className="error-msg">{error}</p></div>;

  return (
    <div className="building-config-page">
      <div className="building-config-header">
        <div>
          <h1>Building Configuration</h1>
          <p>Manage buildings, zones, and spatial hierarchy</p>
        </div>
        <button type="button" className="add-building-btn" onClick={() => setIsAddModalOpen(true)}>
          <FaPlus /> Add Building
        </button>
      </div>

      <div className="building-config-stats">
        <div className="config-stat-card stat-buildings">
          <h3>Total Buildings</h3>
          <p>{totals.buildings}</p>
        </div>
        <div className="config-stat-card stat-zones">
          <h3>Total Zones</h3>
          <p>{totals.zones}</p>
        </div>
        <div className="config-stat-card stat-devices">
          <h3>Total Devices</h3>
          <p>{totals.devices}</p>
        </div>
        <div className="config-stat-card stat-floors">
          <h3>Total Floors</h3>
          <p>{totals.floors}</p>
        </div>
      </div>

      <div className="building-list">
        {buildings.map((building) => {
          const { visible, moreCount } = getZoneDisplay(building);
          const floors = building.totalFloors ?? building.floors ?? 0;
          const zones = building.totalZones ?? building.zones ?? 0;
          const devices = building.totalDevices ?? building.devices ?? 0;
          const area = building.totalArea ?? building.area ?? 0;
          return (
            <div key={building._id} className="building-card">
              <div className="building-card-header">
                <div className="building-icon-wrap">
                  <FaBuilding className="building-icon" />
                </div>
                <div className="building-info">
                  <h2>{building.name}</h2>
                  <p className="building-address">
                    <FaMapMarkerAlt className="pin-icon" /> {building.address}
                  </p>
                </div>
                <div className="building-header-right">
                  <span className={`building-status-tag status-${(building.status || 'active')}`}>
                    {building.status}
                  </span>
                  <button type="button" className="edit-building-btn" onClick={() => handleEditBuilding(building)} aria-label="Edit">
                    <FaEdit />
                  </button>
                </div>
              </div>

              <div className="building-metrics">
                <div className="metric-card">
                  <FaLayerGroup className="metric-icon" />
                  <span className="metric-value">{floors}</span>
                  <span className="metric-label">Floors</span>
                </div>
                <div className="metric-card">
                  <FaThLarge className="metric-icon" />
                  <span className="metric-value">{zones}</span>
                  <span className="metric-label">Zones</span>
                </div>
                <div className="metric-card">
                  <FaServer className="metric-icon" />
                  <span className="metric-value">{devices}</span>
                  <span className="metric-label">Devices</span>
                </div>
                <div className="metric-card">
                  <span className="metric-value">{formatArea(area)}</span>
                  <span className="metric-label">Total Area</span>
                </div>
              </div>

              <div className="zone-distribution">
                <h3>Zone Distribution</h3>
                <div className="zone-chips-grid">
                  {visible.map((z, idx) => (
                    <div key={z.zoneName || idx} className="zone-chip">
                      <span className="zone-name">{z.zoneName}</span>
                      <span className="zone-devices">{z.devicesCount ?? z.devices ?? 0} devices</span>
                    </div>
                  ))}
                  {moreCount > 0 && (
                    <button type="button" className="zone-more-chip">+{moreCount} more</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {buildings.length === 0 && (
        <p className="no-buildings">No buildings yet. Add one to get started.</p>
      )}

      <Modal show={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Building" onSubmit={handleAddSubmit}>
        <div className="building-form-fields">
          <div className="form-group">
            <label>Building Name</label>
            <input type="text" value={newBuilding.name} onChange={(e) => setNewBuilding({ ...newBuilding, name: e.target.value })} placeholder="e.g. Building A" required />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input type="text" value={newBuilding.address} onChange={(e) => setNewBuilding({ ...newBuilding, address: e.target.value })} placeholder="123 Industrial Ave" required />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={newBuilding.status} onChange={(e) => setNewBuilding({ ...newBuilding, status: e.target.value })}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="maintenance">maintenance</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Floors</label>
              <input type="number" min="1" value={newBuilding.totalFloors} onChange={(e) => setNewBuilding({ ...newBuilding, totalFloors: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Zones</label>
              <input type="number" min="0" value={newBuilding.totalZones} onChange={(e) => setNewBuilding({ ...newBuilding, totalZones: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Devices</label>
              <input type="number" min="0" value={newBuilding.totalDevices} onChange={(e) => setNewBuilding({ ...newBuilding, totalDevices: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Total Area (sq ft)</label>
              <input type="number" min="0" value={newBuilding.totalArea} onChange={(e) => setNewBuilding({ ...newBuilding, totalArea: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>

      {currentBuilding && (
        <Modal show={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setCurrentBuilding(null); }} title="Edit Building" onSubmit={handleEditSubmit}>
          <div className="building-form-fields">
            <div className="form-group">
              <label>Building Name</label>
              <input type="text" value={currentBuilding.name} onChange={(e) => setCurrentBuilding({ ...currentBuilding, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input type="text" value={currentBuilding.address} onChange={(e) => setCurrentBuilding({ ...currentBuilding, address: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={currentBuilding.status} onChange={(e) => setCurrentBuilding({ ...currentBuilding, status: e.target.value })}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="maintenance">maintenance</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Floors</label>
                <input type="number" min="1" value={currentBuilding.totalFloors} onChange={(e) => setCurrentBuilding({ ...currentBuilding, totalFloors: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Zones</label>
                <input type="number" min="0" value={currentBuilding.totalZones} onChange={(e) => setCurrentBuilding({ ...currentBuilding, totalZones: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Devices</label>
                <input type="number" min="0" value={currentBuilding.totalDevices} onChange={(e) => setCurrentBuilding({ ...currentBuilding, totalDevices: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Total Area (sq ft)</label>
                <input type="number" min="0" value={currentBuilding.totalArea} onChange={(e) => setCurrentBuilding({ ...currentBuilding, totalArea: e.target.value })} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BuildingConfigurationPage;
