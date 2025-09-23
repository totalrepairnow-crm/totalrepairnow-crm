import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'https://crm.totalrepairnow.com/api',
});

api.interceptors.request.use(cfg=>{
  const tok = localStorage.getItem('token');
  if (tok) cfg.headers.Authorization = `Bearer ${tok}`;
  return cfg;
});

export const get  = (url,cfg)=>api.get(url,cfg).then(r=>r.data);
export const post = (url,body,cfg)=>api.post(url,body,cfg).then(r=>r.data);

export default api;
