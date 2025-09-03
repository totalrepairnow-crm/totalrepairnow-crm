import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listClients } from "../utils/clients";

export default function Clients(){
  const [data,setData] = useState({items:[], total:0, page:1, pageSize:20});
  const [q,setQ] = useState("");
  const [loading,setLoading] = useState(true);
  const [err,setErr] = useState("");
  const navigate = useNavigate();

  async function load(p=1){
    try{
      setLoading(true); setErr("");
      const res = await listClients({page:p,pageSize:20,q});
      setData(res);
    }catch(e){
      setErr(e.message || "Error");
    }finally{ setLoading(false); }
  }

  useEffect(()=>{ load(1); },[]);

  return (
    <div className="container">
      <div className="dash-head">
        <h1 className="dash-title">Clientes</h1>
        <div className="spacer" />
        <Link to="/clients/new" className="btn">Nuevo cliente</Link>
      </div>
      <div className="card" style={{marginBottom:12}}>
        <form onSubmit={(e)=>{e.preventDefault(); load(1);}} className="grid-2">
          <div>
            <label>Búsqueda</label>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="empresa o email" />
          </div>
          <div style={{display:'flex',alignItems:'end',gap:8}}>
            <button className="btn" type="submit">Buscar</button>
            <button className="btn secondary" type="button" onClick={()=>{setQ(""); load(1);}}>Limpiar</button>
          </div>
        </form>
      </div>

      {loading ? <div className="skel" /> : err ? <div className="alert error">{err}</div> : (
        <div className="table">
          <div className="tr th">
            <div>ID</div><div>Empresa</div><div>Email</div><div>Teléfono</div><div>Acciones</div>
          </div>
          {data.items.map(c=>(
            <div className="tr" key={c.id}>
              <div>{c.id}</div>
              <div>{c.empresa}</div>
              <div>{c.email||"—"}</div>
              <div>{c.telefono||"—"}</div>
              <div className="row-actions">
                <Link className="btn secondary" to={`/clients/${c.id}`}>Ver</Link>
                <Link className="btn" to={`/clients/${c.id}/edit`}>Editar</Link>
              </div>
            </div>
          ))}
          {data.items.length===0 && <div className="empty">Sin resultados</div>}
        </div>
      )}
    </div>
  );
}
