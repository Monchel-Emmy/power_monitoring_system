import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

import { API_BASE } from '../config';

function LoginPage() {
  const [role, setRole] = useState('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          role: role === 'admin' ? 'Administrator' : 'Building Manager',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Login failed');
        setLoading(false);
        return;
      }
      login(data.token, data.user);
      if (data.user.role === 'admin') {
        navigate(from.startsWith('/manager') ? '/' : from || '/', { replace: true });
      } else {
        navigate(from.startsWith('/manager') ? from : '/manager', { replace: true });
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const roleLabel = role === 'admin' ? 'Administrator' : 'Building Manager';

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo" />
        <h1 className="login-title">Power Usage Monitoring</h1>
        <p className="login-subtitle">Industrial &amp; Commercial Building System</p>

        <div className="login-role-section">
          <span className="login-role-label">Select Role</span>
          <div className="login-role-buttons">
            <button type="button" className={`login-role-btn ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>
              <span className="login-role-icon lock" /> Administrator
            </button>
            <button type="button" className={`login-role-btn ${role === 'manager' ? 'active' : ''}`} onClick={() => setRole('manager')}>
              <span className="login-role-icon person" /> Building Manager
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input id="username" type="text" autoComplete="username" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-button" disabled={loading}>{loading ? 'Signing in…' : `Sign In as ${roleLabel}`}</button>
        </form>

        <p className="login-demo-hint">Demo: alice.smith / password123 (Admin), bob.johnson / password123 (Manager)</p>
        <p className="login-signup-link">Don&apos;t have an account? <Link to="/signup">Sign up</Link></p>
      </div>
    </div>
  );
}

export default LoginPage;