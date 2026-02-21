import React, { useEffect, useState } from 'react';
import './BuildingConfigurationPage.css';
import { FaPlus, FaBuilding, FaMapMarkerAlt, FaEdit, FaThLarge, FaServer, FaTrash } from 'react-icons/fa';
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

const defaultRoomRow = () => ({ zoneName: 'Room 1', devicesCount: 0 });

const BuildingConfigurationPage = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addError, setAddError] = useState(null);
  const [newBuilding, setNewBuilding] = useState({ ...defaultNewBuilding });
  const [newBuildingRooms, setNewBuildingRooms] = useState([defaultRoomRow()]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editError, setEditError] = useState(null);
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
      return acc;
    },
    { buildings: 0, zones: 0, devices: 0 }
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

  const handleAddSubmit = async () => {
    setAddError(null);
    const name = newBuilding.name.trim();
    const address = newBuilding.address.trim();
    if (!name || !address) {
      setAddError('Name and Address are required.');
      throw new Error('Validation failed');
    }
    const zoneDistribution = newBuildingRooms.map((r) => ({
      zoneName: (r.zoneName || '').trim() || 'Room',
      devicesCount: Math.max(0, Number(r.devicesCount) || 0),
      area: 0,
    }));
    const totalZones = zoneDistribution.length;
    const totalDevices = zoneDistribution.reduce((s, z) => s + (z.devicesCount || 0), 0);
    try {
      const payload = {
        name,
        address,
        status: newBuilding.status,
        totalFloors: Number(newBuilding.totalFloors) || 1,
        totalZones,
        totalDevices,
        totalArea: Number(newBuilding.totalArea) || 0,
        zoneDistribution,
      };
      const res = await fetch(`${API_BASE}/api/buildings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.message || `Request failed (${res.status})`;
        setAddError(msg);
        throw new Error(msg);
      }
      setBuildings((prev) => [...prev, data]);
      setIsAddModalOpen(false);
      setNewBuilding({ ...defaultNewBuilding });
      setNewBuildingRooms([defaultRoomRow()]);
    } catch (err) {
      setAddError(err.message || 'Could not add home. Check the server and try again.');
      throw err;
    }
  };

  const handleEditBuilding = (building) => {
    const dist = building.zoneDistribution || [];
    setCurrentBuilding({
      ...building,
      zoneDistribution: dist.length ? dist.map((z) => ({ zoneName: z.zoneName || 'Room', devicesCount: z.devicesCount ?? 0, area: z.area ?? 0 })) : [{ zoneName: 'Room 1', devicesCount: 0 }],
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    setEditError(null);
    if (!currentBuilding || !currentBuilding._id) return;
    const name = currentBuilding.name.trim();
    const address = currentBuilding.address.trim();
    if (!name || !address) {
      setEditError('Name and Address are required.');
      throw new Error('Validation failed');
    }
    const zoneDistribution = (currentBuilding.zoneDistribution || []).map((r) => ({
      zoneName: (r.zoneName || '').trim() || 'Room',
      devicesCount: Math.max(0, Number(r.devicesCount) || 0),
      area: Math.max(0, Number(r.area) || 0),
    }));
    const totalZones = zoneDistribution.length;
    const totalDevices = zoneDistribution.reduce((s, z) => s + (z.devicesCount || 0), 0);
    try {
      const payload = {
        name,
        address,
        status: currentBuilding.status,
        totalFloors: Number(currentBuilding.totalFloors) || 1,
        totalZones,
        totalDevices,
        totalArea: Number(currentBuilding.totalArea) || 0,
        zoneDistribution,
      };
      const res = await fetch(`${API_BASE}/api/buildings/${currentBuilding._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.message || `Request failed (${res.status})`;
        setEditError(msg);
        throw new Error(msg);
      }
      setBuildings((prev) => prev.map((b) => (b._id === data._id ? data : b)));
      setIsEditModalOpen(false);
      setCurrentBuilding(null);
    } catch (err) {
      setEditError(err.message || 'Could not update. Try again.');
      throw err;
    }
  };

  if (loading) return <div className="building-config-page"><p className="loading-msg">Loading...</p></div>;
  if (error) return <div className="building-config-page"><p className="error-msg">{error}</p></div>;

  return (
    <div className="building-config-page">
      <div className="building-config-header">
        <div>
          <h1>Homes &amp; Rooms</h1>
          <p>Manage homes, rooms, and devices</p>
        </div>
        <button type="button" className="add-building-btn" onClick={() => { setAddError(null); setNewBuildingRooms([defaultRoomRow()]); setIsAddModalOpen(true); }}>
          <FaPlus /> Add Home
        </button>
      </div>

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

      <div className="building-list">
        {buildings.map((building) => {
          const { visible, moreCount } = getZoneDisplay(building);
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
                  <FaThLarge className="metric-icon" />
                  <span className="metric-value">{zones}</span>
                  <span className="metric-label">Rooms</span>
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
                <h3>Rooms</h3>
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
        <p className="no-buildings">No homes yet. Add one to get started.</p>
      )}

      <Modal show={isAddModalOpen} onClose={() => { setAddError(null); setIsAddModalOpen(false); }} title="Add New Home" onSubmit={handleAddSubmit}>
        <div className="building-form-fields">
          {addError && <p className="modal-error-msg" role="alert">{addError}</p>}
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={newBuilding.name} onChange={(e) => setNewBuilding({ ...newBuilding, name: e.target.value })} placeholder="e.g. My Home" required />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input type="text" value={newBuilding.address} onChange={(e) => setNewBuilding({ ...newBuilding, address: e.target.value })} placeholder="123 Main St" required />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={newBuilding.status} onChange={(e) => setNewBuilding({ ...newBuilding, status: e.target.value })}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="maintenance">maintenance</option>
            </select>
          </div>
          <div className="form-group">
            <label>Total Area (sq ft)</label>
            <input type="number" min="0" value={newBuilding.totalArea} onChange={(e) => setNewBuilding({ ...newBuilding, totalArea: e.target.value })} />
          </div>
          <div className="form-group rooms-list-section">
            <label>Rooms (name and devices per room)</label>
            {newBuildingRooms.map((room, idx) => (
              <div key={idx} className="room-row">
                <input type="text" value={room.zoneName} onChange={(e) => setNewBuildingRooms((prev) => prev.map((r, i) => i === idx ? { ...r, zoneName: e.target.value } : r))} placeholder="Room name" />
                <input type="number" min="0" value={room.devicesCount} onChange={(e) => setNewBuildingRooms((prev) => prev.map((r, i) => i === idx ? { ...r, devicesCount: e.target.value } : r))} placeholder="Devices" />
                <button type="button" className="room-row-remove" onClick={() => setNewBuildingRooms((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)} aria-label="Remove room"><FaTrash /></button>
              </div>
            ))}
            <button type="button" className="add-room-btn" onClick={() => setNewBuildingRooms((prev) => [...prev, { zoneName: `Room ${prev.length + 1}`, devicesCount: 0 }])}>+ Add room</button>
          </div>
        </div>
      </Modal>

      {currentBuilding && (
        <Modal show={isEditModalOpen} onClose={() => { setEditError(null); setIsEditModalOpen(false); setCurrentBuilding(null); }} title="Edit Home" onSubmit={handleEditSubmit}>
          <div className="building-form-fields">
            {editError && <p className="modal-error-msg" role="alert">{editError}</p>}
            <div className="form-group">
              <label>Name</label>
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
            <div className="form-group">
              <label>Total Area (sq ft)</label>
              <input type="number" min="0" value={currentBuilding.totalArea} onChange={(e) => setCurrentBuilding({ ...currentBuilding, totalArea: e.target.value })} />
            </div>
            <div className="form-group rooms-list-section">
              <label>Rooms (name and devices per room)</label>
              {(currentBuilding.zoneDistribution || []).map((room, idx) => (
                <div key={idx} className="room-row">
                  <input type="text" value={room.zoneName || ''} onChange={(e) => setCurrentBuilding({ ...currentBuilding, zoneDistribution: (currentBuilding.zoneDistribution || []).map((r, i) => i === idx ? { ...r, zoneName: e.target.value } : r) })} placeholder="Room name" />
                  <input type="number" min="0" value={room.devicesCount ?? ''} onChange={(e) => setCurrentBuilding({ ...currentBuilding, zoneDistribution: (currentBuilding.zoneDistribution || []).map((r, i) => i === idx ? { ...r, devicesCount: e.target.value } : r) })} placeholder="Devices" />
                  <button type="button" className="room-row-remove" onClick={() => setCurrentBuilding({ ...currentBuilding, zoneDistribution: (currentBuilding.zoneDistribution || []).length > 1 ? (currentBuilding.zoneDistribution || []).filter((_, i) => i !== idx) : currentBuilding.zoneDistribution }) } aria-label="Remove room"><FaTrash /></button>
                </div>
              ))}
              <button type="button" className="add-room-btn" onClick={() => setCurrentBuilding({ ...currentBuilding, zoneDistribution: [...(currentBuilding.zoneDistribution || []), { zoneName: `Room ${(currentBuilding.zoneDistribution || []).length + 1}`, devicesCount: 0, area: 0 }] }) }>+ Add room</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BuildingConfigurationPage;
