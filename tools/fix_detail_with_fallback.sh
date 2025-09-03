#!/usr/bin/env bash
set -euo pipefail

FRONT=~/crm_app/frontend
FILE="$FRONT/src/pages/ClientDetail.jsx"

echo "[1/3] Backup de ClientDetail.jsx"
mkdir -p "$FRONT/src/pages"
cp -a "$FILE" "$FILE.bak.$(date +%s)" 2>/dev/null || true

echo "[2/3] Escribiendo ClientDetail.jsx (fallback id/uuid + debug)"
cat > "$FILE" <<'EOF'
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

export default function ClientDetail() {
  const { id } = useParams(); // puede venir como número (texto) o UUID desde la URL
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

  // Intenta con numID; si falla o vacía, intenta con uuidID (cliente_id)
  async function fetchServicesWithFallback(numID, uuidID) {
    setSvcMsg("");
    try {
      // 1) numérico
      let r = await fetch(`/api/clients/${numID}/services`, { headers: authHeaders(false) });
      if (r.status === 401) { navigate("/login", { replace: true }); return; }
      if (!r.ok) throw new Error(`HTTP ${r.status} (num)`);
      let data = await r.json();
      let items = Array.isArray(data.items) ? data.items : [];
      if (items.length > 0) { setServices(items); return; }
      // 2) uuid
      if (uuidID) {
        r = await fetch(`/api/clients/${uuidID}/services`, { headers: authHeaders(false) });
        if (r.ok) {
          data = await r.json();
          items = Array.isArray(data.items) ? data.items : [];
          setServices(items);
          if (items.length === 0) setSvcMsg("Sin servicios (uuid).");
        } else {
          setSvcMsg(`Error servicios (uuid): HTTP ${r.status}`);
        }
      } else {
        setSvcMsg("Sin servicios (num).");
      }
    } catch (e) {
      console.error("services error:", e);
      setSvcMsg(String(e.message || e));
    }
  }

  async function fetchUploadsWithFallback(numID, uuidID) {
    setUpMsg("");
    try {
      // 1) numérico
      let r = await fetch(`/api/clients/${numID}/uploads`, { headers: authHeaders(false) });
      if (r.status === 401) { navigate("/login", { replace: true }); return; }
      if (!r.ok) throw new Error(`HTTP ${r.status} (num)`);
      let data = await r.json();
      let items = Array.isArray(data.items) ? data.items : [];
      if (items.length > 0) { setUploads(items); return; }
      // 2) uuid
      if (uuidID) {
        r = await fetch(`/api/clients/${uuidID}/uploads`, { headers: authHeaders(false) });
        if (r.ok) {
          data = await r.json();
          items = Array.isArray(data.items) ? data.items : [];
          setUploads(items);
          if (items.length === 0) setUpMsg("Sin fotos (uuid).");
        } else {
          setUpMsg(`Error fotos (uuid): HTTP ${r.status}`);
        }
      } else {
        setUpMsg("Sin fotos (num).");
      }
    } catch (e) {
      console.error("uploads error:", e);
      setUpMsg(String(e.message || e));
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
      const preferID = numID || uuidID; // priorizamos numérico si existe
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      const r = await fetch(`/api/clients/${preferID}/uploads`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (r.status === 401) return navigate("/login", { replace: true });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      // Refrescar con fallback
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
      {/* Toggle debug */}
      <div style={{display:'flex',justifyContent:'flex-end'}}>
        <button className="btn secondary" onClick={()=>setShowDebug(v=>!v)}>{showDebug ? "Ocultar" : "Ver"} debug</button>
      </div>

      {/* ===== 1) DATOS ===== */}
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

      {/* ===== 2) SERVICIOS ===== */}
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

      {/* ===== 3) FOTOS ===== */}
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

      {/* ===== Debug ===== */}
      {showDebug && (
        <section className="card" style={{marginTop:12}}>
          <div className="card-head"><h3>Debug</h3></div>
          <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify({ client, servicesLen: services.length, uploadsLen: uploads.length }, null, 2)}</pre>
        </section>
      )}
    </div>
  );
}
EOF

echo "[3/3] Build y publicar"
cd "$FRONT"
npm run build
sudo rsync -av --delete build/ /var/www/crm/
sudo systemctl reload nginx
echo "OK. Detalle con fallback y debug publicado. Haz hard-refresh (Ctrl+F5 / Cmd+Shift+R)."
