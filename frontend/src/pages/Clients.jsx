// src/pages/Clients.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listClients, hasSession } from '../lib/api';

export default function Clients() {
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!hasSession()) {
      nav('/login', { replace: true });
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(search = '') {
    try {
      const data = await listClients(search ? { q: search } : undefined);
      // backend puede devolver {rows: [...] } o lista directa
      const list = Array.isArray(data) ? data : (data.rows || data.data || []);
      setRows(list);
    } catch (e) {
      console.error('clients load error:', e);
      setRows([]);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    load(q.trim());
  }

  return (
    <div>
      <h2>Clients</h2>
      <form onSubmit={onSubmit} style={{ marginBottom: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" />
        <button type="submit">Search</button>
        <Link to="/clients/new" style={{ marginLeft: 12 }}>+ New</Link>
      </form>

      <table>
        <thead>
          <tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan="5">No results</td></tr>
          )}
          {rows.map(c => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.name}</td>
              <td>{c.email}</td>
              <td>{c.phone}</td>
              <td>
                <Link to={`/clients/${c.id}`}>View</Link>{' '}
                <Link to={`/clients/${c.id}/edit`}>Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

