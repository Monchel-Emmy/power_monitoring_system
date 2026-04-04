import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';
import './LoginPage.css';

function SignupPage() {
  const [role, setRole] = useState('manager');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
          role: role === 'admin' ? 'Administrator' : 'Home & Building Manager',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Sign up failed');
        setLoading(false);
        return;
      }
      // Redirect to email verification page after successful signup
      if (data.emailFallback && data.verificationCode) {
        // Email failed, show code in URL for testing
        navigate(`/verify-email?code=${data.verificationCode}`, { 
          replace: true,
          state: { email: email.trim(), emailFallback: true }
        });
      } else {
        navigate('/verify-email', { 
          replace: true,
          state: { email: email.trim() }
        });
      }
    } catch (err) {
      setError('Cannot connect to server. Please check if backend is running on http://localhost:4000');
    }
    setLoading(false);
  };

  const handleGoogleSignup = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  const roleLabel = role === 'admin' ? 'Administrator' : 'Home & Building Manager';

  return (
    <div className="login-container">
      <div className="login-box signup-box">
        <div className="login-logo" />
        <h1 className="login-title">Sign Up</h1>
        <p className="login-subtitle">Create an account for In-House Power Monitoring</p>

        <div className="login-role-section">
          <span className="login-role-label">Select Role</span>
          <div className="login-role-buttons">
            <button
              type="button"
              className={`login-role-btn ${role === 'admin' ? 'active' : ''}`}
              onClick={() => setRole('admin')}
            >
              <span className="login-role-icon lock" />
              Administrator
            </button>
            <button
              type="button"
              className={`login-role-btn ${role === 'manager' ? 'active' : ''}`}
              onClick={() => setRole('manager')}
            >
              <span className="login-role-icon person" />
              Home &amp; Building Manager
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Enter password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Creating account…' : `Sign Up as ${roleLabel}`}
          </button>
        </form>

        <div style={{ margin: '1rem 0' }}>
          <div style={{ textAlign: 'center', position: 'relative', margin: '1.5rem 0' }}>
            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: 0 }} />
            <span style={{ 
              position: 'absolute', 
              top: '-10px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              backgroundColor: 'white',
              padding: '0 1rem',
              color: '#6b7280',
              fontSize: '0.875rem'
            }}>OR</span>
          </div>
          
          <GoogleAuthButton 
            text="Sign up with Google" 
            onClick={handleGoogleSignup}
            disabled={loading}
          />
        </div>

        <p className="login-signup-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;
