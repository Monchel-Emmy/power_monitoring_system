import React from 'react';

const GoogleAuthButton = ({ text, onClick, disabled = false }) => {
  return (
    <button
      type="button"
      className="google-auth-btn"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '100%',
        padding: '10px 16px',
        border: '1px solid #dadce0',
        borderRadius: '4px',
        backgroundColor: '#ffffff',
        color: '#3c4043',
        fontSize: '14px',
        fontWeight: '500',
        fontFamily: 'Roboto, Arial, sans-serif',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        marginBottom: '1rem',
      }}
      onMouseOver={(e) => {
        if (!disabled) {
          e.target.style.backgroundColor = '#f8f9fa';
          e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          e.target.style.borderColor = '#d2d3d6';
        }
      }}
      onMouseOut={(e) => {
        if (!disabled) {
          e.target.style.backgroundColor = '#ffffff';
          e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
          e.target.style.borderColor = '#dadce0';
        }
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 48 48"
        style={{ flexShrink: 0 }}
      >
        <path
          fill="#4285F4"
          d="M42.6,22c0-1.5-0.1-2.9-0.4-4.3H24v8.1h10.4c-0.4,2.4-1.7,4.4-3.6,5.7v5.3h5.8C40.3,32.2,42.6,27.6,42.6,22z"
        />
        <path
          fill="#34A853"
          d="M24,43c4.8,0,8.8-1.6,11.8-4.3l-5.8-5.3c-1.6,1.1-3.6,1.7-5.9,1.7c-4.5,0-8.3-3-9.7-7.1H8.1v5.5C11.1,38.6,17.2,43,24,43z"
        />
        <path
          fill="#FBBC05"
          d="M14.3,24.9c-0.4-1.1-0.6-2.3-0.6-3.5s0.2-2.4,0.6-3.5v-5.5H8.1c-1.3,2.5-2,5.3-2,8.3s0.7,5.8,2,8.3L14.3,24.9z"
        />
        <path
          fill="#EA4335"
          d="M24,11.8c2.6,0,4.9,0.9,6.7,2.6l5.1-5.1C32.8,6.2,28.8,4.5,24,4.5c-6.8,0-12.9,4.2-15.9,10.4l6.2,5.5C15.7,16.4,19.5,11.8,24,11.8z"
        />
      </svg>
      {text}
    </button>
  );
};

export default GoogleAuthButton;
