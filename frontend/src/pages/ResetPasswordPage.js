import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { API_BASE } from '../config';
import './LoginPage.css';

function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract token and email from URL parameters
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');
    const urlEmail = params.get('email');

    if (!urlToken || !urlEmail) {
      setError('Invalid reset link. Please request a new password reset.');
      setIsValidating(false);
      return;
    }

    setToken(urlToken);
    setEmail(urlEmail);
    setIsValidating(false);
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          email: email.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || 'Failed to reset password');
        setLoading(false);
        return;
      }

      setMessage(data.message);
      setTimeout(() => {
        navigate('/login', { replace: true, state: { message: 'Password reset successful! Please login with your new password.' } });
      }, 2000);
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  if (isValidating) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-logo" />
          <h1 className="login-title">Validating...</h1>
          <p>Please wait while we validate your reset link.</p>
        </div>
      </div>
    );
  }

  if (!token || !email) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-logo" />
          <h1 className="login-title">Invalid Link</h1>
          {error && <div className="login-error">{error}</div>}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <Link to="/forgot-password" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo" />
        <h1 className="login-title">Reset Password</h1>
        <p className="login-subtitle">Enter your new password for {email}</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Enter new password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          {message && <div className="login-success" style={{ marginBottom: '1rem' }}>{message}</div>}
          {error && <div className="login-error">{error}</div>}
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link to="/login" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
