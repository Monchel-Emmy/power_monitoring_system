import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import ManagerSidebar from './ManagerSidebar';
import './DashboardLayout.css';

function ManagerLayout() {
  return (
    <div className="dashboard-layout">
      <ManagerSidebar />
      <div className="main-content">
        <Header
          systemName="In-House Power Monitoring System"
          adminPanel="Home &amp; Building Manager Panel"
        />
        <Outlet />
      </div>
    </div>
  );
}

export default ManagerLayout;

