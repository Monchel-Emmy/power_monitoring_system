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
        padding: '12px 16px',
        border: '1px solid #dadce0',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        color: '#3c4043',
        fontSize: '16px',
        fontWeight: '500',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        marginBottom: '1rem',
      }}
      onMouseOver={(e) => {
        if (!disabled) {
          e.target.style.backgroundColor = '#f8f9fa';
          e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
        }
      }}
      onMouseOut={(e) => {
        if (!disabled) {
          e.target.style.backgroundColor = '#ffffff';
          e.target.style.boxShadow = 'none';
        }
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        style={{ flexShrink: 0 }}
      >
        <path
          fill="#4285F4"
          d="M16.66 7.36c-.05-.21-.15-.42-.28-.6l-.03-.03c-.12-.18-.28-.33-.47-.43-.19-.1-.4-.15-.62-.15H3.69c-.22 0-.43.05-.62.15-.19.1-.35.25-.47.43l-.03.03c-.13.18-.23.39-.28.6-.05.21-.05.43 0 .64l2.54 7.5c.1.3.3.54.57.7.27.16.58.24.9.24h5.16c.32 0 .63-.08.9-.24.27-.16.47-.4.57-.7l2.54-7.5c.05-.21.05-.43 0-.64z"
        />
        <path
          fill="#34A853"
          d="M16.66 7.36c-.05-.21-.15-.42-.28-.6l-.03-.03c-.12-.18-.28-.33-.47-.43-.19-.1-.4-.15-.62-.15H9l3.75 11.25c.27.16.58.24.9.24h5.16c.32 0 .63-.08.9-.24.27-.16.47-.4.57-.7l2.54-7.5c.05-.21.05-.43 0-.64z"
        />
        <path
          fill="#EA4335"
          d="M3.69 6.18c-.22 0-.43.05-.62.15-.19.1-.35.25-.47.43l-.03.03c-.13.18-.23.39-.28.6-.05.21-.05.43 0 .64l2.54 7.5c.1.3.3.54.57.7.27.16.58.24.9.24H9L3.69 6.18z"
        />
        <path
          fill="#FBBC05"
          d="M12.75 17.43c.27.16.58.24.9.24h5.16c.32 0 .63-.08.9-.24.27-.16.47-.4.57-.7l2.54-7.5c.05-.21.05-.43 0-.64L12.75 17.43z"
        />
      </svg>
      {text}
    </button>
  );
};

export default GoogleAuthButton;
