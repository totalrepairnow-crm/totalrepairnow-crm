const BASE = process.env.REACT_APP_API_URL || "";
function getToken(){ return localStorage.getItem("jwt") || ""; }

export async function apiFetch(path,{method="GET",headers={},body}={}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`,{
    method,
    headers: { "Content-Type":"application/json", ...(token?{Authorization:`Bearer ${token}`}:{}) , ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 401) { localStorage.removeItem("jwt"); localStorage.removeItem("user"); throw new Error("No autorizado"); }
  if (!res.ok) { const t = await res.text().catch(()=> ""); throw new Error(t || `Error ${res.status}`); }
  try { return await res.json(); } catch { return await res.text(); }
}

export const api = {
  login: (email,password)=>apiFetch("/auth/login",{method:"POST",body:{email,password}}),
  health: ()=>apiFetch("/health"),
  clients: {
    list: ({ q="", status="", page=1, pageSize=10, sort="company_name", order="asc" }={}) =>
      apiFetch(`/clients?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}&page=${page}&pageSize=${pageSize}&sort=${encodeURIComponent(sort)}&order=${encodeURIComponent(order)}`)
  }
};
