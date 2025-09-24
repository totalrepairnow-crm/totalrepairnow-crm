// src/lib/services.js
// Alineado a API anidada: /clients/:id/services
// Sigue usando apiFetch (que ya antepone /api)
import { apiFetch } from "./api";

// ---- Helpers ----
function qs(params = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v).trim() !== "") p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

// Resuelve y cachea un clientId por defecto (primer cliente)
async function resolveClientId(passed) {
  if (passed) return passed;
  const cached = localStorage.getItem("defaultClientId");
  if (cached) return cached;

  const clients = await apiFetch(`/clients`);
  const cid = clients?.[0]?.id;
  if (cid) localStorage.setItem("defaultClientId", String(cid));
  return cid;
}

// ---- Endpoints Services ----

// 1) LISTADO (usa ruta anidada)
export async function listServices({ clientId, q = "", status = "", page = 1, limit = 20 } = {}) {
  const cid = await resolveClientId(clientId);
  if (!cid) return []; // No hay clientes aún
  return apiFetch(
    `/clients/${encodeURIComponent(cid)}/services${qs({
      q: q?.trim() || undefined,
      status,
      page,
      limit,
    })}`,
  );
}

// 2) CREAR (usa ruta anidada)
export async function createService(payload, { clientId } = {}) {
  const cid = await resolveClientId(clientId);
  if (!cid) throw new Error("No default client id available to create service.");
  return apiFetch(`/clients/${encodeURIComponent(cid)}/services`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

// 3) OBTENER POR ID
//   - Fast path: /services/:id si existe
//   - Fallback:  /clients/:cid/services/:id
export async function getServiceById(id, { clientId } = {}) {
  const sid = encodeURIComponent(id);
  try {
    return await apiFetch(`/services/${sid}`);
  } catch (e) {
    const cid = await resolveClientId(clientId);
    if (!cid) throw e;
    return apiFetch(`/clients/${encodeURIComponent(cid)}/services/${sid}`);
  }
}

// 4) ACTUALIZAR POR ID (mismo patrón)
export async function updateService(id, payload, { clientId } = {}) {
  const sid = encodeURIComponent(id);
  try {
    return await apiFetch(`/services/${sid}`, {
      method: "PUT",
      body: JSON.stringify(payload || {}),
    });
  } catch (e) {
    const cid = await resolveClientId(clientId);
    if (!cid) throw e;
    return apiFetch(`/clients/${encodeURIComponent(cid)}/services/${sid}`, {
      method: "PUT",
      body: JSON.stringify(payload || {}),
    });
  }
}

// 5) ELIMINAR POR ID (mismo patrón)
export async function deleteService(id, { clientId } = {}) {
  const sid = encodeURIComponent(id);
  try {
    return await apiFetch(`/services/${sid}`, { method: "DELETE" });
  } catch (e) {
    const cid = await resolveClientId(clientId);
    if (!cid) throw e;
    return apiFetch(`/clients/${encodeURIComponent(cid)}/services/${sid}`, { method: "DELETE" });
  }
}
