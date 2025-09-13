// src/pages/Services.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listServices } from "../lib/api";

function safe(v){ return v ?? "-"; }
function fmtMoney(n){ const num = Number(n ?? 0); return num.toLocaleString(undefined,{style:"currency",currency:"USD"}); }
function formatDate(s){ return s ? new Date(s).toLocaleString() : "-"; }
function WO(id){ return `WO-${String(id).padStart(6,"0")}`; }

export default function Services(){
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items:[], page:1, totalPages:1, hasPrev:false, hasNext:false });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function fetchData({ keepPage=false } = {}){
    setLoading(true); setErr("");
    try{
      const res = await listServices({ q, status, page: keepPage ? page : 1, limit });
      setData({
        items: res.items || [], page: res.page || 1, totalPages: res.totalPages || 1,
        hasPrev: !!res.hasPrev, hasNext: !!res.hasNext
      });
      if(!keepPage) setPage(1);
    }catch(e){
      setErr(e?.message || "Failed to load services.");
    }finally{
      setLoading(false);
    }
  }
  useEffect(()=>{ fetchData({ keepPage:true }); /* eslint-disable-next-line */ }, [page, limit]);

  function apply(){ setPage(1); fetchData(); }

  // Orden cliente: por creado desc
  const items = useMemo(()=>{
    return [...(data.items||[])].sort((a,b)=> new Date(b.created_at||0)-new Date(a.created_at||0));
  },[data.items]);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Services</h1>
        <div className="spacer" />
        <button className="btn primary" onClick={()=>nav("/services/new")}>+ New Service</button>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <input className="input" placeholder="Search (name or description)…" value={q} onChange={(e)=>setQ(e.target.value)} />
          <select className="input" value={status} onChange={(e)=>setStatus(e.target.value)}>
            <option value="">All status</option>
            <option value="open">Open</option>
            <option value="progress">In progress</option>
            <option value="closed">Closed</option>
          </select>
          <button className="btn" onClick={apply}>Apply</button>
        </div>
        <div className="toolbar-right">
          <label className="muted">Rows</label>
          <select className="input" value={limit} onChange={(e)=>setLimit(parseInt(e.target.value,10)||10)}>
            <option value="5">5 / page</option>
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
          </select>
        </div>
      </div>

      {err && <div className="alert">{err}</div>}

      <div className="table-wrap">
        <table className="table table-fixed">
          <colgroup>
            <col style={{width:"110px"}}/>{/* WO */}
            <col />{/* Service */}
            <col style={{width:"9ch"}}/>{/* Qty */}
            <col style={{width:"12ch"}}/>{/* Unit */}
            <col style={{width:"12ch"}}/>{/* Total */}
            <col style={{width:"12ch"}}/>{/* Status */}
            <col style={{width:"18ch"}}/>{/* Created */}
          </colgroup>
          <thead>
            <tr>
              <th>WO</th><th>Service</th><th>Qty</th><th>Unit</th><th>Total</th><th>Status</th><th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{textAlign:"center"}}>Loading…</td></tr>}
            {!loading && items.map(s=>(
              <tr key={s.id}>
                <td><Link to={`/services/${s.id}`}>{WO(s.id)}</Link></td>
                <td><span className="ellipsis" title={s.service_name || "-"}>{safe(s.service_name)}</span></td>
                <td className="nowrap">{s.quantity}</td>
                <td className="nowrap">{fmtMoney(s.unit_price)}</td>
                <td className="nowrap">{fmtMoney(s.total)}</td>
                <td className="nowrap">{safe(s.status)}</td>
                <td className="nowrap">{formatDate(s.created_at)}</td>
              </tr>
            ))}
            {!loading && items.length===0 && <tr><td colSpan={7} style={{textAlign:"center", color:"#94a3b8"}}>No results</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <button className="btn" disabled={!data.hasPrev || loading} onClick={()=>setPage(p=>Math.max(1,p-1))}>◀ Prev</button>
        <span className="muted">Page {data.page||1} / {data.totalPages||1}</span>
        <button className="btn" disabled={!data.hasNext || loading} onClick={()=>setPage(p=>p+1)}>Next ▶</button>
      </div>
    </div>
  );
}

