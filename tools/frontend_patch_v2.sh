#!/usr/bin/env bash
set -euo pipefail

FRONT=~/crm_app/frontend
BACKUP=~/backups/front_$(date +%F_%H%M%S).tgz

echo "[1/8] Backup de frontend → $BACKUP"
mkdir -p ~/backups
tar -C "$FRONT" -czf "$BACKUP" src public package.json || true

echo "[2/8] Crear carpetas base"
mkdir -p "$FRONT/src/routes" "$FRONT/src/pages" "$FRONT/src/components" "$FRONT/src/styles" "$FRONT/tools"

# ========= utils/api.js =========
echo "[3/8] Escribiendo utils/api.js"
cat > "$FRONT/src/utils/api.js" <<'JS'
export async function apiFetch(path, options = {}) {
  const tok = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});
  if (tok) headers.set('Authorization', `Bearer ${tok}`);
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(path.startsWith('/api') ? path : `/api${path}`, { ...options, headers });
  // Manejo de expiración de sesión
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    if (window.location.pathname !== '/login') window.location.replace('/login');
    throw new Error('No autorizado');
  }
  return res;
}
JS

# ========= routes/ProtectedRoute.jsx =========
echo "[4/8] Escribiendo rutas protegidas/públicas"
cat > "$FRONT/src/routes/ProtectedRoute.jsx" <<'JS'
import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
JS

cat > "$FRONT/src/routes/PublicOnly.jsx" <<'JS'
import React from "react";
import { Navigate } from "react-router-dom";

export default function PublicOnly({ children }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) return <Navigate to="/" replace />;
  return children;
}
JS

# ========= components/Header.jsx =========
echo "[5/8] Header con logo, email y salir"
cat > "$FRONT/src/components/Header.jsx" <<'JS'
import React from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
  const isLogin = typeof window !== 'undefined' ? window.location.pathname === '/login' : false;

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    navigate('/login', { replace: true });
  }

  return (
    <header className="header">
      <div className="brand">
        <Link to="/" className="brand-link">
          <img src="/logo.png" alt="CRM" className="logo" />
          <span className="brand-text">Total Repair Now — CRM</span>
        </Link>
      </div>
      {!isLogin && (
        <div className="header-right">
          {token ? <span className="api-chip">API: OK</span> : null}
          {email ? <span className="user-pill" title={email}>{email}</span> : null}
          {token ? <button className="btn btn-secondary" onClick={logout}>Salir</button> : null}
        </div>
      )}
    </header>
  );
}
JS

# ========= styles/layout.css =========
echo "[6/8] Estilos de layout"
cat > "$FRONT/src/styles/layout.css" <<'CSS'
:root{
  --bg:#0f172a; --card:#111827; --text:#e5e7eb; --muted:#9ca3af; --accent:#22d3ee; --accent-2:#38bdf8;
  --success:#22c55e; --danger:#ef4444; --chip:#10b981;
}
*{box-sizing:border-box}
html,body,#root{height:100%}
body{margin:0; font-family:Inter,system-ui,Arial,sans-serif; background:var(--bg); color:var(--text);}

.header{display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 16px; background:rgba(17,24,39,.7); backdrop-filter: blur(6px); border-bottom:1px solid rgba(255,255,255,.05); position:sticky; top:0; z-index:9}
.brand{display:flex; align-items:center; gap:10px;}
.brand-link{display:flex; align-items:center; gap:10px; color:var(--text); text-decoration:none}
.logo{height:28px; width:auto}
.brand-text{font-weight:600; letter-spacing:.2px;}
.header-right{display:flex; align-items:center; gap:10px}
.api-chip{padding:4px 8px; border-radius:999px; background:rgba(34,211,238,.15); color:var(--accent); font-size:12px; border:1px solid rgba(34,211,238,.35)}
.user-pill{padding:4px 8px; border-radius:8px; background:rgba(255,255,255,.06); color:var(--text); font-size:12px}

.container{max-width:1100px; margin:24px auto; padding:0 16px}
.dash-head{display:flex; align-items:center; gap:12px; margin-bottom:16px}
.dash-title{font-size:22px; margin:0}
.spacer{flex:1}

.metrics-grid{display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:18px}
@media (max-width:1024px){ .metrics-grid{grid-template-columns:repeat(2,1fr);} }
@media (max-width:640px){ .metrics-grid{grid-template-columns:1fr;} }

