// frontend/src/lib/http.js
const API_BASE = '/api';

// Junta rutas sin duplicar slashes
function join(...parts) {
  return parts
    .map(p => String(p).replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')
    .replace(/\/{2,}/g, '/');
}

// Siempre construye URL absoluta contra /api
function apiUrl(path) {
  const clean = String(path || '');
  if (clean.startsWith('/api')) return clean;        // ya es absoluta
  if (clean.startsWith('/'))   return `${API_BASE}${clean}`; // "/services" => "/api/services"
  return `/${join(API_BASE, clean)}`;                // "services" => "/api/services"
}

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiGet(path, opts = {}) {
  const res = await fetch(apiUrl(path), {
     headers: { 'Accept': 'application/json', ...authHeaders(), ...(opts.headers || {}) }
  });
  if (!res.ok) throw new Error(await res.text().catch(()=>'Request failed'));
  return res.json();
}

export { apiGet, apiUrl };
