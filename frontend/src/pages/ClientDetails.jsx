import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function ClientDetails(){
  const { id } = useParams();
  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('token') : null), []);
  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let dead = false;
    async function load(){
      if(!token) return;
      setLoading(true); setErr(null);
      try{
        const r1 = await fetch(`/api/clients/${id}`, { headers:{ Authorization:`Bearer ${token}` }});
        const d1 = await r1.json();
        if(!r1.ok) throw new Error(d1.error || `HTTP ${r1.status}`);

        const r2 = await fetch(`/api/clients/${id}/services`, { headers:{ Authorization:`Bearer ${token}` }});
        const d2 = await r2.json();
        if(!r2.ok) throw new Error(d2.error || `HTTP ${r2.status}`);

        if(!dead){
          setClient(d1);
          setServices(d2.items || []);
        }
      } catch (ex){
        if(!dead) setErr(ex.message || 'Error cargando detalle');
      } finally{
        if(!dead) setLoading(false);
      }
    }
    load();
    return ()=>{ dead = true; };
  }, [id, token]);

  const totalServicios = services.reduce((acc, s)=>{
    const t = Number(s.final_amount ?? s.total ?? 0);
    return acc + (isFinite(t) ? t : 0);
  }, 0);

  const addr = client ? [
    client.address_line1, client.address_line2,
    [client.city, client.state].filter(Boolean).join(', '),
    [client.zip, client.country].filter(Boolean).join(' ')
  ].filter(Boolean).join(' · ') : null;

  return (
    <div style={{padding:16}}>
      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:12}}>
        <Link to="/" style={{textDecoration:'none', padding:'6px 10px', border:'1px solid #1f2937', borderRadius:8}}>← Volver</Link>
        <h2 style={{margin:0}}>Detalle de cliente</h2>
      </div>

      {loading && <div>Cargando…</div>}
      {err && <div style={{color:'#ef4444', marginBottom:12}}>{err}</div>}

      {client && (
        <div style={{display:'grid', gap:12, gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', marginBottom:16}}>
          <div style={{background:'#111827', color:'#e5e7eb', padding:12, borderRadius:12}}>
            <div style={{opacity:.75, fontSize:13}}>Empresa</div>
            <div style={{fontSize:18, fontWeight:600}}>{client.empresa}</div>
            <div style={{opacity:.75, fontSize:12, marginTop:6}}>Estado: {client.estado}</div>
          </div>
          <div style={{background:'#111827', color:'#e5e7eb', padding:12, borderRadius:12}}>
            <div style={{opacity:.75, fontSize:13}}>Contacto</div>
            <div>Email: {client.email || '—'}</div>
            <div>Teléfono: {client.telefono || '—'}</div>
          </div>
          <div style={{background:'#111827', color:'#e5e7eb', padding:12, borderRadius:12}}>
            <div style={{opacity:.75, fontSize:13}}>Dirección</div>
            <div>{addr || '—'}</div>
          </div>
          <div style={{background:'#111827', color:'#e5e7eb', padding:12, borderRadius:12}}>
            <div style={{opacity:.75, fontSize:13}}>Totales</div>
            <div>Servicios: {services.length}</div>
            <div>Monto total: {totalServicios.toFixed(2)}</div>
          </div>
        </div>
      )}

      <h3 style={{margin:'12px 0'}}>Servicios</h3>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0}}>
          <thead>
            <tr style={{background:'#0f172a', color:'#e5e7eb'}}>
              <th style={{textAlign:'left', padding:'10px 12px', borderTopLeftRadius:10}}>Servicio</th>
              <th style={{textAlign:'left', padding:'10px 12px'}}>Descripción</th>
              <th style={{textAlign:'left', padding:'10px 12px'}}>Técnico</th>
              <th style={{textAlign:'left', padding:'10px 12px'}}>Cant.</th>
              <th style={{textAlign:'left', padding:'10px 12px'}}>P. Unitario</th>
              <th style={{textAlign:'left', padding:'10px 12px'}}>Total</th>
              <th style={{textAlign:'left', padding:'10px 12px', borderTopRightRadius:10}}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s, idx)=>(
              <tr key={s.id} style={{background: idx % 2 ? '#0b0f14' : '#0f172a', color:'#e5e7eb'}}>
                <td style={{padding:'10px 12px', borderLeft:'1px solid #1f2937'}}>{s.service_name}</td>
                <td style={{padding:'10px 12px'}}>{s.description || '—'}</td>
                <td style={{padding:'10px 12px'}}>{s.technician || '—'}</td>
                <td style={{padding:'10px 12px'}}>{s.quantity}</td>
                <td style={{padding:'10px 12px'}}>{s.unit_price}</td>
                <td style={{padding:'10px 12px'}}>{(s.final_amount ?? s.total) ?? '—'}</td>
                <td style={{padding:'10px 12px', borderRight:'1px solid #1f2937'}}>{new Date(s.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {!services.length && !loading && (
              <tr><td colSpan={7} style={{padding:16, textAlign:'center', opacity:.8}}>Sin servicios</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
