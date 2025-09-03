#!/usr/bin/env bash
set -euo pipefail

FRONT=~/crm_app/frontend
echo "[1/8] Backup frontend (src, public, package.json)"
mkdir -p ~/backups
tar -C "$FRONT" -czf ~/backups/front_$(date +%F_%H%M%S).tgz src public package.json || true

echo "[2/8] Asegurar carpetas"
mkdir -p "$FRONT/src/utils" "$FRONT/src/routes" "$FRONT/src/components" "$FRONT/src/pages" "$FRONT/src/styles"

# ---------- utils/api.js ----------
cat > "$FRONT/src/utils/api.js" <<'JS'
export async function apiFetch(path, opts = {}) {
  const token = (typeof window!=="undefined") ? localStorage.getItem("token") : null;
  const headers = Object.assign({}, opts.headers || {});
  if (opts.body && !headers['Content-Type'] && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, { ...opts, headers });
  if (res.status === 401) {
    try { localStorage.removeItem('token'); } catch (_e) {}
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('401 Unauthorized');
  }
  return res;
}

export const api = {
  get: (p) => apiFetch(p),
  post: (p, data) => apiFetch(p, { method: 'POST', body: JSON.stringify(data) }),
  put: (p, data) => apiFetch(p, { method: 'PUT', body: JSON.stringify(data) }),
  del: (p) => apiFetch(p, { method: 'DELETE' }),
};
JS

# ---------- routes/guards.jsx ----------
cat > "$FRONT/src/routes/guards.jsx" <<'JS'
import React from "react";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }) {
  const tok = (typeof window !== 'undefined') && localStorage.getItem('token');
  if (!tok) return <Navigate to="/login" replace />;
  return children;
}

export function PublicOnly({ children }) {
  const tok = (typeof window !== 'undefined') && localStorage.getItem('token');
  if (tok) return <Navigate to="/" replace />;
  return children;
}
JS

# ---------- components/Header.jsx ----------
cat > "$FRONT/src/components/Header.jsx" <<'JS'
import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const loc = useLocation();
  const token = (typeof window !== 'undefined') ? localStorage.getItem('token') : null;

  function handleLogout() {
    try { localStorage.removeItem('token'); } catch (_e) {}
    navigate('/login', { replace: true });
  }

  return (
    <header className="header">
      <div className="brand" onClick={() => navigate('/')}>
        <img src="/logo.png" alt="CRM" className="logo" />
        <span>Total Repair Now — CRM</span>
      </div>

      <nav className="nav" aria-label="primary">
        <Link to="/" className={loc.pathname === "/" ? "active" : ""}>Dashboard</Link>
        <Link to="/clients" className={loc.pathname.startsWith("/clients") ? "active" : ""}>Clientes</Link>
        <Link to="/users" className="disabled" title="Próximamente">Usuarios</Link>
      </nav>

      <div className="right">
        {token && <span className="api-chip">API: OK</span>}
        {token ? (
          <button className="btn" onClick={handleLogout}>Salir</button>
        ) : (
          <Link to="/login" className="btn ghost">Entrar</Link>
        )}
      </div>
    </header>
  );
}
JS

# ---------- pages/Login.jsx (márgenes + login) ----------
cat > "$FRONT/src/pages/Login.jsx" <<'JS'
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@totalrepairnow.com");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const r = await api.post("/api/auth/login", { email, password });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (!data.token) throw new Error("Sin token");
      localStorage.setItem("token", data.token);
      nav("/", { replace: true });
    } catch (err) {
      setMsg("Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <div className="card">
        <h1>Iniciar sesión</h1>
        {msg && <div className="alert error">{msg}</div>}
        <form onSubmit={onSubmit} className="form">
          <label>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <label>Contraseña</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <button className="btn" disabled={loading}>{loading ? "Entrando…" : "Entrar"}</button>
        </form>
      </div>
    </div>
  );
}
JS

# ---------- pages/Dashboard.jsx (con métrica tolerante) ----------
cat > "$FRONT/src/pages/Dashboard.jsx" <<'JS'
import React, { useEffect, useState } from "react";
import { api } from "../utils/api";

