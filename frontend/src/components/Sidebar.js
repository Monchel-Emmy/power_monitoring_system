import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-section-label">ADMINISTRATOR</span>
        <span className="sidebar-section-subtitle">System Control Panel</span>
      </div>
      <ul className="sidebar-menu">
        <li><NavLink to="/" end>Admin Control Panel</NavLink></li>
        <li><NavLink to="/user-management">User Management</NavLink></li>
        <li><NavLink to="/device-management">Device Management</NavLink></li>
        <li><NavLink to="/building-configuration">Building Configuration</NavLink></li>
        <li><NavLink to="/audit-log">Audit Log</NavLink></li>
        <li><NavLink to="/sensor-simulator">Sensor Simulator</NavLink></li>
      </ul>
    </div>
  );
}

export default Sidebar;