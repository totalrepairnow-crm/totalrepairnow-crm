// src/pages/Services.jsx
import React, { useEffect, useState } from 'react';
import { listServices } from '../lib/api';

export default function Services(){
  const [items, setItems] = useState([]);
  const [page, setPage]   = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  async function load(p = page, l = limit){
    setLoading(true);
    try{
      const data = await listServices({ page: p, limit: l });
      setItems(data.items || []);
      setPage(data.page || p);
      setLimit(data.limit || l);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1, limit); /* primera carga */ }, []);

  const goto = (p) => {
    if (p < 1 || p > totalPages) return;
    load(p, limit);
  };

  return (
    <div>
      <div className="toolbar">
        <h1>Services</h1>
        <div className="toolbar-actions" style={{ gap: 8 }}>
          <label style={{ fontSize: 13, opacity: .9 }}>
            Rows:&nbsp;
            <select
              className="input"
              value={limit}
              onChange={(e)=>{ const l = Number(e.target.value)||10; load(1, l); }}
            >
              <option>5</option>
              <option>10</option>
              <option>20</option>
            </select>
          </label>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th style={{width:70}}>ID</th>
                <th>Service</th>
                <th>Description</th>
                <th style={{width:90, textAlign:'right'}}>Total</th>
                <th style={{width:140}}>Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{textAlign:'center'}}>Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} style={{textAlign:'center', color:'#94a3b8'}}>No results</td></tr>
              ) : items.map(s => (
                <tr key={s.id}>
                  <td>#{s.id}</td>
                  <td>{s.service_name || s.name || '-'}</td>
                  <td>{s.description || '-'}</td>
                  <td style={{textAlign:'right'}}>{s.total || s.total_amount || '-'}</td>
                  <td>{new Date(s.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pager">
          <button className="btn" onClick={()=>goto(page-1)} disabled={loading || page<=1}>◀ Prev</button>
          <span style={{opacity:.85}}>{page} / {totalPages}</span>
          <button className="btn" onClick={()=>goto(page+1)} disabled={loading || page>=totalPages}>Next ▶</button>
        </div>
      </div>
    </div>
  );
}
