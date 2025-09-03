import React, { useEffect, useState, useMemo } from 'react';

export default function Dashboard(){
  const [metrics, setMetrics] = useState(null);
  const [mErr, setMErr] = useState(null);

  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [cErr, setCErr] = useState(null);

  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('token') : null), []);

  // Cargar métricas
  useEffect(()=>{
    if(!token) return;
    fetch('/api/metrics', { headers:{ Authorization:`Bearer ${token}` }})
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
      .then(setMetrics)
      .catch(setMErr);
  }, [token]);

  // Cargar clientes
  const loadClients = async (opts={}) => {
    if(!token) return;
    const nextPage = opts.page ?? page;
    const search = opts.q ?? q;
    try{
      setLoading(true); setCErr(null);
      const url = `/api/clients?page=${nextPage}&pageSize=${pageSize}${search ? `&q=${encodeURIComponent(search)}`:''}`;
      const r = await fetch(url, { headers:{ Authorization:`Bearer ${token}` }});
      const data = await r.json();
      if(!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setClients(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || nextPage);
    }catch(ex){
      setCErr(ex.message || 'Error cargando clientes');
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{ loadClients().catch(()=>{}); }, [token]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const goto = (p) => {
    const np = Math.min(Math.max(1, p), totalPages);
    loadClients({ page: np }).catch(()=>{});
  };

  return (
    <div style={{padding:16}}>
      <h2 style={{margin:'0 0 12px'}}>Dashboard</h2>

      {/* MÉTRICAS */}
      <div style={{display:'grid', gap:12, gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', marginBottom:18}}>
        <div style={{background:'#111827', color:'#e5e7eb', padding:12, borderRadius:12}}>
          <div style={{opacity:.75, fontSize:13}}>Total de clientes</div>
          <div style={{fontSize:24, fontWeight:700}}>{metrics?.total_clients ?? '—'}</div>
        </div>
        <div style={{background:'#111827', color:'#e5e7eb', padding:12, borderRadius:12}}>
          <div style={{opacity:.75, fontSize:13}}>Clientes activos</div>
          <div style={{fontSize:24, fontWeight:700}}>{metrics?.active_clients ?? '—'}</div>
        </div>
        <div style={{background:'#111827', color:'#e5e7eb', padding:12, borderRadius:12}}>
          <div style={{opacity:.75, fontSize:13}}>Clientes inactivos</div>
          <div style={{fontSize:24, fontWeight:700}}>{metrics?.inactive_clients ?? '—'}</div>
        </div>
        <div style={{background:'#111827', color:'#e5e7eb', padding:12, borderRadius:12}}>
          <div style={{opacity:.75, fontSize:13}}>Servicios (total)</div>
          <div style={{fontSize:24, fontWeight:700}}>{metrics?.services_count ?? '—'}</div>
        </div>
        <div style={{background:'#111827', color:'#e5e7eb', padding:12, borderRadius:12}}>
          <div style={{opacity:.75, fontSize:13}}>Monto servicios</div>
          <div style={{fontSize:24, fontWeight:700}}>{metrics?.services_total_amount ?? '—'}</div>
        </div>
      </div>
      {mErr && <div style={{color:'#ef4444', marginBottom:12}}>No se pudieron cargar las métricas</div>}

      {/* CLIENTES EN DASHBOARD */}
      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
        <h3 style={{margin:'0 8px 0 0'}}>Clientes</h3>
        <input
          placeholder="Buscar por empresa/email…"
          value={q}
          onChange={e=>setQ(e.target.value)}
          onKeyDown={e=>{ if(e.key === 'Enter'){ loadClients({ q, page:1 }).catch(()=>{});} }}
          style={{padding:'8px 10px', borderRadius:10, border:'1px solid #1f2937', background:'#0f172a', color:'#e5e7eb', minWidth:260}}
        />
        <button
          onClick={()=>loadClients({ q, page:1 })}
          disabled={loading}
          style={{padding:'8px 12px', borderRadius:10, background:'#3b82f6', border:'1px solid #3b82f6', color:'#fff', cursor:'pointer'}}
        >
          {loading ? 'Buscando…' : 'Buscar'}
        </button>
        <div style={{marginLeft:'auto', fontSize:12, opacity:.75}}>
          Página {page} / {totalPages} · {total} resultados
        </div>
      </div>

      {cErr && <div style={{color:'#ef4444', marginBottom:10}}>{cErr}</div>}

      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0}}>
          <thead>
            <tr style={{background:'#0f172a', color:'#e5e7eb'}}>
              <th style={{textAlign:'left', padding:'10px 12px', borderTopLeftRadius:10}}>Empresa</th>
              <th style={{textAlign:'left', padding:'10px 12px'}}>Email</th>
              <th style={{textAlign:'left', padding:'10px 12px'}}>Teléfono</th>
              <th style={{textAlign:'left', padding:'10px 12px'}}>Estado</th>
              <th style={{textAlign:'left', padding:'10px 12px', borderTopRightRadius:10}}>ID</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c, idx) => (
              <tr key={c.id} style={{background: idx % 2 ? '#0b0f14' : '#0f172a', color:'#e5e7eb'}}>
                <td style={{padding:'10px 12px', borderLeft:'1px solid #1f2937'}}>{c.empresa}</td>
                <td style={{padding:'10px 12px'}}>{c.email || '—'}</td>
                <td style={{padding:'10px 12px'}}>{c.telefono || '—'}</td>
                <td style={{padding:'10px 12px'}}>{c.estado}</td>
                <td style={{padding:'10px 12px', borderRight:'1px solid #1f2937'}}>
                  {c.id}<div style={{opacity:.6, fontSize:11}}>uuid: {c.cliente_id}</div>
                </td>
              </tr>
            ))}
            {!clients.length && !loading && (
              <tr><td colSpan={5} style={{padding:16, textAlign:'center', opacity:.8}}>Sin resultados</td></tr>
            )}
            {loading && (
              <tr><td colSpan={5} style={{padding:16, textAlign:'center'}}>Cargando…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:12}}>
        <button onClick={()=>goto(1)} disabled={page<=1} className="button" style={{opacity:page<=1?.6:1}}>« Primero</button>
        <button onClick={()=>goto(page-1)} disabled={page<=1} className="button" style={{opacity:page<=1?.6:1}}>‹ Anterior</button>
        <button onClick={()=>goto(page+1)} disabled={page>=totalPages} className="button" style={{opacity:page>=totalPages?.6:1}}>Siguiente ›</button>
        <button onClick={()=>goto(totalPages)} disabled={page>=totalPages} className="button" style={{opacity:page>=totalPages?.6:1}}>Último »</button>
      </div>
    </div>
  );
}
