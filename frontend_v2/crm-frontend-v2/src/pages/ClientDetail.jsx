// src/pages/ClientDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getRole, getClient, listServices } from "../lib/api";

function safe(v){ return v ?? "-"; }
function fmtMoney(n){ const num = Number(n ?? 0); return num.toLocaleString(undefined,{style:"currency",currency:"USD"}); }
function formatDate(s){ return s ? new Date(s).toLocaleString() : "-"; }
function WO(id){ return `WO-${String(id).padStart(6,"0")}`; }

export default function ClientDetail(){
  const { id } = useParams();
  const nav = useNavigate();
  const isAdmin = getRole()==="admin";

  const [client, setClient] = useState(null);
  const [err, setErr] = useState("");

  // Servicios del cliente
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [list, setList] = useState({ items:[], page:1, totalPages:1, hasPrev:false, hasNext:false });
  const [loadingList, setLoadingList] = useState(false);
  const [errList, setErrList] = useState("");

  useEffect(()=>{
    let alive = true;
    (async ()=>{
      try{
        const c = await getClient(id);
        if(!alive) return;
        setClient(c);
      }catch(e){
        if(!alive) return;
        setErr(e?.message || "Failed to load client.");
      }
    })();
    return ()=>{ alive = false; };
  },[id]);

  async function fetchServices({ keepPage=false } = {}){
    setLoadingList(true); setErrList("");
    try{
      const res = await listServices({ q, status, page: keepPage ? page : 1, limit, client_id: id });
      setList({
        items: res.items || [],
        page: res.page || 1,
        totalPages: res.totalPages || 1,
        hasPrev: !!res.hasPrev,
        hasNext: !!res.hasNext
      });
      if(!keepPage) setPage(1);
    }catch(e){
      setErrList(e?.message || "Failed to load services.");
    }finally{
      setLoadingList(false);
    }
  }
  useEffect(()=>{ fetchServices({ keepPage:true }); /* eslint-disable-next-line */ }, [page, limit]);

  function applyFilters(){ setPage(1); fetchServices(); }

  const name = useMemo(()=>{
    if(!client) return "-";
    const first = client.first_name?.trim() || "";
    const last  = client.last_name?.trim() || "";
    const full  = `${first} ${last}`.trim();
    return full || client.name || "-";
  },[client]);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Client #{id}</h1>
        <div className="spacer" />
        <Link className="btn" to="/clients">← Back</Link>
        <Link className="btn primary" to={`/services/new?client_id=${id}`}>+ New Service</Link>
        {isAdmin && <Link className="btn" to={`/clients/${id}/edit`}>Edit</Link>}
      </div>

      {err && <div className="alert">{err}</div>}

      {/* Client info */}
      <div className="form-card" style={{marginBottom:12}}>
        <div className="form-grid">
          <div className="field">
            <label>Name</label>
            <div>{name}</div>
          </div>
          <div className="field">
            <label>Email</label>
            <div>{safe(client?.email)}</div>
          </div>
          <div className="field">
            <label>Phone (mobile)</label>
            <div>{safe(client?.phone_mobile || client?.phone)}</div>
          </div>
          <div className="field">
            <label>Phone (home)</label>
            <div>{safe(client?.phone_home)}</div>
          </div>
          <div className="field">
            <label>Address</label>
            <div>
              {safe(client?.address_line1)}{client?.address_line2 ? `, ${client.address_line2}` : ""}
              {client?.city ? `, ${client.city}` : ""}{client?.state ? `, ${client.state}` : ""}{client?.postal_code ? `, ${client.postal_code}` : ""}
            </div>
          </div>
          <div className="field">
            <label>Warranty company</label>
            <div>{safe(client?.warranty_company)}</div>
          </div>
          <div className="field">
            <label>Lead source</label>
            <div>{safe(client?.lead_source)}</div>
          </div>
          <div className="field">
            <label>Referred by</label>
            <div>{safe(client?.referred_by)}</div>
          </div>
          <div className="field">
            <label>Created</label>
            <div>{formatDate(client?.created_at)}</div>
          </div>
        </div>
      </div>

      {/* Services of client */}
      <div className="page-header" style={{marginTop:4}}>
        <h1 style={{fontSize:18}}>Client services</h1>
        <div className="spacer" />
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
          <button className="btn" onClick={applyFilters}>Apply</button>
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

      {errList && <div className="alert">{errList}</div>}

      <div className="table-wrap">
        <table className="table table-fixed">
          <colgroup>
            <col style={{width:"110px"}}/>{/* WO */}
            <col />{/* Service */}
            <col style={{width:"8ch"}}/>{/* Qty */}
            <col style={{width:"12ch"}}/>{/* Price */}
            <col style={{width:"12ch"}}/>{/* Total */}
            <col style={{width:"12ch"}}/>{/* Status */}
            <col style={{width:"18ch"}}/>{/* Created */}
          </colgroup>
          <thead>
            <tr>
              <th>WO</th><th>Service</th><th>Qty</th><th>Price</th><th>Total</th><th>Status</th><th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loadingList && <tr><td colSpan={7} style={{textAlign:"center"}}>Loading…</td></tr>}
            {!loadingList && (list.items||[]).map(s=>(
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
            {!loadingList && (!list.items || list.items.length===0) && (
              <tr><td colSpan={7} style={{textAlign:"center", color:"#94a3b8"}}>No results</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <button className="btn" disabled={!list.hasPrev || loadingList} onClick={()=>setPage(p=>Math.max(1,p-1))}>◀ Prev</button>
        <span className="muted">Page {list.page||1} / {list.totalPages||1}</span>
        <button className="btn" disabled={!list.hasNext || loadingList} onClick={()=>setPage(p=>p+1)}>Next ▶</button>
      </div>
    </div>
  );
}
