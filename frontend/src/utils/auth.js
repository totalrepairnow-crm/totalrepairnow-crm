export function getToken(){
  return (typeof window!=='undefined') ? localStorage.getItem('token') : null;
}
export function setToken(tok){
  if (typeof window!=='undefined'){
    if (tok) localStorage.setItem('token', tok); else localStorage.removeItem('token');
  }
}
export function parseJwt(token){
  try{
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c=>'%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload);
  }catch(_e){ return null; }
}
export function isTokenValid(token){
  if (!token) return false;
  const p = parseJwt(token);
  if (!p) return false;
  if (p.exp && Date.now() >= p.exp*1000) return false; // vencido
  return true;
}
export function getUserFromToken(token){
  const p = parseJwt(token);
  if (!p) return { email:null, role:null, sub:null };
  // asume que el backend mete email/role (ajústalo si usa otras claves)
  const email = p.email || p.user?.email || null;
  const role  = p.role  || p.user?.role  || null;
  const sub   = p.sub   || p.user?.id    || null;
  return { email, role, sub, payload: p };
}
export function logoutAndGoLogin(){
  setToken(null);
  if (typeof window!=='undefined') window.location.assign('/login');
}
