// src/pages/Services.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Spinner from '../components/Spinner';
import { listServices } from '../lib/api';

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qInit = (searchParams.get('q') || '').toString();
  const pageInit = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limitInit = (() => {
    const n = parseInt(searchParams.get('limit') || '10', 10);
    if (!Number.isFinite(n) || n <= 0) return 10;
    return Math.min(n, 100);
  })();

  const [q, setQ] = useState(qInit);
  const [page, setPage] = useState(pageInit);
  const [limit, setLimit] = useState(limitInit);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Sincroniza URL al cambiar q (resetea a página 1)
  useEffect(() => {
    const sp = new URLSearchParams(searchParams);
    if (q && q.trim()) sp.set('q', q.trim()); else sp.delete('q');
    sp.set('page', '1');
    sp.set('limit', String(limit));
    setSearchParams(sp, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Carga datos cuando cambian page/limit/q (desde la URL)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setErr('');
        const data = await listServices({
          q: (searchParams.get('q') || '').toString(),
          page: Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1),
          limit: (() => {
            const n = parseInt(searchParams.get('limit') || '10', 10);
            if (!Number.isFinite(n) || n <= 0) return 10;
            return Math.min(n, 100);
          })(),
        });
        if (cancelled) return;
        setItems(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setHasPrev(!!data.hasPrev);
        setHasNext(!!data.hasNext);
        // refleja los valores efectivos por si backend normaliza
        setPage(data.page || 1);
        setLimit(data.limit || limit);
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [searchParams]); // N.B.: depende de la URL

  const gotoPage = (p) => {
    const sp = new URLSearchParams(searchParams);
    sp.set('page', String(Math.max(1, p)));
    sp.set('limit', String(limit));
    setSearchParams(sp, { replace: false });
  };
  const changeLimit = (newLimit) => {
    const l = Math.min(Math.max(parseInt(newLimit, 10) || 10, 1), 100);
    const sp = new URLSearchParams(searchParams);
    sp.set('page', '1');
    sp.set('limit', String(l));
    if (q && q.trim()) sp.set('q', q.trim()); else sp.delete('q');
    setSearchParams(sp, { replace: false });
  };

  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);
  const showing = `${showingFrom}–${showingTo} de ${total}`;

  return (
    <div className="page">
      <div className="toolbar">
        <h1>Services</h1>
        <div className="toolbar-actions" style={{ gap: 10 }}>
          <input
            className="input"
            placeholder="Buscar (servicio, id, cliente)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: 260 }}
          />
          <select
            className="input"
            value={limit}
            onChange={(e) => changeLimit(e.target.value)}
            title="Items por página"
          >
            {[5,10,20,50].map(n => <option key={n} value={n}>{n} / page</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ position: 'relative' }}>
        {loading && (
          <div className="loading-overlay">
            <Spinner size={22} />
          </div>
        )}
        {err && <div className="alert error">Error: {err}</div>}

        <table className="table">
          <thead>
            <tr>
              <th style={{width:70}}>ID</th>
              <th>Service</th>
              <th style={{width:110}}>Client</th>
              <th style={{width:70, textAlign:'right'}}>Qty</th>
              <th style={{width:110, textAlign:'right'}}>Total</th>
              <th style={{width:110}}>Status</th>
              <th style={{width:160}}>Created</th>
            </tr>
          </thead>
          <tbody>
            {(items||[]).length === 0 && !loading ? (
              <tr><td colSpan="7" style={{ textAlign:'center', color:'#64748b' }}>Sin resultados</td></tr>
            ) : (items||[]).map(s => (
              <tr key={s.id}>
                <td>#{s.id}</td>
                <td>{s.service_name || s.name || '—'}</td>
                <td>{s.client_id ?? s.cliente_id ?? '—'}</td>
                <td style={{textAlign:'right'}}>{s.quantity ?? '—'}</td>
                <td style={{textAlign:'right'}}>{s.total ?? s.total_amount ?? '—'}</td>
                <td><span className={`badge ${s.status || ''}`}>{s.status || '—'}</span></td>
                <td>{(s.created_at || '').replace('T',' ').replace('Z','')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pager">
          <button className="btn" disabled={!hasPrev || loading} onClick={() => gotoPage(page - 1)}>◀ Prev</button>
          <div style={{opacity:.8}}>{showing}</div>
          <button className="btn" disabled={!hasNext || loading} onClick={() => gotoPage(page + 1)}>Next ▶</button>
        </div>
      </div>
    </div>
  );
}
