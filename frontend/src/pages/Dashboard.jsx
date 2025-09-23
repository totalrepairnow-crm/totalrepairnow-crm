// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboard, listServices } from "../lib/api";

function safe(v){ return v ?? "-"; }
function fmtMoney(n){
  const num = Number(n ?? 0);
  return num.toLocaleString(undefined, { style:"currency", currency:"USD" });
}
function WO(id){ return `WO-${String(id).padStart(6,"0")}`; }

export default function Dashboard(){
  const [dash, setDash] = useState(null);
  const [err, setErr] = useState("");
  const [recent, setRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  useEffect(()=>{
    let alive = true;
    (async ()=>{
      try{
        const d = await getDashboard();
        if(!alive) return;
        // Normaliza por si faltan props
        const normalized = {
          totalClients: d?.totalClients ?? 0,
          openServices: d?.openServices ?? 0,
          revenueMonth: d?.revenueMonth ?? 0,
          revenueYtd: d?.revenueYtd ?? 0,
        };
        setDash(normalized);
      }catch(e){
        if(!alive) return;
        setErr(e?.message || "Failed to load dashboard.");
      }
    })();
    return ()=>{ alive = false; };
  },[]);

  useEffect(()=>{
    let alive = true;
    setLoadingRecent(true);
    (async ()=>{
      try{
        const r = await listServices({ page:1, limit:5 });
        if(!alive) return;
        setRecent(r?.items || []);
      }catch(_e){
        if(!alive) return;
        setRecent([]);
      }finally{
        if(alive) setLoadingRecent(false);
      }
    })();
    return ()=>{ alive = false; };
  },[]);

  // Mini bar chart demostrativo (datos fijos si el backend no trae series)
  const demoMonths = ["Apr","May","Jun","Jul","Aug","Sep"];
  const demoValues = [10,14,9,18,16,20];
  const maxV = Math.max(...demoValues, 1);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className="spacer" />
      </div>

      {err && <div className="alert">{err}</div>}

      <div className="dash-grid">
        {/* KPI - Clients */}
        <div className="dash-card">
          <div className="dash-card__header"><h2>Clients</h2></div>
          <div className="dash-card__body">
            <div className="kpi">
              <div className="kpi-value">{dash ? dash.totalClients : "…"}</div>
              <div className="kpi-label">total</div>
            </div>
            <div className="chart-container" style={{marginTop:10}}>
              <svg viewBox="0 0 200 80" preserveAspectRatio="none">
                {demoValues.map((v,i)=>(
                  <rect key={i} x={i*34+6} y={80-(v/maxV*70)} width="24" height={(v/maxV*70)} fill="#0ea5e9" rx="4" />
                ))}
                {demoMonths.map((m,i)=>(
                  <text key={m} x={i*34+18} y={78} fontSize="8" textAnchor="middle" fill="#64748b">{m}</text>
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* KPI - Open Services */}
        <div className="dash-card">
          <div className="dash-card__header"><h2>Open Services</h2></div>
          <div className="dash-card__body">
            <div className="kpi">
              <div className="kpi-value">{dash ? dash.openServices : "…"}</div>
              <div className="kpi-label">currently open</div>
            </div>
            <div className="chart-container" style={{marginTop:10}}>
              <svg viewBox="0 0 200 80" preserveAspectRatio="none">
                {[8,6,7,9,12,10].map((v,i)=>(
                  <circle key={i} cx={i*34+18} cy={80-(v/12*70)} r="3" fill="#0ea5e9" />
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* KPI - Revenue (Month / YTD) */}
        <div className="dash-card">
          <div className="dash-card__header"><h2>Revenue</h2></div>
          <div className="dash-card__body">
            <div className="kpi"><div className="kpi-value">{dash ? fmtMoney(dash.revenueMonth) : "…"}</div><div className="kpi-label">this month</div></div>
            <div className="kpi" style={{marginTop:6}}><div className="kpi-value" style={{fontSize:22}}>{dash ? fmtMoney(dash.revenueYtd) : "…"}</div><div className="kpi-label">YTD</div></div>
          </div>
        </div>

        {/* Services (con botón View) */}
        <div className="dash-card">
          <div className="dash-card__header">
            <h2>Services</h2>
            <Link to="/services" className="btn">View</Link>
          </div>
          <div className="dash-card__body">
            <div style={{fontSize:14, color:'#64748b', marginBottom:8}}>Recent services</div>
            <div className="table-wrap">
              <table className="table table-compact">
                <thead>
                  <tr>
                    <th>WO</th><th>Service</th><th>Total</th><th>Status</th><th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRecent && <tr><td colSpan={5} style={{textAlign:"center"}}>Loading…</td></tr>}
                  {!loadingRecent && recent.map(s=>(
                    <tr key={s.id}>
                      <td><Link to={`/services/${s.id}`}>{WO(s.id)}</Link></td>
                      <td><span className="ellipsis" title={s.service_name || "-"}>{safe(s.service_name)}</span></td>
                      <td>{fmtMoney(s.total)}</td>
                      <td>{safe(s.status)}</td>
                      <td>{new Date(s.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {!loadingRecent && recent.length===0 && <tr><td colSpan={5} style={{textAlign:"center",color:"#94a3b8"}}>No data</td></tr>}
                </tbody>
              </table>
            </div>
            <div style={{marginTop:10, display:"flex", gap:8}}>
              <Link to="/services" className="btn">View</Link>
              <Link to="/services/new" className="btn primary">+ New Service</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
