import { apiFetch } from "./api";

export async function listClients({page=1,pageSize=20,q=""}={}) {
  const r = await apiFetch(`/clients?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(q)}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
export async function getClient(id){
  const r = await apiFetch(`/clients/${id}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
export async function createClient(payload){
  const r = await apiFetch(`/clients`, {method:'POST', body: JSON.stringify(payload)});
  const data = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}
export async function updateClient(id, payload){
  const r = await apiFetch(`/clients/${id}`, {method:'PUT', body: JSON.stringify(payload)});
  const data = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}
export async function listUploads(id){
  const r = await apiFetch(`/clients/${id}/uploads`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
export async function uploadFiles(id, files){
  const fd = new FormData();
  [...files].forEach(f=>fd.append('files', f));
  const r = await apiFetch(`/clients/${id}/uploads`, { method:'POST', body: fd });
  const data = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}
