#!/usr/bin/env bash
set -euo pipefail

FRONT=~/crm_app/frontend

echo "[1/8] Backup del frontend actual"
mkdir -p ~/backups
tar -C "$FRONT" -czf ~/backups/front_$(date +%F_%H%M%S).tgz src public package.json || true

echo "[2/8] Archivos base y util de API"
mkdir -p "$FRONT/src/utils" "$FRONT/src/routes" "$FRONT/src/components" "$FRONT/src/pages" "$FRONT/src/styles"

# Wrapper fetch con manejo de token + 401
cat > "$FRONT/src/utils/api.js" <<'JS'
export async function apiFetch(path, options = {}) {
  const tok = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (tok) headers.set('Authorization', `Bearer ${tok}`);

  const res = await fetch(path, { ...options, headers });
  if (res.status === 401) {
    // Token inválido / vencido: limpiar y volver a login
    localStorage.removeItem('token');
    if (!location.pathname.startsWith('/login')) {
      location.href = '/login';
    }
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${text}`);
  }
  const ctype = res.headers.get('content-type') || '';
  return ctype.includes('application/json') ? res.json() : res.text();
}
JS

echo "[3/8] Rutas protegidas y públicas"
# Ruta protegida: exige token
cat > "$FRONT/src/routes/ProtectedRoute.jsx" <<'JS'
import { Navigate } from "react-router-dom";
export default function ProtectedRoute({ children }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
JS

# Ruta solo pública: si hay token, manda al dashboard
cat > "$FRONT/src/routes/PublicOnly.jsx" <<'JS'
import { Navigate } from "react-router-dom";
export default function PublicOnly({ children }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) return <Navigate to="/" replace />;
  return children;
}
JS

echo "[4/8] App.jsx con guardas y rutas"
cat > "$FRONT/src/App.jsx" <<'JS'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicOnly from "./routes/PublicOnly";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import "./styles/theme.css";

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
JS

echo "[5/8] Login.jsx que guarda token y entra al Dashboard"
cat > "$FRONT/src/pages/Login.jsx" <<'JS'
import { useState } from "react";
import { apiFetch } from "../utils/api";

export default function Login() {
  const [email, setEmail] = useState("admin@totalrepairnow.com");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (data?.token) {
        localStorage.setItem("token", data.token);
        window.location.href = "/";
      } else {
        setErr("Credenciales inválidas");
      }
    } catch (e) {
      setErr("Error de autenticación");
      console.error(e);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{maxWidth: 480, margin: "60px auto"}}>
        <h2 className="card-title">Entrar</h2>
        <form onSubmit={onSubmit} className="form">
          <label>Correo</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required />
          <label>Contraseña</label>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required />
          {err && <div className="alert error">{err}</div>}
          <button className="btn primary" type="submit">Acceder</button>
        </form>
      </div>
    </div>
  );
}
JS

echo "[6/8] Dashboard.jsx robusto + layout estable"
cat > "$FRONT/src/pages/Dashboard.jsx" <<'JS'
import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Cargar métricas y una lista resumida de clientes
        const [m, c] = await Promise.all([
          apiFetch("/api/metrics"),
          apiFetch("/api/clients?page=1&pageSize=8")
        ]);
        if (!mounted) return;
        setMetrics(m);
        setClients(Array.isArray(c?.items) ? c.items : []);
      } catch (e) {
        if (!mounted) return;
        setErr("No se pudieron cargar datos");
        console.error("Dashboard error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; }
  }, []);

  return (
    <div className="container">
      <div className="dash-head">
        <h1 className="dash-title">Dashboard</h1>
        <div className="spacer" />
        <ApiChip />
      </div>

      <section className="metrics-grid">
        <Card title="Total de clientes" value={metrics?.total_clients ?? (loading ? "…" : 0)} />
        <Card title="Clientes activos" value={metrics?.active_clients ?? (loading ? "…" : 0)} />
        <Card title="Clientes inactivos" value={metrics?.inactive_clients ?? (loading ? "…" : 0)} />
        <Card title="Monto total servicio" value={metrics?.services_total_amount ?? (loading ? "…" : "0.00")} prefix="$" />
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Clientes recientes</h3>
        </div>
        {loading ? (
          <div className="skel" />
        ) : err ? (
          <div className="alert error">{err}</div>
        ) : (
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
            {clients.length === 0 && <div className="empty">No hay clientes</div>}
          </div>
        )}
      </section>
    </div>
  );
}

function Card({ title, value, prefix }) {
  return (
    <div className="card">
      <div className="card-head">
        <h3>{title}</h3>
      </div>
      <div className="big">{prefix}{String(value)}</div>
    </div>
  );
}

function ApiChip() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) return null;
  return <span className="api-chip">API: OK</span>;
}
JS

echo "[7/8] Header.jsx minimal con logo (ya cargado en /var/www/crm/logo.png)"
cat > "$FRONT/src/components/Header.jsx" <<'JS'
export default function Header() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const onLogout = () => { localStorage.removeItem('token'); window.location.href = '/login'; };
  return (
    <header className="header">
      <div className="brand">
        <img src="/logo.png" alt="CRM" style={{height: 28, marginRight: 10}} />
        <span>Total Repair Now — CRM</span>
      </div>
      <div className="spacer" />
      {token && <button className="btn" onClick={onLogout}>Salir</button>}
    </header>
  );
}
JS

echo "[8/8] CSS de layout estable"
cat > "$FRONT/src/styles/theme.css" <<'CSS'
* { box-sizing: border-box; }
html, body, #root { height: 100%; }
body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial; color: var(--fg); background: var(--bg); }

:root{
  --bg:#0b0f14; --card:#111827; --fg:#e5e7eb; --muted:#94a3b8; --brand:#3b82f6;
  --border:#1f2937; --radius:16px; --gap:18px; --shadow:0 8px 24px rgba(0,0,0,.35);
}

.container{ max-width:1200px; margin:24px auto; padding:0 16px 48px; }
.header{ display:flex; align-items:center; gap:12px; padding:12px 16px; background:#0d131b; border-bottom:1px solid var(--border); position:sticky; top:0; z-index:5; }
.brand{ display:flex; align-items:center; gap:10px; color:#cbd5e1; font-weight:600; }
.spacer{ flex:1; }

.dash-head{ display:flex; align-items:center; gap:10px; margin:18px 0; }
.dash-title{ margin:0; font-size:22px; letter-spacing:.3px; }
.api-chip{ font-size:12px; padding:6px 10px; border-radius:999px; background:#0a1b2e; border:1px solid #1e3a8a; color:#93c5fd; }

.metrics-grid{
  display:grid;
  grid-template-columns: repeat(4, minmax(180px,1fr));
  gap: var(--gap);
  margin-bottom: 20px;
}
@media (max-width: 1024px){ .metrics-grid{ grid-template-columns: repeat(2,1fr); } }
@media (max-width: 560px){ .metrics-grid{ grid-template-columns: 1fr; } }

.card{
  background: var(--card); border:1px solid var(--border); border-radius: var(--radius);
  box-shadow: var(--shadow); padding:16px; color:var(--fg);
}
.card-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.card-title{ margin:0; }
.big{ font-size:28px; font-weight:700; margin-top:6px; }

.form{ display:flex; flex-direction:column; gap:10px; }
.form input{ padding:10px 12px; border-radius:10px; border:1px solid var(--border); background:#0b1220; color:var(--fg); }

.btn{ padding:8px 12px; border-radius:10px; border:1px solid var(--border); background:#0b1220; color:var(--fg); cursor:pointer; }
.btn.primary{ background:#0b1a2f; border-color:#1e40af; color:#c7d2fe; }

.alert{ padding:10px 12px; border-radius:10px; }
.alert.error{ background:#2b0e12; border:1px solid #7f1d1d; color:#fecaca; }

.table{ display:grid; gap:8px; }
.tr{ display:grid; grid-template-columns: 80px 1fr 1fr 1fr 120px; gap:10px; padding:8px 10px; border:1px solid var(--border); border-radius:12px; background:#0a111e; }
.tr.th{ background:#0b162b; font-weight:600; }
.empty{ padding:12px; color:var(--muted); }

.skel{ height: 32px; border-radius:10px; background: linear-gradient(90deg, #0d1726 25%, #13213a 37%, #0d1726 63%); background-size: 400% 100%; animation: sk 1.2s ease-in-out infinite; }
@keyframes sk{ 0%{ background-position:100% 0;} 100%{ background-position: -200% 0; } }
CSS

# Asegurar import de App en index y el CSS
if ! grep -q "import './styles/theme.css'" "$FRONT/src/index.js" 2>/dev/null; then
  sed -i "1i import './styles/theme.css';" "$FRONT/src/index.js" || true
fi

echo "[BUILD] Compilando frontend…"
cd "$FRONT"
npm run build

echo "[DEPLOY] Subiendo a /var/www/crm"
sudo rsync -av --delete "$FRONT/build/" /var/www/crm/

echo "OK. Hard refresh (Ctrl+F5) en el navegador."
