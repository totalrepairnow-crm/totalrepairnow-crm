import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

export default function Dashboard(){
  const [metrics,setMetrics] = useState(null);
  const [clients,setClients] = useState([]);
  const [loading,setLoading] = useState(true);
  const [err,setErr] = useState("");

  useEffect(()=>{
    (async ()=>{
      try{
        setLoading(true);
        // Métricas (si /api/metrics no existe, no rompemos)
        let m = { total_clients: 0, active_clients: 0, inactive_clients: 0, services_total_amount: "0.00" };
        try{
          const r = await apiFetch('/metrics');
          if (r.ok) {
            const data = await r.json();
            // adapta claves si tu endpoint usa otras
            m.total_clients = data.total_clients ?? data.total ?? m.total_clients;
            m.active_clients = data.active_clients ?? m.active_clients;
            m.inactive_clients = data.inactive_clients ?? m.inactive_clients;
            m.services_total_amount = (data.services_total_amount ?? data.total_amount ?? m.services_total_amount);
          }
        }catch(_e){/* silencioso */}

        setMetrics(m);

        // Lista rápida de clientes recientes
        const r2 = await apiFetch('/clients?page=1&pageSize=5&q=');
        if (!r2.ok) throw new Error(`HTTP ${r2.status}`);
        const d2 = await r2.json();
        setClients(d2.items || []);
      }catch(e){
        setErr(e.message||"Error");
      }finally{
        setLoading(false);
      }
    })();
  },[]);

  return (
    <div className="container">
      <div className="dash-head">
        <h1 className="dash-title">Dashboard</h1>
        <div className="spacer" />
        {metrics && <span className="api-chip">API: OK</span>}
      </div>

      <section className="metrics-grid">
        <Card title="Total de clientes" value={metrics?.total_clients ?? (loading ? "…" : 0)} />
        <Card title="Clientes activos" value={metrics?.active_clients ?? (loading ? "…" : 0)} />
        <Card title="Clientes inactivos" value={metrics?.inactive_clients ?? (loading ? "…" : 0)} />
        <Card title="Monto total servicio" prefix="$" value={metrics?.services_total_amount ?? (loading ? "…" : "0.00")} />
      </section>

      <section className="card">
        <div className="card-head"><h3>Clientes recientes</h3></div>
        {loading ? <div className="skel" /> : err ? <div className="alert error">{err}</div> : (
          <div className="table">
            <div className="tr th">
              <div>ID</div><div>Empresa</div><div>Email</div><div>Teléfono</div><div>Estado</div>
            </div>
            {clients.map(c=>(
              <div className="tr" key={c.id}>
                <div>{c.id}</div>
                <div>{c.empresa}</div>
                <div>{c.email || "—"}</div>
                <div>{c.telefono || "—"}</div>
                <div>{c.estado}</div>
              </div>
            ))}
            {clients.length===0 && <div className="empty">No hay clientes</div>}
          </div>
        )}
      </section>
    </div>
  );
}

function Card({ title, value, prefix }) {
  return (
    <div className="card">
      <div className="card-head"><h3>{title}</h3></div>
      <div className="big">{prefix}{String(value)}</div>
    </div>
  );
}