function Card({ title, value, prefix }) {
  return (
    <div className="card">
      <div className="card-head"><h3>{title}</h3></div>
      <div className="big">{prefix}{String(value ?? "—")}</div>
    </div>
  );
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // métricas (si no existe, ignora y muestra ceros)
        try {
          const r = await api.get("/api/metrics");
          if (r.ok) setMetrics(await r.json());
        } catch (_e) {}
        // clientes recientes
        const r2 = await api.get("/api/clients?page=1&pageSize=5");
        if (r2.ok) {
          const j = await r2.json();
          setClients(j.items || []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container">
      <div className="dash-head">
        <h1 className="dash-title">Dashboard</h1>
        <div className="spacer" />
        <span className="api-chip">API: OK</span>
      </div>

      <section className="metrics-grid">
        <Card title="Total de clientes" value={metrics?.total_clients ?? (loading ? "…" : 0)} />
        <Card title="Clientes activos" value={metrics?.active_clients ?? (loading ? "…" : 0)} />
        <Card title="Clientes inactivos" value={metrics?.inactive_clients ?? (loading ? "…" : 0)} />
        <Card title="Monto total servicio" value={metrics?.services_total_amount ?? (loading ? "…" : "0.00")} prefix="$" />
      </section>

      <section className="card">
        <div className="card-head"><h3>Clientes recientes</h3></div>
        <div className="table">
          <div className="tr th">
            <div>ID</div><div>Empresa</div><div>Email</div><div>Teléfono</div><div>Estado</div>
          </div>
          {clients.map(cl => (
            <div className="tr" key={cl.id}>
              <div>{cl.id}</div>
              <div>{cl.empresa}</div>
              <div>{cl.email || "—"}</div>
              <div>{cl.telefono || "—"}</div>
              <div>{cl.estado}</div>
            </div>
          ))}
          {(!loading && clients.length===0) && <div className="empty">No hay clientes</div>}
        </div>
      </section>
    </div>
  );
}
JS

# ---------- pages/Clients.jsx (listar + acciones) ----------
cat > "$FRONT/src/pages/Clients.jsx" <<'JS'
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";

export default function Clients() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get(`/api/clients?page=1&pageSize=50&q=${encodeURIComponent(q)}`);
      if (r.ok) {
        const j = await r.json();
        setItems(j.items || []);
      }
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []); // primera carga

  return (
    <div className="container">
      <div className="card">
        <div className="card-head">
          <h2>Clientes</h2>
          <div className="spacer" />
          <Link to="/clients/new" className="btn">Nuevo cliente</Link>
        </div>

        <div className="toolbar">
          <input
            placeholder="Buscar por empresa o email…"
            value={q}
            onChange={e=>setQ(e.target.value)}
            onKeyDown={e=>e.key==='Enter' && load()}
          />
          <button className="btn ghost" onClick={load}>Buscar</button>
        </div>

        <div className="table">
          <div className="tr th">
            <div>ID</div><div>Empresa</div><div>Email</div><div>Teléfono</div><div>Estado</div><div>Acciones</div>
          </div>
          {loading ? <div className="skel" /> : items.map(cl => (
            <div className="tr" key={cl.id}>
              <div>{cl.id}</div>
              <div>{cl.empresa}</div>
              <div>{cl.email || "—"}</div>
              <div>{cl.telefono || "—"}</div>
              <div>{cl.estado}</div>
              <div>
                <Link to={`/clients/${cl.id}`} className="link">Ver</Link>{" · "}
                <Link to={`/clients/${cl.id}/edit`} className="link">Editar</Link>
              </div>
            </div>
          ))}
          {(!loading && items.length===0) && <div className="empty">Sin resultados</div>}
        </div>
      </div>
    </div>
  );
}
JS

