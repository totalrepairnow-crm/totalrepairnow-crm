const API_BASE = '/api';

export function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('accessToken') || null;
}
export function setToken(value) {
  if (!value) return;
  localStorage.setItem('token', value);
  localStorage.setItem('accessToken', value);
}
export function clearToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('accessToken');
}

export async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json', ...(opts.headers || {}) };
  const t = getToken();
  if (t) headers['Authorization'] = `Bearer ${t}`;

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const ct = res.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');
  const body = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => '');

  if (!res.ok) {
    const msg = isJson ? (body?.error || body?.message || JSON.stringify(body)) : String(body || res.status);
    const err = new Error(`API ${res.status}: ${msg}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

export async function login(email, password) {
  const data = await apiFetch('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  const t = data?.accessToken || data?.token;
  if (t) setToken(t);
  return data;
}

/* --- CRM endpoints --- */
export async function getClients()  { return apiFetch('/clients'); }
export async function getUsers()    { return apiFetch('/users'); }
export async function getDashboard(){ return apiFetch('/dashboard'); }

/* --- Clients detail & create --- */
export async function getClient(id) {
  // intenta /clients/:id; si no existe en backend, el caller verá el error y lo mostrará
  return apiFetch(`/clients/${id}`);
}

export async function createClient(payload) {
  return apiFetch('/clients', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
