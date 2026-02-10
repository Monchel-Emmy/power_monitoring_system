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
        <li><NavLink to="/system-overview" end>Admin Control Panel</NavLink></li>
        <li><NavLink to="/system-overview">System Overview</NavLink></li>
        <li><NavLink to="/user-management">User Management</NavLink></li>
        <li><NavLink to="/device-management">Device Management</NavLink></li>
        <li><NavLink to="/building-configuration">Building Configuration</NavLink></li>
        <li><NavLink to="/system-configuration">System Configuration</NavLink></li>
        <li><NavLink to="/audit-log">Audit Log</NavLink></li>
      </ul>
    </div>
  );
}

export default Sidebar;