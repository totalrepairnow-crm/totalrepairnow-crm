#!/usr/bin/env bash
set -euo pipefail

FRONT=~/crm_app/frontend
FILE="$FRONT/src/pages/ClientDetail.jsx"

echo "[1/3] Respaldo de ClientDetail.jsx"
mkdir -p "$FRONT/src/pages"
cp -a "$FILE" "$FILE.bak.$(date +%s)" 2>/dev/null || true

echo "[2/3] Escribiendo ClientDetail.jsx (usar client.id para servicios y fotos)"
cat > "$FILE" <<'EOF'
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

export default function ClientDetail() {
  const { id } = useParams(); // puede ser numérico o UUID de la URL
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);
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
    if (r.status === 401) {
      navigate("/login", { replace: true });
      return null;
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    setClient(data);
    return data;
  }

  async function fetchServices(cid) {
    const r = await fetch(`/api/clients/${cid}/services`, { headers: authHeaders(false) });
    if (r.status === 401) {
      navigate("/login", { replace: true });
      return [];
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    const items = Array.isArray(data.items) ? data.items : [];
    setServices(items);
    return items;
  }

  async function fetchUploads(cid) {
    const r = await fetch(`/api/clients/${cid}/uploads`, { headers: authHeaders(false) });
    if (r.status === 401) {
      navigate("/login", { replace: true });
      return [];
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    const items = Array.isArray(data.items) ? data.items : [];
    setUploads(items);
    return items;
  }

  async function handleUpload(e) {
    e.preventDefault();
    setMsg("");
    const files = fileInputRef.current?.files;
    if (!files || !files.length) return setMsg("Selecciona uno o más archivos");
    try {
      setUploading(true);
      const cid = client?.id ?? id; // preferir ID numérico si ya lo tenemos
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      const r = await fetch(`/api/clients/${cid}/uploads`, {
        method: "POST",
        headers: { Authorization: token ? `Bearer ${token}` : "" }, // NO fijes Content-Type
        body: fd,
      });
      if (r.status === 401) return navigate("/login", { replace: true });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await fetchUploads(cid);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMsg("Archivos subidos correctamente.");
    } catch (err) {
      console.error("upload error:", err);
      setMsg("No se pudieron subir los archivos.");
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        // 1) Primero traemos el cliente para conocer su ID numérico
        const c = await fetchClient();
        if (!c) return;
        const cid = c.id ?? id; // si no tiene id (raro), usa param de ruta
        // 2) Luego, con ese cid pedimos servicios y fotos
        await Promise.all([fetchServices(cid), fetchUploads(cid)]);
      } catch (e) {
        if (alive) {
          console.error("detail load error:", e);
          setMsg("No se pudo cargar el detalle del cliente");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]); // se vuelve a cargar si cambia el /clients/:id

  if (loading) return <div className="container"><div className="skel" /></div>;
  if (!client) return <div className="container"><div className="alert error">{msg || "Cliente no encontrado"}</div></div>;

  const cidForLinks = client.id ?? id;

  return (
    <div className="container client-detail">
      {/* ===== 1) DATOS DEL CLIENTE ===== */}
      <section className="card client-card">
        <div className="client-title" style={{fontSize:'1.6rem',fontWeight:700,margin:'4px 0 12px'}}>
          {client.empresa || `Cliente #${id}`}
        </div>
        <div className="table">
          <div className="tr">
            <div>Empresa</div><div>{client.empresa || "—"}</div>
          </div>
          <div className="tr">
            <div>Email</div><div>{client.email || "—"}</div>
          </div>
          <div className="tr">
            <div>Teléfono</div><div>{client.telefono || "—"}</div>
          </div>
          <div className="tr">
            <div>Estado</div><div>{client.estado || "—"}</div>
          </div>
        </div>
        <div style={{marginTop:10, display:'flex', gap:8}}>
          <Link className="btn" to={`/clients/${cidForLinks}/edit`}>Editar</Link>
          <Link className="btn secondary" to="/clients">Volver a Clientes</Link>
        </div>
      </section>

      {/* ===== 2) SERVICIOS ===== */}
      <section className="card services-card">
        <div className="card-head"><h3>Servicios</h3></div>
        {services.length === 0 ? (
          <div className="empty">No hay servicios registrados.</div>
        ) : (
          <div className="table services-table">
            <div className="tr th">
              <div>ID</div><div>Título</div><div>Monto</div><div>Estado</div><div>Creado</div>
            </div>
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
        <div className="card-head"><h3>Fotos</h3></div>

        <form onSubmit={handleUpload} style={{display:'flex', alignItems:'center', gap:8, marginBottom:12}}>
          <input type="file" ref={fileInputRef} multiple />
          <button className="btn" type="submit" disabled={uploading}>{uploading ? "Subiendo..." : "Subir"}</button>
          {msg && <span style={{marginLeft:8}}>{msg}</span>}
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
EOF

echo "[3/3] Build y publicación"
cd "$FRONT"
npm run build
sudo rsync -av --delete build/ /var/www/crm/
sudo systemctl reload nginx
echo "OK. ClientDetail usa client.id para servicios/fotos. Hard refresh (Ctrl+F5/Cmd+Shift+R)."
