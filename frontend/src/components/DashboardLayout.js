import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header'; // Import the new Header component
import './DashboardLayout.css';

function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      < Sidebar />
      <div className="main-content">
        <Header
          systemName="In-House Power Monitoring System"
          adminPanel="Admin Panel"
        />
        <Outlet />
      </div>
    </div>
  );
}

export default DashboardLayout;
