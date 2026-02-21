import React, { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import './ManagerBuildingZonesPage.css';

import { API_BASE } from '../config';

const defaultNewBuilding = {
  name: '',
  address: '',
  status: 'active',
  totalFloors: 1,
  totalZones: 0,
  totalDevices: 0,
  totalArea: 0,
};

const ManagerBuildingZonesPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBuilding, setNewBuilding] = useState({ ...defaultNewBuilding });
  const [addError, setAddError] = useState('');

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/manager/building-zones`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load building zones', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAddBuilding = async () => {
    setAddError('');
    if (!newBuilding.name.trim() || !newBuilding.address.trim()) {
      setAddError('Name and address are required');
      return;
    }
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to add building');
      }
      setNewBuilding({ ...defaultNewBuilding });
      setIsAddModalOpen(false);
      await fetchData();
    } catch (err) {
      setAddError(err.message || 'Failed to add building');
      throw err;
    }
  };

  return (
    <div className="manager-page manager-building-zones-page">
      <div className="manager-page-header">
        <h1>Homes &amp; Rooms</h1>
        <p>
          Monitor power use by home, room, and device
        </p>
      </div>

      <div className="multi-building-card">
        <div className="multi-building-header">
          <div>
            <h2>1. Your Homes</h2>
            <p>
              See all your homes and their power usage at a glance
            </p>
          </div>
          <button className="add-building-btn" onClick={() => setIsAddModalOpen(true)}>
            + Add Home
          </button>
        </div>

        {loading ? (
          <div className="building-loading">Loading...</div>
        ) : (
          <div className="multi-building-row">
            {data?.buildings?.map((b) => (
              <div key={b._id || b.name} className="building-summary-card">
                <div className="summary-header">
                  <div>
                    <h3>{b.name}</h3>
                    <p>{b.address}</p>
                  </div>
                  <span className={`summary-status status-${b.status?.toLowerCase()}`}>
                    {b.status}
                  </span>
                </div>
                <div className="summary-usage">
                  <span className="label">Current Usage</span>
                  <span className="value">{b.currentUsageKw} kW</span>
                  <div className="capacity-bar">
                    <div
                      className="capacity-fill"
                      style={{
                        width: `${Math.min(100, b.capacityPercent)}%`,
                        background: b.capacityPercent > 80
                          ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                          : b.capacityPercent > 60
                            ? 'linear-gradient(90deg, #3b82f6, #2563eb)'
                            : 'linear-gradient(90deg, #22c55e, #16a34a)',
                      }}
                    />
                  </div>
                  <div className="capacity-meta">
                    <span>
                      {b.capacityPercent}% of {b.maxCapacityKw} kW capacity
                    </span>
                    <span className="trend">{b.trend}</span>
                  </div>
                </div>
                  <div className="summary-footer">
                  <span>
                    {b.totalZones} rooms • {b.totalFloors} floors • {b.totalDevices} devices
                  </span>
                </div>
              </div>
            ))}
            {(!data?.buildings?.length) && (
              <div className="building-empty">
                <p>No homes yet. Add your first home below.</p>
                <button onClick={() => setIsAddModalOpen(true)}>Add Home</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="cross-building-card">
        <h2>2. Compare Homes</h2>
        <p>
          Compare daily power use across your homes
        </p>
        {data?.comparison?.length ? (
          <div className="cross-building-chart">
            <div className="comparison-chart">
              {data.comparison.map((b, i) => {
                const maxVal = Math.max(...data.comparison.map((x) => x.avgDailyKwh), 1);
                const height = (b.avgDailyKwh / maxVal) * 100;
                return (
                  <div key={b.building} className="comparison-bar-wrap">
                    <div className="comparison-bar" style={{ height: `${height}%` }} title={`${b.building}: ${b.avgDailyKwh.toLocaleString()} kWh`} />
                    <span className="comparison-label">{b.building}</span>
                    <span className="comparison-value">{Math.round(b.avgDailyKwh).toLocaleString()} kWh</span>
                  </div>
                );
              })}
            </div>
            <div className="comparison-legend">
              <span>Average Daily Usage (kWh)</span>
            </div>
          </div>
        ) : (
          <div className="cross-building-chart-placeholder">No comparison data available</div>
        )}
      </div>

      <Modal
        show={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setNewBuilding({ ...defaultNewBuilding });
          setAddError('');
        }}
        title="Add New Home"
        onSubmit={handleAddBuilding}
      >
        {addError && <div className="form-error" style={{ marginBottom: '1rem', padding: '0.5rem', background: '#fef2f2', color: '#dc2626', borderRadius: '6px' }}>{addError}</div>}
        <div className="form-group">
          <label htmlFor="building-name">Name *</label>
          <input
            id="building-name"
            type="text"
            value={newBuilding.name}
            onChange={(e) => setNewBuilding({ ...newBuilding, name: e.target.value })}
            placeholder="e.g. My Home"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="building-address">Address *</label>
          <input
            id="building-address"
            type="text"
            value={newBuilding.address}
            onChange={(e) => setNewBuilding({ ...newBuilding, address: e.target.value })}
            placeholder="e.g., 123 Main St, City"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="building-status">Status</label>
          <select
            id="building-status"
            value={newBuilding.status}
            onChange={(e) => setNewBuilding({ ...newBuilding, status: e.target.value })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="building-floors">Total Floors</label>
            <input
              id="building-floors"
              type="number"
              min="1"
              value={newBuilding.totalFloors}
              onChange={(e) => setNewBuilding({ ...newBuilding, totalFloors: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="building-zones">Rooms</label>
            <input
              id="building-zones"
              type="number"
              min="0"
              value={newBuilding.totalZones}
              onChange={(e) => setNewBuilding({ ...newBuilding, totalZones: e.target.value })}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="building-devices">Total Devices</label>
            <input
              id="building-devices"
              type="number"
              min="0"
              value={newBuilding.totalDevices}
              onChange={(e) => setNewBuilding({ ...newBuilding, totalDevices: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="building-area">Total Area (sq ft)</label>
            <input
              id="building-area"
              type="number"
              min="0"
              value={newBuilding.totalArea}
              onChange={(e) => setNewBuilding({ ...newBuilding, totalArea: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManagerBuildingZonesPage;
