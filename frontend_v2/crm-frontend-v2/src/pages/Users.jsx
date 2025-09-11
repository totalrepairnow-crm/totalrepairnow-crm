// src/pages/Users.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { listUsers, deleteUser, fullName, isAdminFromToken } from '../lib/api';

const ROLES = [
  { value: '', label: 'All roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'tech', label: 'Tech' },
  { value: 'client', label: 'Client' },
];

function safe(v) { return v ?? '-'; }

export default function Users() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [data, setData] = useState({
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  });

  // Filtros desde URL para mantener deep-link
  const page  = Number(params.get('page') || 1);
  const q     = params.get('q') || '';
  const role  = params.get('role') || '';
  const limit = 10;

  const isAdmin = useMemo(() => isAdminFromToken(), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const res = await listUsers({ q, role, page, limit });
        // Estructura esperada del backend:
        // { items:[...], total, page, totalPages, hasPrev, hasNext }
        const normalized = {
          items: res.items || res.data || res.users || [],
          total: Number(res.total || 0),
          page: Number(res.page || page || 1),
          totalPages: Number(res.totalPages || Math.max(1, Math.ceil((res.total || 0) / limit))),
          hasPrev: Boolean(res.hasPrev ?? (page > 1)),
          hasNext: Boolean(res.hasNext ?? (page < Math.ceil((res.total || 0) / limit))),
        };
        if (!alive) return;
        setData(normalized);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || 'Failed to load users.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [q, role, page]);

  function updateParam(key, val) {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val); else next.delete(key);
    if (key !== 'page') next.delete('page'); // si cambias filtros, vuelve a pág 1
    setParams(next, { replace: false });
  }

  function gotoPage(p) {
    if (!p || p < 1 || p > data.totalPages) return;
    updateParam('page', String(p));
  }

  async function onDelete(id) {
    if (!isAdmin) return;
    if (!window.confirm('Delete this user?')) return;
    try {
      await deleteUser(id);
      // Refrescar con misma querystring
      updateParam('page', String(page));
    } catch (e) {
      alert(e?.message || 'Delete failed');
    }
  }

  return (
    <div className="container">
      {/* Encabezado principal (igual que Clients) */}
      <div className="header-row">
        <h1 className="title">Users</h1>
        <div className="header-right muted">
          Total: {data.total}
        </div>
      </div>

      {/* Sub-barra: búsqueda / roles / botón New */}
      <div className="subheader">
        <div className="left">
          <input
            className="input"
            type="search"
            placeholder="Search users…"
            value={q}
            onChange={e => updateParam('q', e.target.value.trim())}
          />
          <select
            className="select"
            value={role}
            onChange={e => updateParam('role', e.target.value)}
          >
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div className="right">
          {isAdmin && (
            <Link className="btn primary" to="/users/new">New User</Link>
          )}
        </div>
      </div>

      {/* Tabla en tarjeta, igual que Clients */}
      <div className="card table-wrap">
        <table className="table">
          <colgroup>
            <col style={{ width: 90 }} />
            <col />
            <col style={{ width: '30%' }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 260 }} />
          </colgroup>

          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th className="actions-cell">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr><td colSpan={5} style={{ textAlign: 'center' }}>Loading…</td></tr>
            )}

            {!loading && data.items.map(u => (
              <tr key={u.id}>
                <td className="nowrap">#{u.id}</td>
                <td>
                  <span className="ellipsis" title={fullName(u)}>{fullName(u)}</span>
                </td>
                <td>
                  <span className="ellipsis" title={u.email || '-'}>{safe(u.email)}</span>
                </td>
                <td className="nowrap">{safe((u.role || '').toString().toLowerCase())}</td>
                <td className="actions-cell">
                  <div className="actions">
                    <Link className="btn" to={`/users/${u.id}`}>View</Link>
                    {isAdmin && <Link className="btn primary" to={`/users/${u.id}/edit`}>Edit</Link>}
                    {isAdmin && <button className="btn danger" onClick={() => onDelete(u.id)}>Delete</button>}
                  </div>
                </td>
              </tr>
            ))}

            {!loading && data.items.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>No results</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="pager" style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end', marginTop: 12 }}>
        <button className="btn" disabled={!data.hasPrev || loading} onClick={() => gotoPage(data.page - 1)}>◀ Prev</button>
        <span style={{ opacity: .8 }}>Page {data.page} / {data.totalPages}</span>
        <button className="btn" disabled={!data.hasNext || loading} onClick={() => gotoPage(data.page + 1)}>Next ▶</button>
      </div>
    </div>
  );
}
