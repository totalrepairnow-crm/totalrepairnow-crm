import { getToken, isTokenValid, logoutAndGoLogin } from "./auth";

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  // Content-Type por defecto si mandamos JSON
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    // Si está vencido, salir de una
    if (!isTokenValid(token)) {
      logoutAndGoLogin();
      // devolvemos una Response 401 ficticia para que el caller no se rompa
      return new Response(JSON.stringify({error:'token vencido'}), {status:401, headers:{'Content-Type':'application/json'}});
    }
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(`/api${path}`, { ...options, headers });
  if (res.status === 401) {
    // token no válido en backend
    logoutAndGoLogin();
  }
  return res;
}