.card{background:var(--card); border:1px solid rgba(255,255,255,.06); border-radius:14px; padding:14px}
.card-head{display:flex; align-items:center; justify-content:space-between; margin-bottom:10px}
.card h3{font-size:14px; color:var(--muted); margin:0}
.big{font-size:26px; font-weight:700; color:#fff}

.alert{padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,.08); background:rgba(239,68,68,.12); color:#fff}
.skel{height:50px; background:linear-gradient(90deg, rgba(255,255,255,.06), rgba(255,255,255,.1), rgba(255,255,255,.06)); background-size:200% 100%; animation:sh 1.2s infinite}
@keyframes sh{0%{background-position:200% 0}100%{background-position:-200% 0}}
.table{display:grid; gap:6px}
.tr{display:grid; grid-template-columns:80px 1fr 1fr 140px 120px; gap:10px; align-items:center; padding:10px; border:1px solid rgba(255,255,255,.06); border-radius:10px; background:rgba(255,255,255,.02)}
.tr.th{background:transparent; border:0; color:var(--muted); font-weight:600}
.empty{padding:10px; color:var(--muted); text-align:center}

.btn{border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.06); color:#fff; border-radius:10px; padding:8px 12px; cursor:pointer}
.btn:hover{background:rgba(255,255,255,.1)}
.btn-primary{background:linear-gradient(20deg, var(--accent), var(--accent-2)); border:none}
.btn-secondary{background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12)}
.btn-danger{background:rgba(239,68,68,.2); border:1px solid rgba(239,68,68,.4)}
.actions{display:flex; gap:8px}

.form{display:grid; gap:12px; max-width:520px}
.input{width:100%; padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.04); color:#fff}
.label{font-size:13px; color:var(--muted)}
.row{display:grid; gap:10px; grid-template-columns:1fr 1fr}
@media (max-width:640px){ .row{grid-template-columns:1fr;} }

.list-head{display:flex; align-items:center; gap:10px; margin-bottom:10px}
.search{flex:1}
.link{color:var(--accent); text-decoration:none}
.link:hover{text-decoration:underline}
CSS

# ========= pages/Login.jsx =========
echo "[7/8] Páginas base (Login, Dashboard y CRUD Clientes)"
cat > "$FRONT/src/pages/Login.jsx" <<'JS'
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

export default function Login() {
  const [email, setEmail] = useState("admin@totalrepairnow.com");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error("Credenciales inválidas");
      const data = await res.json();
      if (!data?.token) throw new Error("Respuesta invalida del servidor");
      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", email);
      navigate("/", { replace: true });
    } catch (e) {
      setErr(e.message || "No se pudo iniciar sesión");
    }
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-head"><h3>Iniciar sesión</h3></div>
        {err && <div className="alert">{err}</div>}
        <form className="form" onSubmit={handleSubmit}>
          <label className="label">Email</label>
          <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
          <label className="label">Contraseña</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <div className="actions"><button className="btn btn-primary" type="submit">Entrar</button></div>
        </form>
      </div>
    </div>
  );
}
JS

# ========= pages/Dashboard.jsx =========
cat > "$FRONT/src/pages/Dashboard.jsx" <<'JS'
import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

function Card({ title, value, prefix }) {
  return (
    <div className="card">
      <div className="card-head"><h3>{title}</h3></div>
      <div className="big">{prefix}{String(value ?? '—')}</div>
    </div>
  );
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let ok = true;
    async function load() {
      try {
        const [mRes, cRes] = await Promise.all([
          apiFetch("/metrics"),
          apiFetch("/clients?page=1&pageSize=5&q="),
        ]);
        const m = mRes.ok ? await mRes.json() : {};
        const c = cRes.ok ? await cRes.json() : { items: [] };
        if (ok) { setMetrics(m); setClients(c.items || []); }
      } catch (e) {
        if (ok) setErr("No se pudieron cargar datos");
      } finally {
        if (ok) setLoading(false);
      }
    }
    load();
    return () => { ok = false; }
  }, []);

  return (
    <div className="container">
      <div className="dash-head">
        <h1 className="dash-title">Dashboard</h1>
        <div className="spacer" />
        {localStorage.getItem('token') ? <span className="api-chip">API: OK</span> : null}
      </div>

      <section className="metrics-grid">
        <Card title="Total de clientes" value={metrics?.total_clients ?? (loading ? "…" : 0)} />
        <Card title="Clientes activos" value={metrics?.active_clients ?? (loading ? "…" : 0)} />
        <Card title="Clientes inactivos" value={metrics?.inactive_clients ?? (loading ? "…" : 0)} />
        <Card title="Monto total servicio" value={metrics?.services_total_amount ?? (loading ? "…" : "0.00")} prefix="$" />
      </section>

      <section className="card">
        <div className="card-head"><h3>Clientes recientes</h3></div>
        {loading ? <div className="skel" /> :
         err ? <div className="alert error">{err}</div> :
         <div className="table">
           <div className="tr th"><div>ID</div><div>Empresa</div><div>Email</div><div>Teléfono</div><div>Estado</div></div>
           {clients.map(cl => (
             <div className="tr" key={cl.id}>
               <div>{cl.id}</div>
               <div>{cl.empresa}</div>
               <div>{cl.email || "—"}</div>
               <div>{cl.telefono || "—"}</div>
               <div>{cl.estado}</div>
             </div>
           ))}
           {clients.length === 0 && <div className="empty">No hay clientes</div>}
         </div>}
      </section>
    </div>
  );
}
JS

