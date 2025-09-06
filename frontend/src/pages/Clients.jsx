import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api'; // ajusta si tu api vive en otra ruta

export default function Clients() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await api.get('/clients');
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Clients load error', e);
        if (!cancelled) setError('Failed to load clients');
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const needle = q.toLowerCase();
    return rows.filter(r => {
      const name = [r.first_name, r.last_name].filter(Boolean).join(' ');
      return [name, r.email, r.phone].filter(Boolean).some(v => v.toLowerCase().includes(needle));
    });
  }, [rows, q]);

  return (
    <div className="page">
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
        <h1>Clients</h1>
        <div className="actions" style={{display:'flex',gap:8}}>
          <Link className="button button--primary" to="/clients/new">Add Client</Link>
        </div>
      </div>

      <div className="toolbar" style={{margin:'12px 0'}}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email or phone"
          aria-label="Search clients"
          style={{padding:'8px 10px',borderRadius:8,border:'1px solid #e5e7eb',minWidth:260}}
        />
      </div>

      <div className="card">
        {loading && <div>Loading…</div>}
        {error && !loading && <div className="alert">{error}</div>}
        {!loading && filtered.length === 0 && <div>No clients found.</div>}

        {!loading && filtered.length > 0 && (
          <table className="table" style={{width:'100%'}}>
            <thead>
              <tr>
                <th style={{textAlign:'left'}}>Name</th>
                <th style={{textAlign:'left'}}>Email</th>
                <th style={{textAlign:'left'}}>Phone</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || '—';
                return (
                  <tr key={c.id}>
                    <td>{name}</td>
                    <td>{c.email || '—'}</td>
                    <td>{c.phone || '—'}</td>
                    <td>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                    <td style={{textAlign:'right'}}>
                      <Link className="button button--ghost" to={`/clients/${c.id}`}>View</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
