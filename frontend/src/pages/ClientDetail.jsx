import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

function urlFrom(any) {
  if (!any) return null;
  if (typeof any === "string") return any;
  if (typeof any === "object") {
    return any.url || any.href || any.path || any.location || any.link || null;
  }
  return null;
}
function normalizeUploads(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (const it of arr) {
    const u = urlFrom(it);
    if (u) out.push(u);
  }
  return out;
}

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [uploads, setUploads] = useState([]);

  // mensajes/estado
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [svcMsg, setSvcMsg] = useState("");
  const [upMsg, setUpMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  // form: nuevo servicio
  const [svcName, setSvcName] = useState("");
  const [svcQty, setSvcQty] = useState("1");
  const [svcUnit, setSvcUnit] = useState("0");
  const [svcDesc, setSvcDesc] = useState("");
  const [svcStatus, setSvcStatus] = useState("pendiente");

  const fileInputRef = useRef(null);

  const token = (typeof window !== "undefined") ? localStorage.getItem("token") : null;
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

  function serviceTotal(s) {
    // calcular total confiable
    const qty = Number(s.qty ?? s.cantidad ?? 0);
    const unit = Number(s.unit_price ?? s.precio_unitario ?? 0);
    if (Number.isFinite(qty) && Number.isFinite(unit) && qty > 0 && unit >= 0) {
      return qty * unit;
    }
    // si no vienen qty/unit, usa monto_total si existe
    if (s.monto_total != null) return Number(s.monto_total);
    return 0;
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
      let items = normalizeUploads(data.items);
      if (items.length > 0) { setUploads(items); return; }
      if (uuidID) {
        r = await fetch(`/api/clients/${uuidID}/uploads`, { headers: authHeaders(false) });
        if (r.ok) {
          data = await r.json();
          items = normalizeUploads(data.items);
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

  async function addService(e) {
    e.preventDefault();
    const name = (svcName || "").trim();
    const qty = Number(svcQty);
    const unit = Number(svcUnit);
    if (!name) return setSvcMsg("El nombre del servicio es obligatorio.");
    if (!Number.isFinite(qty) || qty <= 0) return setSvcMsg("Cantidad inválida.");
    if (!Number.isFinite(unit) || unit < 0) return setSvcMsg("Precio unitario inválido.");

    const total = qty * unit;

    const payload = {
      // compatibilidad hacia atrás con tu API:
      titulo: name,
      descripcion: svcDesc || undefined,
      monto_total: total,
      estado: svcStatus,
      // campos “extra” por si el backend ya los soporta (si no, se ignoran):
      qty, unit_price: unit,
      cantidad: qty, precio_unitario: unit,
    };

    try {
      const r = await fetch(`/api/clients/${id}/services`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(payload),
      });
      if (r.status === 401) return navigate("/login", { replace: true });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setSvcName(""); setSvcQty("1"); setSvcUnit("0"); setSvcDesc(""); setSvcStatus("pendiente");
      const numID = client?.id ?? id, uuidID = client?.cliente_id ?? null;
      await fetchServicesWithFallback(numID, uuidID);
      setSvcMsg("Servicio agregado.");
      setTimeout(()=>setSvcMsg(""), 1500);
    } catch (e) {
      console.error("add service error:", e);
      setSvcMsg("No se pudo crear el servicio.");
    }
  }

  async function deleteService(sid) {
    if (!window.confirm("¿Eliminar este servicio?")) return;
    try {
      const r = await fetch(`/api/clients/${id}/services/${sid}`, {
        method: "DELETE",
        headers: authHeaders(false),
      });
      if (r.status === 401) return navigate("/login", { replace: true });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setServices(prev => prev.filter(s => String(s.id) !== String(sid)));
    } catch (e) {
      console.error("delete service error:", e);
      alert("No se pudo eliminar el servicio.");
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

  useEffect(() => { loadAll(); }, [id]);

  if (loading) return <div className="container"><div className="skel" /></div>;
  if (!client) return <div className="container"><div className="alert error">{msg || "Cliente no encontrado"}</div></div>;

  const numID = client.id ?? id;
  const uuidID = client.cliente_id ?? null;

  return (
    <div className="container client-detail">

      {/* Datos del cliente */}
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

      {/* Servicios */}
      <section className="card services-card">
        <div className="card-head" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h3>Servicios</h3>
          <button className="btn secondary" onClick={()=>fetchServicesWithFallback(numID, uuidID)}>Recargar</button>
        </div>

        {/* Formulario nuevo servicio */}
        <form onSubmit={addService} style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:8, marginBottom:12}}>
          <input placeholder="Nombre del servicio" value={svcName} onChange={e=>setSvcName(e.target.value)} />
          <input placeholder="Cantidad" type="number" min="1" step="1" value={svcQty} onChange={e=>setSvcQty(e.target.value)} />
          <input placeholder="Precio unitario" type="number" min="0" step="0.01" value={svcUnit} onChange={e=>setSvcUnit(e.target.value)} />
          <textarea placeholder="Descripción (opcional)" style={{gridColumn:'1 / -1'}} rows={2} value={svcDesc} onChange={e=>setSvcDesc(e.target.value)} />
          <div style={{display:'flex',gap:8, gridColumn:'1 / -1', alignItems:'center'}}>
            <select value={svcStatus} onChange={e=>setSvcStatus(e.target.value)}>
              <option value="pendiente">pendiente</option>
              <option value="completado">completado</option>
              <option value="cancelado">cancelado</option>
            </select>
            <button className="btn" type="submit">Agregar servicio</button>
            {svcMsg && <span>{svcMsg}</span>}
          </div>
        </form>

        {/* Tabla de servicios */}
        {services.length === 0 ? (
          <div className="empty">No hay servicios.</div>
        ) : (
          <div className="table services-table">
            <div className="tr th">
              <div>ID</div>
              <div>Nombre</div>
              <div>Cantidad</div>
              <div>Precio unitario</div>
              <div>Total</div>
              <div>Estado</div>
              <div>Creado</div>
              <div>Acciones</div>
            </div>
            {services.map(s => {
              const qty = Number(s.qty ?? s.cantidad ?? 0);
              const unit = Number(s.unit_price ?? s.precio_unitario ?? 0);
              const total = serviceTotal(s);
              return (
                <div className="tr" key={s.id}>
                  <div>{s.id}</div>
                  <div title={s.descripcion || ""}>{s.titulo || s.service_name || "—"}</div>
                  <div>{Number.isFinite(qty) && qty>0 ? qty : "—"}</div>
                  <div>{Number.isFinite(unit) && unit>=0 ? `$${unit.toFixed(2)}` : "—"}</div>
                  <div>{`$${Number(total).toFixed(2)}`}</div>
                  <div>{s.estado || "—"}</div>
                  <div>{s.created_at ? new Date(s.created_at).toLocaleString() : "—"}</div>
                  <div>
                    <button className="btn danger" onClick={()=>deleteService(s.id)}>Eliminar</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Fotos */}
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
            {uploads.map((u, idx) => {
              const url = urlFrom(u);
              if (!url) return null;
              return (
                <a key={idx} href={url} target="_blank" rel="noreferrer" className="thumb">
                  <img src={url} alt={`foto_${idx}`} loading="lazy" />
                </a>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
