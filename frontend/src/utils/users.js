import { apiFetch } from "./api";

export async function listUsers(){
  const r = await apiFetch(`/users`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
export async function createUser({email,password,role}){
  const r = await apiFetch(`/users`, {method:'POST', body: JSON.stringify({email,password,role})});
  const data = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}
