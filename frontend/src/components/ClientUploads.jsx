import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ClientUploads() {
  const { id } = useParams();            // usa el mismo :id de la ruta /clients/:id
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  function authHeaders() {
    const t = localStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  }

  async function load() {
    try {
      const r = await fetch(`/api/clients/${id}/uploads`, { headers: authHeaders() });
      if (r.status === 401) return navigate("/login", { replace: true });
      if (!r.ok) return setItems([]);
      const data = await r.json();
      setItems(data.items || []);
    } catch {
      setItems([]);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    const files = fileRef.current?.files;
    if (!files || !files.length) { setMsg("Selecciona archivo(s)"); return; }
    setBusy(true); setMsg("");
    try {
      const fd = new FormData();
      for (const f of files) fd.append("files", f); // el backend espera el field "files"
      const r = await fetch(`/api/clients/${id}/uploads`, {
        method: "POST",
        headers: { ...authHeaders() }, // NO agregar Content-Type manual
        body: fd
      });
      if (r.status === 401) return navigate("/login", { replace: true });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await load();
      if (fileRef.current) fileRef.current.value = "";
      setMsg("Subida exitosa");
      setTimeout(()=>setMsg(""), 2000);
    } catch {
      setMsg("Error al subir");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-head"><h3>Fotos</h3></div>

      {/* Formulario de subida */}
      <form onSubmit={handleUpload}
            style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", marginBottom:12 }}>
        <input ref={fileRef} type="file" multiple />
        <button type="submit" disabled={busy}
          style={{ background:"#0b3d91", color:"#fff", border:"none", padding:"6px 10px",
                   borderRadius:6, cursor:"pointer" }}>
          {busy ? "Subiendo..." : "Subir"}
        </button>
        {msg ? <span>{msg}</span> : null}
      </form>

      {/* Galería */}
      {items.length === 0 ? (
        <div className="empty">Sin archivos</div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
          {items.map((u, i) => {
            const url = u.url || u; // el API puede devolver strings o {url,name}
            const name = u.name || String(url).split("/").pop();
            return (
              <a key={i} href={url} target="_blank" rel="noreferrer"
                 style={{ display:"block", border:"1px solid #e5e5e5", borderRadius:8, overflow:"hidden" }}>
                <img src={url} alt={name} loading="lazy" style={{ width:"100%", display:"block" }} />
                <div style={{ padding:"6px 8px", fontSize:12, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {name}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
