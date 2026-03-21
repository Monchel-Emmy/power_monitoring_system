import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const role = params.get('role');
    const username = params.get('username');
    const email = params.get('email');

    if (token) {
      // Store the token and user info
      login(token, { role, username, email });
      
      // Small delay to ensure state is set before redirect
      setTimeout(() => {
        // Redirect based on role
        if (role === 'admin') {
          navigate('/', { replace: true });
        } else {
          navigate('/manager', { replace: true });
        }
      }, 100);
    } else {
      // No token, redirect to login
      navigate('/login', { replace: true, state: { error: 'Authentication failed' } });
    }
  }, [location.search, login, navigate]);

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo" />
        <h1 className="login-title">Authenticating...</h1>
        <p>Please wait while we complete your sign in.</p>
      </div>
    </div>
  );
}

export default AuthSuccessPage;