# ---------- pages/ClientDetail.jsx ----------
cat > "$FRONT/src/pages/ClientDetail.jsx" <<'JS'
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../utils/api";

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async ()=>{
      try {
        const r = await api.get(`/api/clients/${id}`);
        if (r.ok) setClient(await r.json());
      } finally { setLoading(false); }
    })();
  },[id]);

  if (loading) return <div className="container"><div className="skel" /></div>;
  if (!client) return <div className="container"><div className="alert error">No encontrado</div></div>;

  return (
    <div className="container">
      <div className="card">
        <div className="card-head">
          <h2>Cliente #{client.id}</h2>
          <div className="spacer" />
          <Link to={`/clients/${client.id}/edit`} className="btn">Editar</Link>
        </div>
        <div className="detail">
          <div><strong>Empresa:</strong> {client.empresa}</div>
          <div><strong>Email:</strong> {client.email || "—"}</div>
          <div><strong>Teléfono:</strong> {client.telefono || "—"}</div>
          <div><strong>Estado:</strong> {client.estado}</div>
          <div><strong>Creado:</strong> {new Date(client.created_at).toLocaleString()}</div>
          <div><strong>Actualizado:</strong> {new Date(client.updated_at).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
JS

# ---------- pages/ClientNew.jsx ----------
cat > "$FRONT/src/pages/ClientNew.jsx" <<'JS'
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";

export default function ClientNew() {
  const nav = useNavigate();
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [estado, setEstado] = useState("activo");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(""); setLoading(true);
    try {
      const r = await api.post("/api/clients", { empresa, email, telefono, estado });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const created = await r.json();
      nav(`/clients/${created.id}`, { replace: true });
    } catch (e) {
      setMsg("Error al crear cliente");
    } finally { setLoading(false); }
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-head"><h2>Nuevo cliente</h2></div>
        {msg && <div className="alert error">{msg}</div>}
        <form className="form" onSubmit={onSubmit}>
          <label>Empresa *</label>
          <input value={empresa} onChange={e=>setEmpresa(e.target.value)} required />
          <label>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <label>Teléfono</label>
          <input value={telefono} onChange={e=>setTelefono(e.target.value)} />
          <label>Estado</label>
          <select value={estado} onChange={e=>setEstado(e.target.value)}>
            <option value="activo">activo</option>
            <option value="inactivo">inactivo</option>
          </select>
          <button className="btn" disabled={loading}>{loading ? "Guardando…" : "Guardar"}</button>
        </form>
      </div>
    </div>
  );
}
JS

# ---------- pages/ClientEdit.jsx (incluye empresa en PUT) ----------
cat > "$FRONT/src/pages/ClientEdit.jsx" <<'JS'
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../utils/api";

export default function ClientEdit() {
  const nav = useNavigate();
  const { id } = useParams();
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [estado, setEstado] = useState("activo");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    (async ()=>{
      try {
        const r = await api.get(`/api/clients/${id}`);
        if (r.ok) {
          const c = await r.json();
          setEmpresa(c.empresa || "");
          setEmail(c.email || "");
          setTelefono(c.telefono || "");
          setEstado(c.estado || "activo");
        }
      } finally { setLoading(false); }
    })();
  },[id]);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(""); setSaving(true);
    try {
      // IMPORTANTE: enviar 'empresa' en PUT (el backend la requiere)
      const r = await api.put(`/api/clients/${id}`, { empresa, email, telefono, estado });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      nav(`/clients/${id}`, { replace: true });
    } catch (_e) {
      setMsg("Error al guardar (verifica que Empresa no esté vacía)");
    } finally { setSaving(false); }
  }

  if (loading) return <div className="container"><div className="skel" /></div>;

  return (
    <div className="container">
      <div className="card">
        <div className="card-head"><h2>Editar cliente #{id}</h2></div>
        {msg && <div className="alert error">{msg}</div>}
        <form className="form" onSubmit={onSubmit}>
          <label>Empresa *</label>
          <input value={empresa} onChange={e=>setEmpresa(e.target.value)} required />
          <label>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <label>Teléfono</label>
          <input value={telefono} onChange={e=>setTelefono(e.target.value)} />
          <label>Estado</label>
          <select value={estado} onChange={e=>setEstado(e.target.value)}>
            <option value="activo">activo</option>
            <option value="inactivo">inactivo</option>
          </select>
          <button className="btn" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
        </form>
      </div>
    </div>
  );
}
JS

# ---------- App.jsx (rutas + estilos) ----------
cat > "$FRONT/src/App.jsx" <<'JS'
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles/app.css";

