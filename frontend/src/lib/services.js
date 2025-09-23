// src/lib/services.js — alineado a tu api actual (usa apiFetch con paths relativos)
// No requiere cambiar src/lib/api.js
import { apiFetch } from "./api";

// Helper pequeño para query strings (evita dependencias a joinQs interno si no está exportado)
function qs(params = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v).trim() !== "") p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

// === Endpoints Services ===
// Mantengo los nombres que usan tus pages ServiceDetail/ServiceNew
export async function getServiceById(id) {
  // OJO: tu apiFetch ya pone el prefijo /api, así que aquí NO lo agregamos
  return apiFetch(`/services/${encodeURIComponent(id)}`);
}

export async function createService(payload) {
  return apiFetch(`/services`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

// (Opcional) útil para listado si lo necesitas en Services.jsx
export async function listServices({ q = "", status = "", page = 1, limit = 20 } = {}) {
  return apiFetch(`/services${qs({ q: q?.trim() || undefined, status, page, limit })}`);
}

// (Opcional) update/delete por si tus pantallas lo usan después
export async function updateService(id, payload) {
  return apiFetch(`/services/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload || {}),
  });
}

export async function deleteService(id) {
  return apiFetch(`/services/${encodeURIComponent(id)}`, { method: "DELETE" });
}
