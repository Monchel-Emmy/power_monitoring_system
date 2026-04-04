import React, { useEffect, useState } from 'react';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaWifi, FaBan, FaExclamationCircle, FaCheckCircle, FaCog } from 'react-icons/fa';
import Modal from '../components/Modal';
import './DeviceManagementPage.css';

import { API_BASE } from '../config';

const defaultNewDevice = {
  name: '',
  type: 'Smart Meter',
  location: '',
  building: '',
  locationDetail: '',
  lastSync: '—',
  dataRate: '—',
  battery: '100%',
  status: 'Online',
};

function DeviceManagementPage() {
  const [devices, setDevices] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [devicesPerPage] = useState(5);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({ ...defaultNewDevice });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentDevice, setCurrentDevice] = useState(null);

  const [buildingsList, setBuildingsList] = useState([]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        console.log('Fetching devices from:', `${API_BASE}/api/devices`);
        const res = await fetch(`${API_BASE}/api/devices`);
        console.log('Response status:', res.status);
        const data = await res.json();
        console.log('Devices data:', data);
        setDevices(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load devices', err);
        setDevices([]);
      }
    };
    fetchDevices();
  }, []);

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/buildings`);
        const data = await res.json();
        setBuildingsList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load buildings', err);
      }
    };
    fetchBuildings();
  }, []);

  const filteredDevices = devices.filter((d) => {
    const matchSearch =
      (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Pagination logic
  const indexOfLastDevice = currentPage * devicesPerPage;
  const indexOfFirstDevice = indexOfLastDevice - devicesPerPage;
  const currentDevices = filteredDevices.slice(indexOfFirstDevice, indexOfLastDevice);
  const totalPages = Math.ceil(filteredDevices.length / devicesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const stats = (() => {
    const total = devices.length;
    const online = devices.filter((d) => (d.status || '').toLowerCase() === 'online').length;
    const offline = devices.filter((d) => (d.status || '').toLowerCase() === 'offline').length;
    const warning = devices.filter((d) => (d.status || '').toLowerCase() === 'warning').length;
    return {
      total,
      online,
      offline,
      warning,
      onlinePct: total ? Math.round((online / total) * 1000) / 10 : 0,
      offlinePct: total ? Math.round((offline / total) * 1000) / 10 : 0,
      warningPct: total ? Math.round((warning / total) * 1000) / 10 : 0,
    };
  })();

  const batteryPercent = (d) => {
    const b = d.battery;
    if (typeof b === 'number') return Math.min(100, Math.max(0, b));
    if (typeof b === 'string') {
      const n = parseInt(b.replace(/\D/g, ''), 10);
      return isNaN(n) ? 0 : Math.min(100, Math.max(0, n));
    }
    return 0;
  };

  const handleAddDevice = () => {
    setNewDevice({ ...defaultNewDevice });
    setIsAddModalOpen(true);
  };

  const buildLocation = (building, detail) => {
    const d = (detail || '').trim();
    if ((building || '').trim()) return d ? `${building.trim()} - ${d}` : building.trim();
    return d;
  };

  const handleAddSubmit = async (e) => {
    e?.preventDefault?.();
    try {
      const location = buildLocation(newDevice.building, newDevice.locationDetail);
      const payload = { ...newDevice, location };
      delete payload.building;
      delete payload.locationDetail;
      const res = await fetch(`${API_BASE}/api/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to add device');
      const created = await res.json();
      setDevices((prev) => [...prev, created]);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const parseLocation = (loc) => {
    const s = (loc || '').trim();
    const dash = s.indexOf(' - ');
    if (dash > 0) return { building: s.slice(0, dash).trim(), locationDetail: s.slice(dash + 3).trim() };
    return { building: '', locationDetail: s };
  };

  const handleEditDevice = (device) => {
    const { building, locationDetail } = parseLocation(device.location);
    setCurrentDevice({ ...device, building, locationDetail });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e?.preventDefault?.();
    if (!currentDevice || !currentDevice.id) return;
    try {
      const location = buildLocation(currentDevice.building, currentDevice.locationDetail);
      const res = await fetch(`${API_BASE}/api/devices/${currentDevice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentDevice.name,
          type: currentDevice.type,
          location,
          lastSync: currentDevice.lastSync,
          dataRate: currentDevice.dataRate,
          battery: currentDevice.battery,
          status: currentDevice.status,
        }),
      });
      if (!res.ok) throw new Error('Failed to update device');
      const updated = await res.json();
      setDevices((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setIsEditModalOpen(false);
      setCurrentDevice(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDevice = async (id) => {
    if (!id || !window.confirm('Are you sure you want to delete this device?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/devices/${id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        setDevices((prev) => prev.filter((d) => d.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Delete failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="device-management-page">
      <header className="page-header">
        <div>
          <h2>Device Management</h2>
          <p>Monitor and manage IoT devices and sensors</p>
        </div>
        <button type="button" className="add-device-btn" onClick={handleAddDevice}>
          <FaPlus /> Add New Device
        </button>
      </header>

      <div className="device-stats">
        <div className="stat-card online">
          <span className="pct-corner">{stats.onlinePct}%</span>
          <FaWifi className="stat-icon" />
          <p className="count">{stats.online}</p>
          <p className="label">Online Devices</p>
        </div>
        <div className="stat-card offline">
          <span className="pct-corner">{stats.offlinePct}%</span>
          <FaBan className="stat-icon" />
          <p className="count">{stats.offline}</p>
          <p className="label">Offline Devices</p>
        </div>
        <div className="stat-card warning">
          <span className="pct-corner">{stats.warningPct}%</span>
          <FaExclamationCircle className="stat-icon" />
          <p className="count">{stats.warning}</p>
          <p className="label">Warning Status</p>
        </div>
        <div className="stat-card total">
          <FaCheckCircle className="stat-icon" />
          <p className="count">{stats.total}</p>
          <p className="label">Total Devices</p>
        </div>
      </div>

      <div className="filter-bar-card">
        <div className="search-input">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search devices by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="All">All Status</option>
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
          <option value="Warning">Warning</option>
        </select>
      </div>

      <div className="device-cards-grid">
        {currentDevices.map((device) => (
          <div key={device.id} className="device-card">
            <div className="card-header">
              <span className={`status-icon ${(device.status || '').toLowerCase()}`}>
                {device.status === 'Online' ? '✅' : device.status === 'Warning' ? '⚠️' : '❌'}
              </span>
              <div className="card-title-block">
                <h3>{device.name}</h3>
                <p className="device-id">{device.id}</p>
              </div>
              <button type="button" className="settings-btn" onClick={() => handleEditDevice(device)} aria-label="Settings">
                <FaCog />
              </button>
            </div>
            <div className="card-details">
              <p><strong>Type:</strong> {device.type}</p>
              <p><strong>Location:</strong> {device.location}</p>
              <p><strong>Last Sync:</strong> {device.lastSync}</p>
              <p><strong>Data Rate:</strong> {device.dataRate}</p>
              <div className="battery-container">
                <strong>Battery Level:</strong>
                <div className="battery-bar">
                  <div
                    className={`battery-fill ${(device.status || '').toLowerCase()}`}
                    style={{ width: `${batteryPercent(device)}%` }}
                  />
                </div>
                <span className="battery-percent">{device.battery}</span>
              </div>
            </div>
            <div className="card-actions">
              <button type="button" className="edit-btn" onClick={() => handleEditDevice(device)}>
                <FaEdit /> Edit
              </button>
              <button type="button" className="delete-btn" onClick={() => handleDeleteDevice(device.id)}>
                <FaTrash /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {currentDevices.length === 0 && (
        <p className="no-devices">No devices match your filters.</p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {indexOfFirstDevice + 1} to {Math.min(indexOfLastDevice, filteredDevices.length)} of {filteredDevices.length} devices
          </div>
          <div className="pagination-controls">
            <button 
              className="pagination-btn" 
              onClick={() => paginate(currentPage - 1)} 
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                className={`pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => paginate(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            <button 
              className="pagination-btn" 
              onClick={() => paginate(currentPage + 1)} 
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <Modal show={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Device" onSubmit={handleAddSubmit}>
        <div className="device-form-fields">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={newDevice.name}
              onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
              placeholder="e.g. Fridge, TV, AC"
              required
            />
            <p className="form-hint">Use a clear name (e.g. Fridge, TV) so managers see consumption by device in Live Monitoring.</p>
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={newDevice.type} onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value })}>
              <option value="Smart Meter">Smart Meter</option>
              <option value="IoT Sensor">IoT Sensor</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Home</label>
              <select
                value={newDevice.building || ''}
                onChange={(e) => setNewDevice({ ...newDevice, building: e.target.value })}
              >
                <option value="">Select home</option>
                {buildingsList.map((b) => (
                  <option key={b._id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Room</label>
              <input
                type="text"
                value={newDevice.locationDetail || ''}
                onChange={(e) => setNewDevice({ ...newDevice, locationDetail: e.target.value })}
                placeholder="e.g. Room 1"
              />
            </div>
          </div>
          <p className="form-hint">Location will be shown as &quot;Home - Room&quot;</p>
          <div className="form-row">
            <div className="form-group">
              <label>Last Sync</label>
              <input
                type="text"
                value={newDevice.lastSync}
                onChange={(e) => setNewDevice({ ...newDevice, lastSync: e.target.value })}
                placeholder="e.g. 2 minutes ago"
              />
            </div>
            <div className="form-group">
              <label>Data Rate</label>
              <input
                type="text"
                value={newDevice.dataRate}
                onChange={(e) => setNewDevice({ ...newDevice, dataRate: e.target.value })}
                placeholder="e.g. 1.2 MB/s"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Battery</label>
              <input
                type="text"
                value={newDevice.battery}
                onChange={(e) => setNewDevice({ ...newDevice, battery: e.target.value })}
                placeholder="e.g. 95%"
              />
            </div>
          </div>
        </div>
      </Modal>

      {currentDevice && (
        <Modal
          show={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setCurrentDevice(null); }}
          title="Edit Device"
          onSubmit={handleEditSubmit}
        >
          <div className="device-form-fields">
            <div className="form-group">
              <label>ID</label>
              <input type="text" value={currentDevice.id} disabled className="input-readonly" />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={currentDevice.name}
                onChange={(e) => setCurrentDevice({ ...currentDevice, name: e.target.value })}
                placeholder="e.g. Fridge, TV"
                required
              />
              <p className="form-hint">Managers see this name and consumption in Live Monitoring.</p>
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={currentDevice.type} onChange={(e) => setCurrentDevice({ ...currentDevice, type: e.target.value })}>
                <option value="Smart Meter">Smart Meter</option>
                <option value="IoT Sensor">IoT Sensor</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Home</label>
                <select
                  value={currentDevice.building || ''}
                  onChange={(e) => setCurrentDevice({ ...currentDevice, building: e.target.value })}
                >
                  <option value="">Select home</option>
                  {buildingsList.map((b) => (
                    <option key={b._id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Room</label>
                <input
                  type="text"
                  value={currentDevice.locationDetail || ''}
                  onChange={(e) => setCurrentDevice({ ...currentDevice, locationDetail: e.target.value })}
                  placeholder="e.g. Room 1"
                />
              </div>
            </div>
            <p className="form-hint">Location: &quot;Home - Room&quot;</p>
            <div className="form-row">
              <div className="form-group">
                <label>Last Sync</label>
                <input
                  type="text"
                  value={currentDevice.lastSync}
                  onChange={(e) => setCurrentDevice({ ...currentDevice, lastSync: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Data Rate</label>
                <input
                  type="text"
                  value={currentDevice.dataRate}
                  onChange={(e) => setCurrentDevice({ ...currentDevice, dataRate: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Battery</label>
                <input
                  type="text"
                  value={currentDevice.battery}
                  onChange={(e) => setCurrentDevice({ ...currentDevice, battery: e.target.value })}
                  placeholder="e.g. 95%"
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default DeviceManagementPage;
