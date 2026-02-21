/**
 * API base URL for the backend (no trailing slash).
 * For local dev: leave unset or set REACT_APP_API_BASE=http://localhost:4000
 * For production: set REACT_APP_API_BASE to your deployed backend URL (e.g. https://your-api.onrender.com)
 */
const raw = process.env.REACT_APP_API_BASE || 'http://localhost:4000';
export const API_BASE = raw.replace(/\/+$/, '');
