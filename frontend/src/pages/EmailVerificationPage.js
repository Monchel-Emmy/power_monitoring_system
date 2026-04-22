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
    // Backspace - go to previous input if current is empty
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      const prevInput = e.target.parentElement.children[index - 1];
      if (prevInput) {
        prevInput.focus();
        // Clear the previous input value as well
        const newCode = code.split('');
        newCode[index - 1] = '';
        setCode(newCode.join(''));
      }
      e.preventDefault();
    }
    
    // Delete - clear current input and go to next
    if (e.key === 'Delete') {
      const newCode = code.split('');
      newCode[index] = '';
      setCode(newCode.join(''));
      
      // If there's a next input, focus it
      if (index < 5) {
        const nextInput = e.target.parentElement.children[index + 1];
        if (nextInput) {
          nextInput.focus();
        }
      }
      e.preventDefault();
    }
    
    // Arrow keys navigation
    if (e.key === 'ArrowLeft' && index > 0) {
      const prevInput = e.target.parentElement.children[index - 1];
      if (prevInput) prevInput.focus();
      e.preventDefault();
    }
    
    if (e.key === 'ArrowRight' && index < 5) {
      const nextInput = e.target.parentElement.children[index + 1];
      if (nextInput) nextInput.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length > 0) {
      setCode(digits);
      
      // Focus the next empty input or the last filled one
      const inputs = e.target.parentElement.parentElement.querySelectorAll('.code-input');
      const nextEmptyIndex = digits.length < 6 ? digits.length : 5;
      inputs[nextEmptyIndex].focus();
    }
  };

  const handleInputChange = (e, index) => {
    const value = e.target.value.replace(/\D/g, '');
    const newCode = code.split('');
    newCode[index] = value;
    setCode(newCode.join(''));
    
    // Auto-advance to next input
    if (value && index < 5) {
      const nextInput = e.target.parentElement.parentElement.querySelectorAll('.code-input')[index + 1];
      if (nextInput) nextInput.focus();
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
            <label className="verification-label">
              <span className="label-icon">{'\ud83d\udce7'}</span>
              Enter 6-digit verification code
            </label>
            <div className="code-inputs" onPaste={handlePaste}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div key={index} className="code-input-wrapper">
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    className="code-input"
                    value={code[index] || ''}
                    onChange={(e) => handleInputChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    placeholder="0"
                    required
                  />
                  <span className="code-input-line"></span>
                </div>
              ))}
            </div>
            <p className="code-hint">Enter the 6-digit code sent to your email</p>
          </div>

          {error && <div className="login-error verification-error">
            <span className="error-icon">{'\u26a0\ufe0f'}</span>
            {error}
          </div>}
          
          <button 
            type="submit" 
            className={`login-button verification-button ${code.length === 6 ? 'ready' : ''}`}
            disabled={loading || code.length !== 6}
          >
            <span className="button-icon">
              {loading ? '\u23f3' : '\u2705'}
            </span>
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
            <span className="resend-icon">
              {resending ? '\u23f3' : '\ud83d\udd04'}
            </span>
            {resending ? 'Sending...' : "Didn't receive code? Resend"}
          </button>
          <p className="resend-hint">Check your spam folder if you don't see the email</p>
        </div>

        <p className="login-signup-link">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default EmailVerificationPage;
