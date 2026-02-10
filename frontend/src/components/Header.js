import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = ({ systemName, adminPanel }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = user?.username || 'User';
  const displayEmail = user?.email || '';

  const isManagerView = location.pathname.startsWith('/manager');
  const currentViewLabel = isManagerView ? 'Manager View' : 'Admin View';

  const handleSwitchView = (target) => {
    setMenuOpen(false);
    if (target === 'admin' && isManagerView) {
      navigate('/system-overview');
    }
    if (target === 'manager' && !isManagerView) {
      navigate('/manager');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="main-header">
      <div className="header-left">
        <div className="logo-block">
          <div className="logo-icon" />
          <div>
            <h1 className="system-name">{systemName}</h1>
            <span className="admin-panel">{adminPanel}</span>
          </div>
        </div>
      </div>
      <div className="header-right">
        <div className="view-switch">
          <button
            className="view-switch-button"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {currentViewLabel}
            <span className="chevron">▾</span>
          </button>
          {menuOpen && (
            <div className="view-switch-menu">
              <button
                className={`view-switch-item ${!isManagerView ? 'selected' : ''}`}
                onClick={() => handleSwitchView('admin')}
              >
                <span className="view-title">Administrator</span>
                <span className="view-sub">Full system access</span>
              </button>
              <button
                className={`view-switch-item ${isManagerView ? 'selected' : ''}`}
                onClick={() => handleSwitchView('manager')}
              >
                <span className="view-title">Building Manager</span>
                <span className="view-sub">Operations &amp; monitoring</span>
              </button>
            </div>
          )}
        </div>
        <div className="user-info">
          <span className="user-name">{displayName}</span>
          <span className="user-email">{displayEmail}</span>
        </div>
        <button type="button" className="logout-button" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
};

export default Header;