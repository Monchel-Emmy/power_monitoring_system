import React from 'react';
import { NavLink } from 'react-router-dom';
import './ManagerSidebar.css';

function ManagerSidebar() {
  return (
    <aside className="manager-sidebar">
      <div className="manager-sidebar-header">
        <span className="manager-sidebar-section">HOME &amp; BUILDING</span>
        <span className="manager-sidebar-subtitle">In-House Monitoring</span>
      </div>

      <nav>
        <ul className="manager-sidebar-menu">
          <li>
            <NavLink to="/manager" end>
              Live Monitoring
            </NavLink>
          </li>
          <li>
            <NavLink to="/manager/mobile-monitoring">
              Mobile Monitoring
            </NavLink>
          </li>
          <li>
            <NavLink to="/manager/analytics-trends">
              Analytics &amp; Trends
            </NavLink>
          </li>
          <li>
            <NavLink to="/manager/predictive-analytics">
              Predictive Analytics
            </NavLink>
          </li>
          <li>
            <NavLink to="/manager/alerts-notifications">
              Alerts &amp; Notifications
            </NavLink>
          </li>
          <li>
            <NavLink to="/manager/building-zones">
              Homes &amp; Rooms
            </NavLink>
          </li>
          <li>
            <NavLink to="/manager/cost-management">
              Cost Management
            </NavLink>
          </li>
          <li>
            <NavLink to="/manager/reports">
              Reports
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default ManagerSidebar;