# ========= pages/Clients.jsx =========
cat > "$FRONT/src/pages/Clients.jsx" <<'JS'
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

export default function Clients() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch(`/clients?page=1&pageSize=20&q=${encodeURIComponent(q)}`);
      const data = res.ok ? await res.json() : { items: [] };
      setItems(data.items || []);
    } catch (e) {
      // silencioso
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, []);
  useEffect(()=>{ const t=setTimeout(load, 300); return ()=>clearTimeout(t); /* eslint-disable-next-line */ }, [q]);

  return (
    <div className="container">
      <div className="list-head">
        <h1 className="dash-title">Clientes</h1>
        <input className="input search" placeholder="Buscar…" value={q} onChange={e=>setQ(e.target.value)} />
        <Link className="btn btn-primary" to="/clients/new">Nuevo</Link>
      </div>

      <div className="card">
        <div className="card-head"><h3>Listado</h3></div>
        {loading ? <div className="skel" /> :
          <div className="table">
            <div className="tr th"><div>ID</div><div>Empresa</div><div>Email</div><div>Teléfono</div><div>Acciones</div></div>
            {items.map(cl => (
              <div className="tr" key={cl.id}>
                <div>{cl.id}</div>
                <div>{cl.empresa}</div>
                <div>{cl.email || "—"}</div>
                <div>{cl.telefono || "—"}</div>
                <div className="actions">
                  <button className="btn" onClick={()=>nav(`/clients/${cl.id}`)}>Ver</button>
                  <button className="btn" onClick={()=>nav(`/clients/${cl.id}/edit`)}>Editar</button>
                </div>
              </div>
            ))}
            {items.length===0 && <div className="empty">No hay resultados</div>}
          </div>}
      </div>
    </div>
  );
}
JS

# ========= pages/ClientDetail.jsx =========
cat > "$FRONT/src/pages/ClientDetail.jsx" <<'JS'
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../utils/api";

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let ok=true;
    async function load(){
      try{
        const res = await apiFetch(`/clients/${id}`);
        if(!res.ok) throw new Error('No encontrado');
        const data = await res.json();
        if(ok) setClient(data);
      }catch(e){ if(ok) setErr(e.message); }
      finally{ if(ok) setLoading(false); }
    }
    load();
    return ()=>{ ok=false; }
  },[id]);

  return (
    <div className="container">
      <div className="dash-head"><h1 className="dash-title">Detalle de cliente</h1></div>
      {loading ? <div className="skel" /> :
       err ? <div className="alert">{err}</div> :
       <div className="card">
         <div className="card-head"><h3>{client.empresa}</h3></div>
         <div className="table">
           <div className="tr th"><div>Campo</div><div>Valor</div><div></div><div></div><div></div></div>
           <div className="tr"><div>ID</div><div>{client.id}</div><div></div><div></div><div></div></div>
           <div className="tr"><div>UUID</div><div>{client.cliente_id}</div><div></div><div></div><div></div></div>
           <div className="tr"><div>Email</div><div>{client.email||'—'}</div><div></div><div></div><div></div></div>
           <div className="tr"><div>Teléfono</div><div>{client.telefono||'—'}</div><div></div><div></div><div></div></div>
           <div className="tr"><div>Estado</div><div>{client.estado}</div><div></div><div></div><div></div></div>
         </div>
       </div>}
    </div>
  );
}
JS

# ========= pages/ClientNew.jsx =========
cat > "$FRONT/src/pages/ClientNew.jsx" <<'JS'
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