import Header from "./components/Header";
import { ProtectedRoute, PublicOnly } from "./routes/guards";

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
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />

        {/* Clientes */}
        <Route path="/clients" element={
          <ProtectedRoute><Clients /></ProtectedRoute>
        } />
        <Route path="/clients/new" element={
          <ProtectedRoute><ClientNew /></ProtectedRoute>
        } />
        <Route path="/clients/:id" element={
          <ProtectedRoute><ClientDetail /></ProtectedRoute>
        } />
        <Route path="/clients/:id/edit" element={
          <ProtectedRoute><ClientEdit /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
JS

# ---------- styles/app.css (login márgenes + nav + layout) ----------
cat > "$FRONT/src/styles/app.css" <<'CSS'
:root { --bg:#0d1117; --fg:#e6edf3; --muted:#8b949e; --card:#161b22; --border:#30363d; --brand:#2f81f7; }
*{box-sizing:border-box}
html,body,#root{height:100%}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.4 system-ui,Segoe UI,Roboto,Ubuntu,sans-serif}

.header{display:flex;align-items:center;gap:16px;padding:10px 16px;border-bottom:1px solid var(--border);position:sticky;top:0;background:rgba(13,17,23,.9);backdrop-filter:saturate(180%) blur(6px);z-index:10}
.brand{display:flex;align-items:center;gap:10px;cursor:pointer}
.brand .logo{height:28px;width:auto;display:block}
.nav{display:flex;gap:14px;margin-left:10px}
.nav a{color:var(--fg);text-decoration:none;padding:6px 10px;border-radius:8px;border:1px solid transparent}
.nav a:hover{border-color:var(--border)}
.nav a.active{background:var(--card);border-color:var(--border)}
.nav a.disabled{opacity:.5;pointer-events:none}
.right{margin-left:auto;display:flex;gap:10px;align-items:center}
.api-chip{font-size:12px;border:1px solid var(--border);padding:4px 8px;border-radius:99px;color:#58a6ff;background:rgba(56,139,253,.1)}
.btn{background:var(--brand);color:#fff;border:0;border-radius:10px;padding:8px 12px;cursor:pointer}
.btn.ghost{background:transparent;color:var(--fg);border:1px solid var(--border)}

.container{max-width:1100px;margin:20px auto;padding:0 16px}
.card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:16px}
.card-head{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.card-head .spacer{flex:1}
.big{font-size:28px;font-weight:700}

.metrics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
@media (max-width:960px){.metrics-grid{grid-template-columns:repeat(2,1fr)}}
@media (max-width:520px){.metrics-grid{grid-template-columns:1fr}}

.table{display:grid}
.tr{display:grid;grid-template-columns:80px 1.2fr 1.2fr 1fr 100px 140px;gap:10px;align-items:center;padding:8px 6px;border-bottom:1px solid var(--border)}
.tr.th{font-weight:600;color:var(--muted)}
.tr:last-child{border-bottom:0}
.link{color:#58a6ff;text-decoration:none}
.link:hover{text-decoration:underline}
.toolbar{display:flex;gap:10px;margin:8px 0}
.toolbar input{flex:1;min-width:240px}

.form{display:flex;flex-direction:column;gap:8px}
.form input,.form select{background:#0b0f14;color:var(--fg);border:1px solid var(--border);border-radius:8px;padding:8px}

.alert{padding:8px;border-radius:8px}
.alert.error{background:#3d0f13;color:#ffb4b4;border:1px solid #5a1a21}

.skel{height:60px;border-radius:10px;background:linear-gradient(90deg,#111 25%,#1a1f26 50%,#111 75%);background-size:300% 100%;animation:sk 1.2s infinite}
@keyframes sk{0%{background-position:0 0}100%{background-position:-300% 0}}

.empty{padding:10px;color:var(--muted)}

/* LOGIN: caja centrada y márgenes correctos */
.login{min-height:calc(100vh - 56px);display:flex;align-items:flex-start}
.login .card{max-width:420px;margin:10vh auto 0; width:100%}
.login h1{margin:0 0 12px}
CSS

echo "[3/8] (Opcional) Quitar duplicados 'import React' si quedaron antes"
fixer="$FRONT/tools/fix-react-imports.sh"
cat > "$fixer" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
FILES=( "src/pages/ClientDetail.jsx" "src/pages/ClientEdit.jsx" "src/pages/ClientNew.jsx" "src/pages/Clients.jsx" )
for f in "${FILES[@]}"; do
  [ -f "$f" ] || continue
  cp -a "$f" "$f.bak.$(date +%s)"
  awk 'BEGIN{seen=0} { if ($0 ~ /^import[[:space:]]+React(\s*,|\s+from|\s*)/){ if(seen==1) next; seen=1 } print }' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
done
SH
chmod +x "$fixer"
( cd "$FRONT" && ./tools/fix-react-imports.sh ) || true

echo "[4/8] Compilando frontend"
cd "$FRONT"
npm run build

echo "[5/8] Publicando build"
if [ -x /usr/local/bin/crm_web_deploy.sh ]; then
  /usr/local/bin/crm_web_deploy.sh
else
  sudo rsync -av --delete build/ /var/www/crm/
  sudo find /var/www/crm -type f -exec chmod 644 {} \;
  sudo find /var/www/crm -type d -exec chmod 755 {} \;
  sudo nginx -t && sudo systemctl reload nginx || true
fi

echo "[6/8] Verificando archivos estáticos"
curl -sI https://crm.totalrepairnow.com/logo.png | head -n1 || true
curl -sI https://crm.totalrepairnow.com/ | head -n1 || true

echo "[7/8] Hecho. Si no ves estilos o logo, refresca duro (Ctrl+F5)."
echo "[8/8] Rutas activas: / (dashboard), /clients, /clients/new, /clients/:id, /clients/:id/edit, /login"
