import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getClients } from '../lib/api'

export default function Clients() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const nav = useNavigate()

  useEffect(() => {
    let alive = true
    setLoading(true)
    setErr('')
    getClients()
      .then(data => {
        if (!alive) return
        // backend puede devolver [] o {items: []}
        const arr = Array.isArray(data) ? data : (data?.items || [])
        setRows(arr)
      })
      .catch(e => {
        if (!alive) return
        setErr(e?.message || 'Failed to load clients')
      })
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter(c => {
      const name = [c.first_name, c.last_name].filter(Boolean).join(' ')
      return [
        name,
        c.email,
        c.phone,
        c.id
      ]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(s))
    })
  }, [rows, q])

  return (
    <div>
      <div className="toolbar">
        <h1>Clients</h1>
        <div className="toolbar-actions">
          <input
            className="input"
            placeholder="Search..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => nav('/clients/new')}>
            New Client
          </button>
        </div>
      </div>

      {loading && <div className="muted">Loading…</div>}
      {err && <div className="alert error">{err}</div>}

      {!loading && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Phone</th><th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || '(no name)'
                return (
                  <tr key={c.id}>
                    <td><Link to={`/clients/${c.id}`}>{name}</Link></td>
                    <td>{c.email || '-'}</td>
                    <td>{c.phone || '-'}</td>
                    <td>{c.created_at ? new Date(c.created_at).toLocaleString() : '-'}</td>
                  </tr>
                )
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#64748b' }}>
                    No results
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