export default function ClientNew() {
  const nav = useNavigate();
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail]   = useState("");
  const [telefono, setTelefono] = useState("");
  const [estado, setEstado] = useState("activo");
  const [err, setErr] = useState("");

  async function submit(e){
    e.preventDefault();
    setErr("");
    try {
      const res = await apiFetch("/clients", {
        method: "POST",
        body: JSON.stringify({ empresa, email, telefono, estado })
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data?.error || "Error al crear");
      nav(`/clients/${data.id}`);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-head"><h3>Nuevo cliente</h3></div>
        {err && <div className="alert">{err}</div>}
        <form className="form" onSubmit={submit}>
          <label className="label">Empresa *</label>
          <input className="input" value={empresa} onChange={e=>setEmpresa(e.target.value)} required />
          <div className="row">
            <div>
              <label className="label">Email</label>
              <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input className="input" value={telefono} onChange={e=>setTelefono(e.target.value)} />
            </div>
          </div>
          <label className="label">Estado</label>
          <select className="input" value={estado} onChange={e=>setEstado(e.target.value)}>
            <option value="activo">activo</option>
            <option value="inactivo">inactivo</option>
          </select>
          <div className="actions">
            <button className="btn btn-primary" type="submit">Crear</button>
          </div>
        </form>
      </div>
    </div>
  );
}
JS

# ========= pages/ClientEdit.jsx =========
cat > "$FRONT/src/pages/ClientEdit.jsx" <<'JS'
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../utils/api";

export default function ClientEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail]   = useState("");
  const [telefono, setTelefono] = useState("");
  const [estado, setEstado] = useState("activo");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let ok=true;
    async function load(){
      try{
        const res = await apiFetch(`/clients/${id}`);
        if(!res.ok) throw new Error("No encontrado");
        const c = await res.json();
        if(ok){
          setEmpresa(c.empresa||"");
          setEmail(c.email||"");
          setTelefono(c.telefono||"");
          setEstado(c.estado||"activo");
        }
      }catch(e){ if(ok) setErr(e.message); }
      finally{ if(ok) setLoading(false); }
    }
    load();
    return ()=>{ ok=false; }
  },[id]);

  async function submit(e){
    e.preventDefault();
    setErr("");
    try {
      const res = await apiFetch(`/clients/${id}`, {
        method: "PUT",
        body: JSON.stringify({ empresa, email, telefono, estado })
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data?.error || "Error al guardar");
      nav(`/clients/${id}`);
    } catch (e) {
      setErr(e.message);
    }
  }

  if(loading) return <div className="container"><div className="skel"/></div>;

  return (
    <div className="container">
      <div className="card">
        <div className="card-head"><h3>Editar cliente</h3></div>
        {err && <div className="alert">{err}</div>}
        <form className="form" onSubmit={submit}>
          <label className="label">Empresa *</label>
          <input className="input" value={empresa} onChange={e=>setEmpresa(e.target.value)} required />
          <div className="row">
            <div>
              <label className="label">Email</label>
              <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input className="input" value={telefono} onChange={e=>setTelefono(e.target.value)} />
            </div>
          </div>
          <label className="label">Estado</label>
          <select className="input" value={estado} onChange={e=>setEstado(e.target.value)}>
            <option value="activo">activo</option>
            <option value="inactivo">inactivo</option>
          </select>
          <div className="actions">
            <button className="btn btn-primary" type="submit">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
JS

# ========= App.jsx (rutas) =========
echo "[8/8] App.jsx con rutas y guardas"
cat > "$FRONT/src/App.jsx" <<'JS'
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicOnly from "./routes/PublicOnly";

// Páginas
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientNew from "./pages/ClientNew";
import ClientEdit from "./pages/ClientEdit";
import ClientDetail from "./pages/ClientDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        {/* Rutas protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <Clients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/new"
          element={
            <ProtectedRoute>
              <ClientNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:id"
          element={
            <ProtectedRoute>
              <ClientDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:id/edit"
          element={
            <ProtectedRoute>
              <ClientEdit />
            </ProtectedRoute>
          }
        />

        {/* Pública */}
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
JS

# ========= index.js: asegurar import de estilos =========
if ! grep -q "import \"./styles/layout.css\"" "$FRONT/src/index.js"; then
  sed -i '1 i import "./styles/layout.css";' "$FRONT/src/index.js" || true
fi

echo "[BUILD] Compilar y publicar"
cd "$FRONT"
npm run build

sudo rsync -av --delete "$FRONT/build/" /var/www/crm/
sudo find /var/www/crm -type f -exec chmod 644 {} \;
sudo find /var/www/crm -type d -exec chmod 755 {} \;

# Nginx OK?
sudo nginx -t >/dev/null && sudo systemctl reload nginx || echo "[WARN] Nginx no recargado; revisa config"
echo "[DONE] Frontend actualizado y desplegado."
SH

chmod +x ~/crm_app/tools/frontend_patch_v2.sh
echo "Script creado: ~/crm_app/tools/frontend_patch_v2.sh"
