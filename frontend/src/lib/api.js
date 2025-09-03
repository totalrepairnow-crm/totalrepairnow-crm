// src/lib/api.js
export function authHeaders() {
  const t = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` };
}

export async function listClients({ page = 1, pageSize = 20, q = '' } = {}) {
  const r = await fetch(`/api/clients?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(q)}`, {
    headers: authHeaders(),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function getClient(id) {
  const r = await fetch(`/api/clients/${id}/details`, { headers: authHeaders() });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function createClient(payload) {
  const r = await fetch(`/api/clients`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
  return data;
}

export async function updateClient(id, payload) {
  const r = await fetch(`/api/clients/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
  return data;
}
