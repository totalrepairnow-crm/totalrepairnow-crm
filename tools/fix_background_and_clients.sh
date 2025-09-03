#!/usr/bin/env bash
set -euo pipefail

FRONT=~/crm_app/frontend

cd "$FRONT"

mkdir -p src/styles

if ! grep -q "white-bg.css" src/styles/app.css 2>/dev/null; then
cp -a src/styles/app.css "src/styles/app.css.bak.$(date +%s)" || true
printf '\n@import "./white-bg.css";\n' >> src/styles/app.css
fi

cat > src/styles/white-bg.css <<'CSS'
html, body, #root {
height: 100%;
}

body {
background: #fff;
margin: 0;
}

.container {
background: #fff;
min-height: calc(100vh - 64px);
box-sizing: border-box;
}
CSS

if [ -f src/pages/Clients.jsx ]; then
cp -a src/pages/Clients.jsx "src/pages/Clients.jsx.bak.$(date +%s)"
fi

cat > src/pages/Clients.jsx <<'JSX'
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../utils/api";

export default function Clients(){
const [items, setItems] = useState([]);
const [q, setQ] = useState("");
const [page, setPage] = useState(1);
const [pageSize] = useState(20);
const [total, setTotal] = useState(0);
const [loading, setLoading] = useState(true);
const [err, setErr] = useState("");

async function load(){
setLoading(true);
setErr("");
try{
const data = await apiFetch(/api/clients?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(q)});
setItems(Array.isArray(data?.items) ? data.items : []);
setTotal(Number(data?.total || 0));
}catch(e){
setErr("No se pudo cargar la lista de clientes");
setItems([]);
setTotal(0);
}finally{
setLoading(false);
}
}

useEffect(()=>{ load(); }, [page, pageSize]);

function onSubmit(e){
e.preventDefault();
setPage(1);
load();
}

return (
<div className="container">
<div className="dash-head">
<h1 className="dash-title">Clientes</h1>
<div className="spacer" />
<Link className="btn" to="/clients/new">Nuevo</Link>
</div>

  <section className="card">
    <form onSubmit={onSubmit} style={{display:"flex", gap:8}}>
      <input
        type="text"
        placeholder="Buscar por empresa o email"
        value={q}
        onChange={e=>setQ(e.target.value)}
        style={{flex:1}}
      />
      <button className="btn" type="submit">Buscar</button>
    </form>
  </section>

  <section className="card" style={{marginTop:12}}>
    {loading ? (
      <div className="skel" />
    ) : err ? (
      <div className="alert error">{err}</div>
    ) : (
      <div className="table">
        <div className="tr th" style={{pointerEvents:"none"}}>
          <div>ID</div><div>Empresa</div><div>Email</div><div>Teléfono</div><div>Estado</div><div>Acciones</div>
        </div>
        {items.map(c=>(
          <div className="tr" key={c.id} style={{background:"transparent"}}>
            <div>{c.id}</div>
            <div>{c.empresa}</div>
            <div>{c.email || "—"}</div>
            <div>{c.telefono || "—"}</div>
            <div>{c.estado}</div>
            <div style={{display:"flex", gap:8}}>
              <Link className="btn secondary" to={`/clients/${c.id}`}>Ver</Link>
              <Link className="btn" to={`/clients/${c.id}/edit`}>Editar</Link>
            </div>
          </div>
        ))}
        {items.length===0 && <div className="empty">No hay clientes</div>}
      </div>
    )}
  </section>

  <section className="card" style={{marginTop:12, display:"flex", gap:8, alignItems:"center"}}>
    <button
      className="btn secondary"
      onClick={()=> setPage(p => Math.max(1, p - 1))}
      disabled={page<=1 || loading}
    >Anterior</button>
    <span>Página {page}</span>
    <button
      className="btn secondary"
      onClick={()=> setPage(p => p + 1)}
      disabled={(page * pageSize) >= total || loading}
    >Siguiente</button>
    <span style={{marginLeft:"auto"}}>Total: {total}</span>
  </section>
</div>


);
}
JSX

npm run build
sudo rsync -av --delete build/ /var/www/crm/
sudo systemctl reload nginx
