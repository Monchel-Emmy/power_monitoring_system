import React, { useState, useEffect } from 'react'; // Corrected import: useState and useEffect are already here
import './UserManagementPage.css';
import { FaSearch, FaUserPlus, FaEdit, FaTrash } from 'react-icons/fa';
import Modal from '../components/Modal'; // Import reusable Modal

import { API_BASE } from '../config';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [buildingsList, setBuildingsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'User',
    status: 'Active',
    buildings: []
  });
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users`);
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error('Failed to load users', err);
      }
    };
    fetchUsers();
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

  const roleForDisplay = (role) => {
    if (!role) return '';
    const r = (role || '').toLowerCase();
    if (r === 'admin') return 'Administrator';
    if (r === 'manager') return 'Manager';
    if (r === 'user') return 'User';
    return role;
  };

  const filteredUsers = users.filter(user => {
    const nameOrUsername = (user.username || user.name || '').toLowerCase();
    const matchesSearch = nameOrUsername.includes(searchTerm.toLowerCase()) ||
                          (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const userRole = (user.role || '').toLowerCase();
    const filterRoleLower = filterRole.toLowerCase();
    const matchesRole = filterRole === 'All' ||
      (filterRoleLower === 'administrator' && userRole === 'admin') ||
      (filterRoleLower === 'manager' && userRole === 'manager') ||
      (filterRoleLower === 'user' && userRole === 'user');
    const matchesStatus = filterStatus === 'All' || (user.status || '').toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesRole && matchesStatus;
  });

  const toggleBuildingAdd = (buildingName) => {
    const next = newUser.buildings.includes(buildingName)
      ? newUser.buildings.filter(n => n !== buildingName)
      : [...newUser.buildings, buildingName];
    setNewUser({ ...newUser, buildings: next });
  };

  const toggleBuildingEdit = (buildingName) => {
    const next = (currentUser?.buildings || []).includes(buildingName)
      ? currentUser.buildings.filter(n => n !== buildingName)
      : [...(currentUser?.buildings || []), buildingName];
    setCurrentUser({ ...currentUser, buildings: next });
  };

  const handleAddUser = () => {
    setIsAddUserModalOpen(true);
  };

  const handleAddUserSubmit = async (e) => {
    e?.preventDefault?.();
    try {
      const payload = {
        username: newUser.name.trim(),
        password: newUser.password,
        email: newUser.email.trim(),
        role: newUser.role === 'Administrator' ? 'admin' : newUser.role.toLowerCase(),
        status: newUser.status,
        buildings: Array.isArray(newUser.buildings) ? newUser.buildings : []
      };
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to add user');
      }
      const addedUser = await res.json();
      setUsers([...users, addedUser]);
      setIsAddUserModalOpen(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'User',
        status: 'Active',
        buildings: []
      });
    } catch (err) {
      console.error('Failed to add user', err);
    }
  };

  const handleEditUser = (user) => {
    const buildingNames = (user.buildings || []).map(b =>
      typeof b === 'object' && b && b.name != null ? b.name : b
    ).filter(Boolean);
    setCurrentUser({ ...user, buildings: buildingNames });
    setIsEditUserModalOpen(true);
  };

  const handleEditUserSubmit = async (e) => {
    e?.preventDefault?.();
    if (!currentUser || !currentUser._id) return;
    try {
      const buildingNames = Array.isArray(currentUser.buildings) ? currentUser.buildings : [];
      const payload = {
        username: currentUser.username || currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        status: currentUser.status,
        buildings: buildingNames
      };
      const res = await fetch(`${API_BASE}/api/users/${currentUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update user');
      }
      const updatedUser = await res.json();
      setUsers(users.map(user => (user._id === updatedUser._id ? updatedUser : user)));
      setIsEditUserModalOpen(false);
      setCurrentUser(null);
    } catch (err) {
      console.error('Failed to update user', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!userId || !window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        setUsers(users.filter(user => user._id !== userId));
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Delete failed');
      }
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  };

  return (
    <div className="user-management-page">
      <div className="user-management-header">
        <h1>User Management Interface</h1>
        <button className="add-user-btn" onClick={handleAddUser}>
          <FaUserPlus /> Add New User
        </button>
      </div>

      <p className="section-description">Manage user accounts, roles, and access permissions within the system.</p>

      <div className="user-stats-cards">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>{users.length}</p>
        </div>
        <div className="stat-card">
          <h3>Active Users</h3>
          <p>{users.filter(user => (user.status || '').toLowerCase() === 'active').length}</p>
        </div>
        <div className="stat-card">
          <h3>Administrators</h3>
          <p>{users.filter(user => (user.role || '').toLowerCase() === 'admin').length}</p>
        </div>
        <div className="stat-card">
          <h3>Managers</h3>
          <p>{users.filter(user => (user.role || '').toLowerCase() === 'manager').length}</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="All">All Roles</option>
          <option value="Administrator">Administrator</option>
          <option value="Manager">Manager</option>
          <option value="User">User</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Buildings</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user._id || user.id}>
                <td>{user.username || user.name}</td>
                <td>{user.email}</td>
                <td><span className={`role-${(user.role || '').toLowerCase()}`}>{roleForDisplay(user.role)}</span></td>
                <td><span className={`status-${(user.status || '').toLowerCase()}`}>{user.status}</span></td>
                <td>
                  {(user.buildings ?? []).map(b => typeof b === 'object' && b && b.name != null ? b.name : b).filter(Boolean).join(', ') || '—'}
                </td>
                <td>
                  <button type="button" className="action-btn edit-btn" onClick={() => handleEditUser(user)}><FaEdit /></button>
                  <button type="button" className="action-btn delete-btn" onClick={() => handleDeleteUser(user._id || user.id)}><FaTrash /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && <p className="no-users-found">No users found matching your criteria.</p>}
      </div>
      {/* Render add user modal */}
      <Modal
        show={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Add New User"
        onSubmit={handleAddUserSubmit}
      >
        <div className="user-form-fields">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              placeholder="Enter full name"
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="user@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="User">User</option>
                <option value="Manager">Manager</option>
                <option value="Administrator">Administrator</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={newUser.status}
                onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="form-group form-group-buildings">
            <label>Assign to buildings</label>
            <p className="form-hint">Select one or more buildings this user can access.</p>
            <div className="buildings-checkbox-group">
              {buildingsList.length === 0 ? (
                <p className="buildings-empty">No buildings in system. Add buildings first.</p>
              ) : (
                buildingsList.map((b) => (
                  <label key={b._id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newUser.buildings.includes(b.name)}
                      onChange={() => toggleBuildingAdd(b.name)}
                    />
                    <span className="checkbox-text">{b.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Render edit user modal */}
      {currentUser && (
        <Modal
          show={isEditUserModalOpen}
          onClose={() => { setIsEditUserModalOpen(false); setCurrentUser(null); }}
          title="Edit User"
          onSubmit={handleEditUserSubmit}
        >
          <div className="user-form-fields">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={currentUser.username || currentUser.name || ''}
                onChange={(e) => setCurrentUser({ ...currentUser, username: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={currentUser.email}
                onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Role</label>
                <select
                  value={(currentUser.role || '').toLowerCase()}
                  onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={currentUser.status}
                  onChange={(e) => setCurrentUser({ ...currentUser, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="form-group form-group-buildings">
              <label>Assign to buildings</label>
              <p className="form-hint">Select one or more buildings this user can access.</p>
              <div className="buildings-checkbox-group">
                {buildingsList.length === 0 ? (
                  <p className="buildings-empty">No buildings in system.</p>
                ) : (
                  buildingsList.map((b) => (
                    <label key={b._id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={(currentUser.buildings || []).includes(b.name)}
                        onChange={() => toggleBuildingEdit(b.name)}
                      />
                      <span className="checkbox-text">{b.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagementPage;