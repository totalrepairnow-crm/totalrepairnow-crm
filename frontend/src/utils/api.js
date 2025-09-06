// src/utils/api.js
import { getToken } from './auth';

const BASE_URL = process.env.REACT_APP_API_URL || '/api';

async function apiFetch(path, opts = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...opts, headers });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const payload = await res.json();
      msg = payload.error || payload.message || msg;
    } catch (_e) {}
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  // Permitir 204 sin contenido
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  get: (p) => apiFetch(p, { method: 'GET' }),
  post: (p, body) => apiFetch(p, { method: 'POST', body: JSON.stringify(body) }),
  put: (p, body) => apiFetch(p, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (p, body) => apiFetch(p, { method: 'PATCH', body: JSON.stringify(body) }),
  del: (p) => apiFetch(p, { method: 'DELETE' }),
};

export { apiFetch };
export default api;
