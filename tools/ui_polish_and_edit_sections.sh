#!/usr/bin/env bash
set -euo pipefail

FRONT=~/crm_app/frontend

echo "[1/7] Backup rápido del front"
mkdir -p ~/backups
tar -C "$FRONT" -czf ~/backups/front_$(date +%F_%H%M%S).tgz src public package.json || true

echo "[2/7] CSS: métricas iguales + sin hover en filas"
mkdir -p "$FRONT/src/styles"
# añadimos (no sustituimos) reglas con más especificidad para no romper nada existente
cat >> "$FRONT/src/styles/app.css" <<'CSS'

/* === Ajuste tarjetas métricas iguales (Dashboard) === */
.container .metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.container .metrics-grid .card { width: 100%; }

/* Tamaño consistente del valor grande en tarjetas */
.container .metrics-grid .card .big {
  font-size: 28px;
  font-weight: 700;
}

/* === Desactivar hover en filas de tablas (Dashboard y Clientes) === */
.table .tr:hover { background: inherit !important; }
.table .tr.th:hover { background: inherit !important; }

/* Separaciones suaves en páginas de detalle/edición */
.card + .card { margin-top: 16px; }

/* Galería de fotos */
.uploads-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}
.uploads-grid img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
}
CSS

echo "[3/7] ClientDetail.jsx: datos → servicios → fotos (sin textos '(uuid)')"
cat > "$FRONT/src/pages/ClientDetail.jsx" <<'JSX'
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [svcMsg, setSvcMsg] = useState("");
  const [upMsg, setUpMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const fileInputRef = useRef(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  function authHeaders(json = true) {
    const h = {};
    if (token) h["Authorization"] = `Bearer ${token}`;
    if (json) h["Content-Type"] = "application/json";
    return h;
  }

  async function fetchClient() {
    const r = await fetch(`/api/clients/${id}`, { headers: authHeaders(false) });
    if (r.status === 401) { navigate("/login", { replace: true }); return null; }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    setClient(data);
    return data;
  }

  async function fetchServicesWithFallback(numID, uuidID) {
    setSvcMsg("");
    try {
      let r = await fetch(`/api/clients/${numID}/services`, { headers: authHeaders(false) });
      if (r.status === 401) { navigate("/login", { replace: true }); return; }
      if (!r.ok) throw new Error(`HTTP ${r.status} (num)`);
      let data = await r.json();
      let items = Array.isArray(data.items) ? data.items : [];
      if (items.length > 0) { setServices(items); return; }
      if (uuidID) {
        r = await fetch(`/api/clients/${uuidID}/services`, { headers: authHeaders(false) });
        if (r.ok) {
          data = await r.json();
          items = Array.isArray(data.items) ? data.items : [];
          setServices(items);
        }
      }
    } catch (e) {
      console.error("services error:", e);
      setSvcMsg("No fue posible cargar los servicios.");
    }
  }

  async function fetchUploadsWithFallback(numID, uuidID) {
    setUpMsg("");
    try {
      let r = await fetch(`/api/clients/${numID}/uploads`, { headers: authHeaders(false) });
      if (r.status === 401) { navigate("/login", { replace: true }); return; }
      if (!r.ok) throw new Error(`HTTP ${r.status} (num)`);
      let data = await r.json();
      let items = Array.isArray(data.items) ? data.items : [];
      if (items.length > 0) { setUploads(items); return; }
      if (uuidID) {
        r = await fetch(`/api/clients/${uuidID}/uploads`, { headers: authHeaders(false) });
        if (r.ok) {
          data = await r.json();
          items = Array.isArray(data.items) ? data.items : [];
          setUploads(items);
        }
      }
    } catch (e) {
      console.error("uploads error:", e);
      setUpMsg("No fue posible cargar las fotos.");
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    const files = fileInputRef.current?.files;
    if (!files || !files.length) return setMsg("Selecciona uno o más archivos");
    try {
      setUploading(true);
      setMsg("");
      const numID = client?.id ?? id;
      const uuidID = client?.cliente_id ?? null;
      const preferID = numID || uuidID;
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      const r = await fetch(`/api/clients/${preferID}/uploads`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (r.status === 401) return navigate("/login", { replace: true });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await fetchUploadsWithFallback(numID, uuidID);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMsg("Archivos subidos correctamente.");
    } catch (e) {
      console.error("upload error:", e);
      setMsg("Error al subir archivos.");
    } finally {
      setUploading(false);
    }
  }

  async function loadAll() {
    try {
      setLoading(true);
      const c = await fetchClient();
      if (!c) return;
      const numID = c.id ?? id;
      const uuidID = c.cliente_id ?? null;
      await Promise.all([
        fetchServicesWithFallback(numID, uuidID),
        fetchUploadsWithFallback(numID, uuidID),
      ]);
    } catch (e) {
      console.error("detail load error:", e);
      setMsg("No se pudo cargar el detalle del cliente");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [id]);

  if (loading) return <div className="container"><div className="skel" /></div>;
  if (!client) return <div className="container"><div className="alert error">{msg || "Cliente no encontrado"}</div></div>;

  const numID = client.id ?? id;
  const uuidID = client.cliente_id ?? null;

  return (
    <div className="container client-detail">

      <section className="card client-card">
        <div className="client-title" style={{fontSize:'1.6rem',fontWeight:700,margin:'4px 0 12px'}}>
          {client.empresa || "Cliente"}
        </div>
        <div className="table">
          <div className="tr"><div>Empresa</div><div>{client.empresa || "—"}</div></div>
          <div className="tr"><div>Email</div><div>{client.email || "—"}</div></div>
          <div className="tr"><div>Teléfono</div><div>{client.telefono || "—"}</div></div>
          <div className="tr"><div>Estado</div><div>{client.estado || "—"}</div></div>
        </div>
        <div style={{marginTop:10, display:'flex', gap:8}}>
          <Link className="btn" to={`/clients/${numID}/edit`}>Editar</Link>
          <Link className="btn secondary" to="/clients">Volver</Link>
        </div>
      </section>

      <section className="card services-card">
        <div className="card-head" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h3>Servicios</h3>
          <button className="btn secondary" onClick={()=>fetchServicesWithFallback(numID, uuidID)}>Recargar</button>
        </div>
        {svcMsg && <div className="alert">{svcMsg}</div>}
        {services.length === 0 ? (
          <div className="empty">No hay servicios.</div>
        ) : (
          <div className="table services-table">
            <div className="tr th"><div>ID</div><div>Título</div><div>Monto</div><div>Estado</div><div>Creado</div></div>
            {services.map(s => (
              <div className="tr" key={s.id}>
                <div>{s.id}</div>
                <div>{s.titulo || s.service_name || "—"}</div>
                <div>{s.monto_total != null ? `$${Number(s.monto_total).toFixed(2)}` : "—"}</div>
                <div>{s.estado || "—"}</div>
                <div>{s.created_at ? new Date(s.created_at).toLocaleString() : "—"}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card uploads-card">
        <div className="card-head" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h3>Fotos</h3>
          <button className="btn secondary" onClick={()=>fetchUploadsWithFallback(numID, uuidID)}>Recargar</button>
        </div>

        <form onSubmit={handleUpload} style={{display:'flex', alignItems:'center', gap:8, marginBottom:12}}>
          <input type="file" ref={fileInputRef} multiple />
          <button className="btn" type="submit" disabled={uploading}>{uploading ? "Subiendo..." : "Subir"}</button>
          {msg && <span style={{marginLeft:8}}>{msg}</span>}
        </form>

        {upMsg && <div className="alert">{upMsg}</div>}

        {uploads.length === 0 ? (
          <div className="empty">No hay fotos.</div>
        ) : (
          <div className="uploads-grid">
            {uploads.map((u, idx) => (
              <a key={idx} href={u} target="_blank" rel="noreferrer" className="thumb">
                <img src={u} alt={`foto_${idx}`} loading="lazy" />
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
JSX

echo "[4/7] ClientEdit.jsx: pintar Servicios + Fotos con separaciones"
cat > "$FRONT/src/pages/ClientEdit.jsx" <<'JSX'
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

export default function ClientEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  // datos cliente
  const [client, setClient] = useState(null);
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [estado, setEstado] = useState("activo");

  // servicios
  const [services, setServices] = useState([]);
  const [svcTitle, setSvcTitle] = useState("");
  const [svcAmount, setSvcAmount] = useState("");
  const [svcStatus, setSvcStatus] = useState("pendiente");

  // fotos
  const [uploads, setUploads] = useState([]);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  function authHeaders(json = true) {
    const h = {};
    if (token) h["Authorization"] = `Bearer ${token}`;
    if (json) h["Content-Type"] = "application/json";
    return h;
  }

  async function fetchClient() {
    const r = await fetch(`/api/clients/${id}`, { headers: authHeaders(false) });
    if (r.status === 401) { navigate("/login", { replace: true }); return null; }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    setClient(data);
    setEmpresa(data.empresa || "");
    setEmail(data.email || "");
    setTelefono(data.telefono || "");
    setEstado(data.estado || "activo");
    return data;
  }

  async function fetchServicesWithFallback(numID, uuidID) {
    try {
      let r = await fetch(`/api/clients/${numID}/services`, { headers: authHeaders(false) });
      if (!r.ok) throw new Error(`HTTP ${r.status} (num)`);
      let d = await r.json();
      let items = Array.isArray(d.items) ? d.items : [];
      if (items.length > 0) { setServices(items); return; }
      if (uuidID) {
        r = await fetch(`/api/clients/${uuidID}/services`, { headers: authHeaders(false) });
        if (r.ok) {
          d = await r.json();
          items = Array.isArray(d.items) ? d.items : [];
          setServices(items);
        }
      }
    } catch (e) {
      console.error("services error:", e);
    }
  }

  async function fetchUploadsWithFallback(numID, uuidID) {
    try {
      let r = await fetch(`/api/clients/${numID}/uploads`, { headers: authHeaders(false) });
      if (!r.ok) throw new Error(`HTTP ${r.status} (num)`);
      let d = await r.json();
      let items = Array.isArray(d.items) ? d.items : [];
      if (items.length > 0) { setUploads(items); return; }
      if (uuidID) {
        r = await fetch(`/api/clients/${uuidID}/uploads`, { headers: authHeaders(false) });
        if (r.ok) {
          d = await r.json();
          items = Array.isArray(d.items) ? d.items : [];
          setUploads(items);
        }
      }
    } catch (e) {
      console.error("uploads error:", e);
    }
  }

  async function loadAll() {
    try {
      setLoading(true);
      const c = await fetchClient();
      if (!c) return;
      const numID = c.id ?? id;
      const uuidID = c.cliente_id ?? null;
      await Promise.all([
        fetchServicesWithFallback(numID, uuidID),
        fetchUploadsWithFallback(numID, uuidID),
      ]);
    } catch (e) {
      setErr("No se pudo cargar el cliente");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    try {
      const r = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify({ empresa, email, telefono, estado })
      });
      if (r.status === 401) return navigate("/login", { replace: true });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      navigate(`/clients/${id}`);
    } catch (e) {
      console.error("save error:", e);
      setErr("No se pudo guardar.");
    }
  }

  async function addService(e) {
    e.preventDefault();
    if (!svcTitle.trim()) return;
    const payload = { titulo: svcTitle.trim() };
    if (svcAmount) payload.monto_total = Number(svcAmount);
    if (svcStatus) payload.estado = svcStatus;

    try {
      const r = await fetch(`/api/clients/${id}/services`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(payload)
      });
      if (r.status === 401) return navigate("/login", { replace: true });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setSvcTitle(""); setSvcAmount(""); setSvcStatus("pendiente");
      // recarga
      const numID = client?.id ?? id, uuidID = client?.cliente_id ?? null;
      await fetchServicesWithFallback(numID, uuidID);
    } catch (e) {
      console.error("add service error:", e);
      alert("No se pudo crear el servicio.");
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    const files = fileInputRef.current?.files;
    if (!files || !files.length) return setUploadMsg("Selecciona uno o más archivos");
    try {
      setUploading(true); setUploadMsg("");
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      const r = await fetch(`/api/clients/${id}/uploads`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd
      });
      if (r.status === 401) return navigate("/login", { replace: true });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      // recarga
      const numID = client?.id ?? id, uuidID = client?.cliente_id ?? null;
      await fetchUploadsWithFallback(numID, uuidID);
      setUploadMsg("Archivos subidos.");
    } catch (e) {
      console.error("upload error:", e);
      setUploadMsg("Error al subir archivos.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <div className="container"><div className="skel" /></div>;
  if (!client) return <div className="container"><div className="alert error">{err || "Cliente no encontrado"}</div></div>;

  return (
    <div className="container">
      <section className="card">
        <div className="card-head"><h3>Editar cliente</h3></div>
        <form onSubmit={handleSave} className="form" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <label>Empresa
            <input value={empresa} onChange={e=>setEmpresa(e.target.value)} />
          </label>
          <label>Email
            <input value={email} onChange={e=>setEmail(e.target.value)} />
          </label>
          <label>Teléfono
            <input value={telefono} onChange={e=>setTelefono(e.target.value)} />
          </label>
          <label>Estado
            <select value={estado} onChange={e=>setEstado(e.target.value)}>
              <option value="activo">activo</option>
              <option value="inactivo">inactivo</option>
            </select>
          </label>
          <div style={{gridColumn:'1 / -1', display:'flex', gap:8, marginTop:8}}>
            <button className="btn" type="submit">Guardar</button>
            <Link className="btn secondary" to={`/clients/${id}`}>Cancelar</Link>
          </div>
        </form>
      </section>

      <section className="card services-card">
        <div className="card-head"><h3>Servicios</h3></div>
        <form onSubmit={addService} style={{display:'grid',gridTemplateColumns:'1fr 160px 160px',gap:8,marginBottom:12}}>
          <input placeholder="Título del servicio" value={svcTitle} onChange={e=>setSvcTitle(e.target.value)} />
          <input placeholder="Monto total" type="number" step="0.01" value={svcAmount} onChange={e=>setSvcAmount(e.target.value)} />
          <select value={svcStatus} onChange={e=>setSvcStatus(e.target.value)}>
            <option value="pendiente">pendiente</option>
            <option value="completado">completado</option>
            <option value="cancelado">cancelado</option>
          </select>
          <div style={{gridColumn:'1 / -1'}}>
            <button className="btn" type="submit">Agregar servicio</button>
          </div>
        </form>

        {services.length === 0 ? (
          <div className="empty">No hay servicios.</div>
        ) : (
          <div className="table services-table">
            <div className="tr th"><div>ID</div><div>Título</div><div>Monto</div><div>Estado</div><div>Creado</div></div>
            {services.map(s => (
              <div className="tr" key={s.id}>
                <div>{s.id}</div>
                <div>{s.titulo || s.service_name || "—"}</div>
                <div>{s.monto_total != null ? `$${Number(s.monto_total).toFixed(2)}` : "—"}</div>
                <div>{s.estado || "—"}</div>
                <div>{s.created_at ? new Date(s.created_at).toLocaleString() : "—"}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card uploads-card">
        <div className="card-head"><h3>Fotos</h3></div>
        <form onSubmit={handleUpload} style={{display:'flex', alignItems:'center', gap:8, marginBottom:12}}>
          <input type="file" ref={fileInputRef} multiple />
          <button className="btn" type="submit" disabled={uploading}>{uploading ? "Subiendo..." : "Subir"}</button>
          {uploadMsg && <span>{uploadMsg}</span>}
        </form>
        {uploads.length === 0 ? (
          <div className="empty">No hay fotos.</div>
        ) : (
          <div className="uploads-grid">
            {uploads.map((u, idx) => (
              <a key={idx} href={u} target="_blank" rel="noreferrer" className="thumb">
                <img src={u} alt={`foto_${idx}`} loading="lazy" />
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
JSX

echo "[5/7] ESLint: desactivar regla conflictiva si no existe archivo"
if [ ! -f "$FRONT/.eslintrc.json" ]; then
  cat > "$FRONT/.eslintrc.json" <<'JSON'
{
  "root": true,
  "extends": ["react-app", "react-app/jest"],
  "rules": {
    "react-hooks/exhaustive-deps": "off"
  }
}
JSON
fi

echo "[6/7] Build"
cd "$FRONT"
npm run build

echo "[7/7] Publicar"
sudo rsync -av --delete build/ /var/www/crm/
sudo systemctl reload nginx
echo "[OK] UI ajustada y secciones pintadas. Haz hard refresh (Ctrl+F5 / Cmd+Shift+R)."
