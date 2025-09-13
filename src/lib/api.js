// src/lib/api.js

/* ============================
   Config & helpers base
============================ */
export const API_BASE = '/api';

export function getToken() {
  return (
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    ''
  );
}

// --- Notificador de cambios de auth (para ocultar/mostrar Login/Logout) ---
function emitAuthChanged() {
  try { window.dispatchEvent(new Event('auth-changed')); } catch {}
}

// Permite al Header suscribirse a cambios de sesión
export function onAuthChange(handler) {
  window.addEventListener('auth-changed', handler);
  return () => window.removeEventListener('auth-changed', handler);
}

// Set/Clear token (compat con código viejo) + emite evento
export function setToken(t) {
  if (!t) return;
  localStorage.setItem('accessToken', t);
  localStorage.setItem('token', t);
  emitAuthChanged();
}

export function clearToken() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('token');
  emitAuthChanged();
}

function decodeJWT(tok) {
  try {
    const base = tok.split('.')[1] || '';
    const json = atob(base.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function getRole() {
  const payload = decodeJWT(getToken());
  return String(payload?.role || '').toLowerCase();
}

export function isAdminFromToken() {
  return getRole() === 'admin';
}
// Alias por compatibilidad
export const isAdmin = isAdminFromToken;

// Querystring helper
function joinQs(obj = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

// Wrapper fetch con auth
export async function apiFetch(path, opts = {}) {
  const url = path.startsWith('/api') ? path : `${API_BASE}${path}`;
  const token = getToken();

  const headers = new Headers(opts.headers || {});
  if (!headers.has('Content-Type') && opts.body && typeof opts.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, { ...opts, headers });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    if (res.status === 401) clearToken();
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/* ============================
   Auth
============================ */
export async function login({ email, password }) {
  const r = await apiFetch('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const tok = r?.accessToken || r?.token;
  if (tok) setToken(tok);
  return r;
}

/* ============================
   Clients (CRUD + list)
============================ */
export async function listClients({ q = '', page = 1, limit = 10 } = {}) {
  return apiFetch(`/clients${joinQs({ q: q?.trim() || undefined, page, limit })}`);
}
export const clientsList = listClients;     // alias compat
export const getClients = listClients;      // alias compat

export async function getClient(id) {
  return apiFetch(`/clients/${id}`);
}

export async function createClient(payload) {
  return apiFetch('/clients', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateClient(id, payload) {
  return apiFetch(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteClient(id) {
  return apiFetch(`/clients/${id}`, { method: 'DELETE' });
}
export const removeClient = deleteClient;   // alias compat

/* ============================
   Services (CRUD + filtros)
============================ */
export async function listServices({
  q = '',
  client_id = '',
  status = '',
  page = 1,
  limit = 10,
} = {}) {
  return apiFetch(
    `/services${joinQs({
      q: q?.trim() || undefined,
      client_id: client_id || undefined,
      status: status || undefined,
      page,
      limit,
    })}`
  );
}

export async function getService(id) {
  return apiFetch(`/services/${id}`);
}

// Acepta single payload o batch { client_id, lines:[...] }
export async function createService(payload) {
  return apiFetch('/services', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateService(id, payload) {
  return apiFetch(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteService(id) {
  return apiFetch(`/services/${id}`, { method: 'DELETE' });
}

/* ============================
   Users (CRUD + list)
============================ */
export async function listUsers({ q = '', role = '', page = 1, limit = 10 } = {}) {
  return apiFetch(`/users${joinQs({
    q: q?.trim() || undefined,
    role: role || undefined,
    page,
    limit,
  })}`);
}
export const getUsers = listUsers; // alias compat

export async function getUser(id) {
  return apiFetch(`/users/${id}`);
}

export async function createUser(payload) {
  return apiFetch('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUser(id, payload) {
  return apiFetch(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(id) {
  return apiFetch(`/users/${id}`, { method: 'DELETE' });
}

/* ============================
   UI helpers
============================ */
export function fullName(u = {}) {
  const s = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
  return s || u.name || u.email || '-';
}

/* ============================
   Dashboard
============================ */
export async function getDashboard(params = {}) {
  return apiFetch(`/dashboard${joinQs(params)}`);
}
export const fetchDashboard = getDashboard;

/* ============================
   Invoices (nuevo)
============================ */
export async function draftInvoice({ client_id, items, discount = 0, tax = 0, currency = 'USD' }) {
  // items: [{ name/description, quantity, unit_cost/unit_price }]
  return apiFetch('/invoices/draft', {
    method: 'POST',
    body: JSON.stringify({ client_id, items, discount, tax, currency }),
  });
}

export async function createInvoice({ client_id, service_ids, discount = 0, tax = 0, currency = 'USD' }) {
  if (!client_id || !service_ids?.length) throw new Error('client_id y service_ids requeridos');
  return apiFetch('/invoices/create', {
    method: 'POST',
    body: JSON.stringify({ client_id, service_ids, discount, tax, currency }),
  });
}

export async function getInvoice(id) {
  return apiFetch(`/invoices/${id}`);
}

export function getInvoicePdfUrl(id) {
  return `${API_BASE}/invoices/${id}/pdf`;
}

export async function fetchInvoicePdf(id) {
  const token = getToken();
  const res = await fetch(getInvoicePdfUrl(id), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res; // Response (para blob/stream en el caller)
}
