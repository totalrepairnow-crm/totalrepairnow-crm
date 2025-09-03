#!/usr/bin/env bash
set -euo pipefail

FRONT=~/crm_app/frontend
PAGES="$FRONT/src/pages"
COMP="$FRONT/src/components"
ROUTES="$FRONT/src/routes"

echo "[1/8] Backup rápido del front"
mkdir -p ~/backups
tar -C "$FRONT" -czf ~/backups/front_$(date +%F_%H%M%S).tgz src || true

mkdir -p "$PAGES" "$COMP" "$ROUTES" "$FRONT/src/utils" "$FRONT/src/styles"

echo "[2/8] ClientDetail.jsx con subida de fotos y galería"
cat > "$PAGES/ClientDetail.jsx" <<'JS'
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

function authHeaders() {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upLoading, setUpLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef(null);

  async function loadClient() {
    setLoading(true);
    try {
      const r = await fetch(`/api/clients/${id}`, { headers: { ...authHeaders() } });
      if (r.status === 401) return navigate("/login", { replace: true });
      if (!r.ok) throw new Error();
      setClient(await r.json());
    } catch {
      setMsg("No se pudo cargar el cliente");
    } finally {
      setLoading(false);
    }
  }

  async function loadUploads() {
    try {
      const r = await fetch(`/api/clients/${id}/uploads`, { headers: { ...authHeaders() } });
      if (r.ok) {
        const j = await r.json();
        // Soportar {items:["/uploads/.."]} o {items:[{url,name}]}
        const items = (j.items || []).map(it => (typeof it === "string" ? { url: it, name: it.split('/').pop() } : it));
        setUploads(items);
      }
    } catch {}
  }

  async function handleUpload(e) {
    e.preventDefault();
    const files = fileRef.current?.files;
    if (!files || !files.length) return setMsg("Selecciona al menos un archivo");
    setUpLoading(true); setMsg("");
    try {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      const r = await fetch(`/api/clients/${id}/uploads`, {
        method: "POST",
        headers: { ...authHeaders() }, // NO pongas Content-Type manual
        body: fd
      });
      if (r.status === 401) return navigate("/login", { replace: true });
      if (!r.ok) throw new Error();
      await loadUploads();
      if (fileRef.current) fileRef.current.value = "";
      setMsg("Subida completada");
    } catch {
      setMsg("Error al subir");
    } finally {
      setUpLoading(false);
    }
  }

  useEffect(() => {
    loadClient();
    loadUploads();
    // eslint-disable-next-line
  }, [id]);

  if (loading) return <div className="container"><div className="skel">Cargando…</div></div>;
  if (!client) return <div className="container"><div className="alert error">{msg || "Cliente no encontrado"}</div></div>;

  return (
    <div className="container">
      <div className="card">
        <div className="card-head">
          <h2>Cliente #{client.id} — {client.empresa}</h2>
          <div className="spacer" />
          <Link to={`/clients/${client.id}/edit`} className="btn ghost">Editar</Link>
          <Link to="/clients" className="btn">Volver</Link>
        </div>
        <div className="grid-two">
          <div>
            <p><strong>Email:</strong> {client.email || "—"}</p>
            <p><strong>Teléfono:</strong> {client.telefono || "—"}</p>
            <p><strong>Estado:</strong> {client.estado}</p>
          </div>
          <div>
            <form onSubmit={handleUpload} className="uploader">
              <label><strong>Subir fotos del servicio</strong></label>
              <input ref={fileRef} type="file" multiple accept="image/*" />
              <button type="submit" className="btn" disabled={upLoading}>{upLoading ? "Subiendo…" : "Subir"}</button>
              {msg && <div className="hint">{msg}</div>}
            </form>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Galería</h3></div>
        {uploads.length === 0 ? (
          <div className="empty">Sin archivos</div>
        ) : (
          <div className="gallery">
            {uploads.map((u, i) => (
              <a key={i} href={u.url} target="_blank" rel="noreferrer" className="thumb">
                <img src={u.url} alt={u.name || `img-${i}`} loading="lazy" />
                <span className="name">{u.name}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
JS

echo "[3/8] Users.jsx (listado) + UserNew.jsx (alta)"
cat > "$PAGES/Users.jsx" <<'JS'
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function authHeaders() {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function Users() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/users", { headers: { ...authHeaders() } });
      if (!r.ok) throw new Error();
      const j = await r.json();
      setItems(j.items || j || []); // soportar ambos formatos
    } catch {
      setMsg("No se pudieron cargar usuarios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="container">
      <div className="card">
        <div className="card-head">
          <h2>Usuarios</h2>
          <div className="spacer" />
          <Link to="/users/new" className="btn">Nuevo usuario</Link>
        </div>
        {msg && <div className="alert error">{msg}</div>}
        <div className="table">
          <div className="tr th">
            <div>ID</div><div>Nombre</div><div>Email</div><div>Rol</div><div>Estado</div>
          </div>
          {loading ? <div className="skel">Cargando…</div> : items.map(u => (
            <div key={u.id} className="tr">
              <div>{u.id}</div>
              <div>{u.name || u.nombre || "—"}</div>
              <div>{u.email}</div>
              <div>{u.role || "—"}</div>
              <div>{u.status || u.estado || "activo"}</div>
            </div>
          ))}
          {!loading && items.length === 0 && <div className="empty">Sin usuarios</div>}
        </div>
      </div>
    </div>
  );
}
JS

cat > "$PAGES/UserNew.jsx" <<'JS'
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function authHeaders() {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}`, "Content-Type":"application/json" } : {"Content-Type":"application/json"};
}

export default function UserNew() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", password:"", role:"tech", status:"active" });
  const [msg, setMsg] = useState("");

  function onChange(e){
    const {name, value} = e.target;
    setForm(s => ({...s, [name]: value}));
  }

  async function onSubmit(e){
    e.preventDefault();
    setMsg("");
    try{
      const r = await fetch("/api/users", {
        method:"POST",
        headers: { ...authHeaders() },
        body: JSON.stringify(form)
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || "HTTP "+r.status);
      }
      navigate("/users", { replace: true });
    }catch(err){
      setMsg("No se pudo crear el usuario");
    }
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-head"><h2>Nuevo usuario</h2></div>
        {msg && <div className="alert error">{msg}</div>}
        <form onSubmit={onSubmit} className="form-grid">
          <label>Nombre
            <input name="name" value={form.name} onChange={onChange} required />
          </label>
          <label>Email
            <input type="email" name="email" value={form.email} onChange={onChange} required />
          </label>
          <label>Password
            <input type="password" name="password" value={form.password} onChange={onChange} required />
          </label>
          <label>Rol
            <select name="role" value={form.role} onChange={onChange}>
              <option value="admin">admin</option>
              <option value="tech">tech</option>
            </select>
          </label>
          <label>Estado
            <select name="status" value={form.status} onChange={onChange}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>
          <div className="form-actions">
            <button type="submit" className="btn">Crear</button>
          </div>
        </form>
      </div>
    </div>
  );
}
JS

echo "[4/8] Header.jsx: activar enlaces (Dashboard / Clientes / Usuarios / Salir)"
cat > "$COMP/Header.jsx" <<'JS'
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";

export default function Header(){
  const navigate = useNavigate();
  function logout(){
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  }
  return (
    <header className="header">
      <div className="brand">
        <img src="/logo.png" alt="CRM" style={{height:28, marginRight:10}} />
        <span>Total Repair Now — CRM</span>
      </div>
      <nav className="nav">
        <Link to="/">Dashboard</Link>
        <Link to="/clients">Clientes</Link>
        <Link to="/users">Usuarios</Link>
        <button className="btn small ghost" onClick={logout}>Salir</button>
      </nav>
    </header>
  );
}
JS

# CSS mínimo para la galería y formularios
echo "[5/8] CSS de apoyo (no rompe estilos existentes)"
grep -q ".gallery" "$FRONT/src/styles/app.css" 2>/dev/null || cat >> "$FRONT/src/styles/app.css" <<'CSS'

/* --- soporte galería y grids --- */
.grid-two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media (max-width: 900px){.grid-two{grid-template-columns:1fr}}
.uploader{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.uploader .hint{font-size:12px;opacity:.8}
.gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
.gallery .thumb{display:block;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;text-decoration:none}
.gallery .thumb img{display:block;width:100%;height:120px;object-fit:cover}
.gallery .thumb .name{display:block;padding:6px 8px;font-size:12px;color:#111}
.form-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
.form-actions{margin-top:10px}
CSS

echo "[6/8] Asegurar rutas a Usuarios en App.jsx"
# Solo añade rutas si faltan (no duplica)
APP="$FRONT/src/App.jsx"
if ! grep -q "path=\"/users\"" "$APP"; then
  # Inserta justo antes de la ruta wildcard
  sed -i 's#<Route path="\\\*" element={<Navigate to="/" replace />} />#<Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />\
        <Route path="/users/new" element={<ProtectedRoute><UserNew /></ProtectedRoute>} />\
        <Route path="*" element={<Navigate to="/" replace />} />#' "$APP"
fi
# Imports (si faltan)
grep -q 'from "./pages/Users"' "$APP" || sed -i '1,40 s#import Header .*#&\
import Users from "./pages/Users";\
import UserNew from "./pages/UserNew";#' "$APP"

echo "[7/8] Build"
cd "$FRONT"
npm run build

echo "[8/8] Deploy"
sudo rsync -av --delete "$FRONT/build/" /var/www/crm/
sudo find /var/www/crm -type f -exec chmod 644 {} \;
sudo find /var/www/crm -type d -exec chmod 755 {} \;
sudo systemctl reload nginx

echo "[OK] Listo. Ve a /clients/:id para subir fotos, /users para usuarios."
