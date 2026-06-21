/**
 * Axios instance with:
 *  - withCredentials: true  (sends session cookie on every request)
 *  - CSRF token injected from cookie into X-CSRFToken header
 */
import axios from 'axios';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  withCredentials: true,          // send session + CSRF cookies
  headers: { 'Content-Type': 'application/json' },
});

// Attach CSRF token to every mutating request
client.interceptors.request.use((config) => {
  const csrf = getCookie('csrftoken');
  if (csrf && config.headers) {
    config.headers['X-CSRFToken'] = csrf;
  }
  return config;
});

// Global error handler — redirect to /login on 401
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;