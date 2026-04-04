import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config';
import './LoginPage.css';

function EmailVerificationPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [fallbackCode, setFallbackCode] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (code) {
      setFallbackCode(code);
      setCode(code);
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Verification failed');
        setLoading(false);
        return;
      }
      navigate('/login', { replace: true, state: { message: 'Email verified successfully! Please login.' } });
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setError('');
    setResending(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        setError(data.message || 'Failed to resend code');
        setResending(false);
        return;
      }
      
      setError('');
      setResending(false);
      
    } catch (err) {
      setError('Network error. Please try again.');
      setResending(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  const handleCodeInput = (e, index) => {
    const value = e.target.value;
    if (value.length === 1 && index < 5) {
      const nextInput = e.target.parentElement.children[index + 1];
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      const prevInput = e.target.parentElement.children[index - 1];
      if (prevInput) {
        prevInput.focus();
        prevInput.value = '';
      }
    }
  };

  if (success) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-logo" />
          <h1 className="login-title">Email Verified!</h1>
          <div className="verification-success">
            <div className="success-icon">✓</div>
            <p>Your email has been verified successfully!</p>
            <p>Redirecting to login page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo" />
        <h1 className="login-title">Verify Your Email</h1>
        <p className="login-subtitle">
          We've sent a verification code to <strong>{email}</strong>
        </p>
        
        {fallbackCode && (
          <div style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '1rem',
            fontSize: '14px'
          }}>
            <strong>Email service temporarily unavailable</strong><br />
            Your verification code is: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>{fallbackCode}</span><br />
            <small>This code is valid for 10 minutes. Copy and paste it above.</small>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="verification-code-input">
            <label>Enter 6-digit verification code</label>
            <div className="code-inputs">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  className="code-input"
                  value={code[index] || ''}
                  onChange={(e) => {
                    const newCode = code.split('');
                    newCode[index] = e.target.value;
                    setCode(newCode.join(''));
                    handleCodeInput(e, index);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  required
                />
              ))}
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}
          
          <button 
            type="submit" 
            className="login-button" 
            disabled={loading || code.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="verification-actions">
          <button 
            type="button" 
            className="resend-btn" 
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? 'Sending...' : "Didn't receive code? Resend"}
          </button>
        </div>

        <p className="login-signup-link">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default EmailVerificationPage;
