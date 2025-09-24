// src/lib/services.js — rutas anidadas por cliente + fallback
import { apiFetch } from "./api";

// Helper de querystring (sin dependencias externas)
function qs(params = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v).trim() !== "") p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

// --- Resolver cliente por defecto ------------------------------------------
async function resolveClientId() {
  let cid = localStorage.getItem("defaultClientId");
  if (cid && String(cid).trim() !== "") return cid;

  // Busca el primer cliente y lo recuerda
  const list = await apiFetch("/clients"); // <- tu backend ya tiene esta ruta
  const first = Array.isArray(list) && list.length ? list[0] : null;
  if (!first || first.id == null) {
    throw new Error("No clients available to resolve defaultClientId");
  }
  cid = String(first.id);
  localStorage.setItem("defaultClientId", cid);
  return cid;
}

// --- Services anidados por cliente ------------------------------------------

// Lista servicios del cliente por defecto
export async function listServices({ q = "", status = "", page = 1, limit = 10 } = {}) {
  const cid = await resolveClientId();
  const query = qs({
    q: q?.trim() || undefined,
    status: status || undefined,
    page,
    limit,
  });
  return apiFetch(`/clients/${encodeURIComponent(cid)}/services${query}`);
}

// Crear servicio para el cliente por defecto
export async function createService(payload) {
  const cid = await resolveClientId();
  return apiFetch(`/clients/${encodeURIComponent(cid)}/services`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

// Detalle de servicio: intenta anidado; si 404, hace fallback a ruta plana.
export async function getServiceById(serviceId) {
  const cid = await resolveClientId();
  try {
    return await apiFetch(`/clients/${encodeURIComponent(cid)}/services/${encodeURIComponent(serviceId)}`);
  } catch (e) {
    // Fallback si tu backend acepta /services/:id
    return apiFetch(`/services/${encodeURIComponent(serviceId)}`);
  }
}

export async function updateService(serviceId, payload) {
  const cid = await resolveClientId();
  try {
    return await apiFetch(`/clients/${encodeURIComponent(cid)}/services/${encodeURIComponent(serviceId)}`, {
      method: "PUT",
      body: JSON.stringify(payload || {}),
    });
  } catch {
    return apiFetch(`/services/${encodeURIComponent(serviceId)}`, {
      method: "PUT",
      body: JSON.stringify(payload || {}),
    });
  }
}

export async function deleteService(serviceId) {
  const cid = await resolveClientId();
  try {
    return await apiFetch(`/clients/${encodeURIComponent(cid)}/services/${encodeURIComponent(serviceId)}`, {
      method: "DELETE",
    });
  } catch {
    return apiFetch(`/services/${encodeURIComponent(serviceId)}`, { method: "DELETE" });
  }
}
