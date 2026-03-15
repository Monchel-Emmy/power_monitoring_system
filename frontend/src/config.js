/**
 * API base URL for the backend (no trailing slash).
 * For local dev: leave unset or set REACT_APP_API_BASE=http://localhost:4000
 * For production: set REACT_APP_API_BASE to your deployed backend URL (e.g. https://your-api.onrender.com)
 */
const raw = process.env.REACT_APP_API_BASE || 'http://localhost:4000';
export const API_BASE = raw.replace(/\/+$/, '');

const AUTH_STORAGE_KEY = 'power_monitor_auth';

/** Returns headers with Bearer token when user is logged in (for manager/admin API calls). */
export function getAuthHeaders() {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const { token } = JSON.parse(stored);
      if (token) return { Authorization: `Bearer ${token}` };
    }
  } catch (e) {}
  return {};
}
