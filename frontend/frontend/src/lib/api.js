// src/lib/api.js
// Utilities for API calls with JWT, auth helpers, and domain functions.

// ===== Base config =====
export const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof window !== "undefined" ? `${window.location.origin}/api` : "/api");

// ===== Token & auth events =====
const TOKEN_KEY = "token";
const authListeners = new Set();

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
  authListeners.forEach((fn) => fn(getToken()));
}

export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
  authListeners.forEach((fn) => fn(getToken()));
}

export function onAuthChange(cb) {
  authListeners.add(cb);
  return () => authListeners.delete(cb);
}

export function hasSession() {
  return !!getToken();
}

// ===== JWT / role helpers =====
function decodeJwt(token) {
  try {
    const [, payload] = token.split(".");
    if (!payload) return {};
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(
      decodeURIComponent(
        Array.prototype.map.call(json, (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
      )
    );
  } catch {
    try {
      const [, payload] = token.split(".");
      return payload ? JSON.parse(atob(payload)) : {};
    } catch {
      return {};
    }
  }
}

export function getRole() {
  const t = getToken();
  if (!t) return null;
  const payload = decodeJwt(t);
  return payload.role || payload.roles?.[0] || null;
}

export function isAdminFromToken() {
  const role = getRole();
  return role === "admin" || role === "superadmin";
}

// ===== Fetch con Authorization centralizado =====
export async function apiFetch(path, { method = "GET", headers = {}, body, raw = false } = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const token = getToken();

  const h = {
    ...(body && !raw ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  const resp = await fetch(url, {
    method,
    headers: h,
    body: raw ? body : body ? JSON.stringify(body) : undefined,
    credentials: "omit",
  });

  if (resp.status === 401) {
    clearToken();
  }

  return resp;
}

async function jsonOrThrow(resp) {
  const txt = await resp.text();
  let data = null;
  try {
    data = txt ? JSON.parse(txt) : null;
  } catch {}
  if (!resp.ok) {
    const msg = data?.error || data?.message || `HTTP ${resp.status}`;
    throw new Error(msg);
  }
  return data;
}

// ===== Auth =====
export async function login(email, password) {
  const resp = await apiFetch("/login", {
    method: "POST",
    body: { email, password },
  });
  const data = await jsonOrThrow(resp);
  const token = data.accessToken || data.token;
  if (!token) throw new Error("No token in response");
  setToken(token);
  return data;
}

export function logout() {
  clearToken();
}

// ===== Dashboard =====
export async function getDashboard() {
  const resp = await apiFetch("/dashboard");
  return jsonOrThrow(resp);
}

// ===== Clients =====
// Devuelve array de clientes para UI. Si el backend paginó, toma .items
export async function listClients(q = "", page = 1, limit = 50) {
  const params = new URLSearchParams();
  if (q) params.set("search", q);
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  const path = `/clients${params.toString() ? `?${params.toString()}` : ""}`;

  const resp = await apiFetch(path);
  const data = await jsonOrThrow(resp);
  if (Array.isArray(data)) return data;
  // preserva el payload completo por si lo necesita otra vista
  return data.items || [];
}

// Si alguna vista necesita la paginación completa:
export async function listClientsPaged(q = "", page = 1, limit = 50) {
  const params = new URLSearchParams();
  if (q) params.set("search", q);
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  const path = `/clients${params.toString() ? `?${params.toString()}` : ""}`;
  const resp = await apiFetch(path);
  return jsonOrThrow(resp);
}

export async function getClient(id) {
  const resp = await apiFetch(`/clients/${id}`);
  return jsonOrThrow(resp);
}

export async function createClient(payload) {
  const resp = await apiFetch("/clients", { method: "POST", body: payload });
  return jsonOrThrow(resp);
}

export async function updateClient(id, payload) {
  const resp = await apiFetch(`/clients/${id}`, { method: "PUT", body: payload });
  return jsonOrThrow(resp);
}

export async function deleteClient(id) {
  const resp = await apiFetch(`/clients/${id}`, { method: "DELETE" });
  return jsonOrThrow(resp);
}

export const fetchClient = getClient;

// Opcional: servicios por cliente si tu backend lo expone
export async function listClientServices(clientId) {
  const resp = await apiFetch(`/clients/${clientId}/services`);
  return jsonOrThrow(resp);
}
export const fetchClientServices = listClientServices;

// ===== Users =====
export async function listUsers() {
  const resp = await apiFetch("/users");
  return jsonOrThrow(resp);
}

export async function getUser(id) {
  const resp = await apiFetch(`/users/${id}`);
  return jsonOrThrow(resp);
}

export async function createUser(payload) {
  const resp = await apiFetch("/users", { method: "POST", body: payload });
  return jsonOrThrow(resp);
}

export async function updateUser(id, payload) {
  const resp = await apiFetch(`/users/${id}`, { method: "PUT", body: payload });
  return jsonOrThrow(resp);
}

export async function deleteUser(id) {
  const resp = await apiFetch(`/users/${id}`, { method: "DELETE" });
  return jsonOrThrow(resp);
}

// ===== Services =====
export async function listServices() {
  const resp = await apiFetch("/services");
  return jsonOrThrow(resp);
}

export async function getService(id) {
  const resp = await apiFetch(`/services/${id}`);
  return jsonOrThrow(resp);
}

export async function createService(payload) {
  const resp = await apiFetch("/services", { method: "POST", body: payload });
  return jsonOrThrow(resp);
}

export async function updateService(id, payload) {
  const resp = await apiFetch(`/services/${id}`, { method: "PUT", body: payload });
  return jsonOrThrow(resp);
}

export async function deleteService(id) {
  const resp = await apiFetch(`/services/${id}`, { method: "DELETE" });
  return jsonOrThrow(resp);
}

// Alias por compatibilidad
export const createServiceForClient = createService;

// ===== Invoices =====
export async function createInvoiceFromServices({ client_id, service_ids, discount = 0, tax = 0, currency = "USD" }) {
  const resp = await apiFetch("/invoices/create", {
    method: "POST",
    body: { client_id, service_ids, discount, tax, currency },
  });
  return jsonOrThrow(resp);
}

export async function draftInvoice(payload) {
  const resp = await apiFetch("/invoices/draft", { method: "POST", body: payload });
  return jsonOrThrow(resp);
}

export function invoicePdfUrl(id) {
  return `${API_BASE}/invoices/${id}/pdf`;
}

export async function openInvoicePDF(id) {
  const resp = await apiFetch(`/invoices/${id}/pdf`, { headers: { Accept: "application/pdf" } });
  if (!resp.ok) {
    const err = await resp.text().catch(() => "");
    throw new Error(err || `HTTP ${resp.status}`);
  }
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  // Sugerencia de nombre en la pestaña si el navegador lo permite
  const dispo = resp.headers.get("Content-Disposition") || "";
  const m = dispo.match(/filename="?(.*?)"?$/i);
  if (w && m && m[1]) {
    try { w.document.title = m[1]; } catch {}
  }
  return true;
}

export async function sendInvoiceEmail(id, { to, subject, message }) {
  const resp = await apiFetch(`/invoices/${id}/email`, {
    method: "POST",
    body: { to, subject, message },
  });
  return jsonOrThrow(resp);
}

// ===== Helpers UI =====
export function fullName(u) {
  if (!u) return "";
  const parts = [u.first_name || u.firstName, u.last_name || u.lastName].filter(Boolean);
  return parts.join(" ") || u.email || u.username || "";
}
