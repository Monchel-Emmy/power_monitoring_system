/**
 * API base URL for the backend.
 * For local dev: leave unset or set REACT_APP_API_BASE=http://localhost:4000
 * For production: set REACT_APP_API_BASE to your deployed backend URL (e.g. https://your-api.onrender.com)
 */
export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';
