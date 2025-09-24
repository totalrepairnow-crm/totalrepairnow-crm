// src/lib/services.js — rutas anidadas con clientId, usando apiFetch
import { apiFetch } from "./api";

// Helper para query strings
function qs(params = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v).trim() !== "") p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

// Intenta resolver un clientId "por defecto" y lo cachea en localStorage
async function resolveDefaultClientId() {
  const KEY = "defaultClientId";
  let id = localStorage.getItem(KEY);
  if (id) return id;

  // Tu API de clientes devuelve array simple (según tus pruebas/Smoke)
  const list = await apiFetch(`/clients`);
  const first = Array.isArray(list) ? list[0] : (list?.items?.[0] ?? null);
  id = first?.id;
  if (id != null) localStorage.setItem(KEY, String(id));
  return id;
}

function servicesBasePath(clientId) {
  // Si hay clientId usamos la ruta anidada; si no, caemos a /services (fallback)
  return clientId
    ? `/clients/${encodeURIComponent(clientId)}/services`
    : `/services`;
}

// === Endpoints Services ===

export async function listServices({ q = "", status = "", page = 1, limit = 20 } = {}) {
  const clientId = await resolveDefaultClientId();
  const base = servicesBasePath(clientId);
  return apiFetch(`${base}${qs({ q: q?.trim() || undefined, status, page, limit })}`);
}

export async function getServiceById(id, clientId) {
  const cid = clientId ?? await resolveDefaultClientId();
  const base = servicesBasePath(cid);
  return apiFetch(`${base}/${encodeURIComponent(id)}`);
}

export async function createService(payload = {}, clientId) {
  const cid = clientId ?? await resolveDefaultClientId();
  const base = servicesBasePath(cid);
  return apiFetch(base, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateService(id, payload = {}, clientId) {
  const cid = clientId ?? await resolveDefaultClientId();
  const base = servicesBasePath(cid);
  return apiFetch(`${base}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteService(id, clientId) {
  const cid = clientId ?? await resolveDefaultClientId();
  const base = servicesBasePath(cid);
  return apiFetch(`${base}/${encodeURIComponent(id)}`, { method: "DELETE" });
}
