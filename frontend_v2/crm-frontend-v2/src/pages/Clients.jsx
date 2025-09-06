import React, { useEffect, useMemo, useState } from 'react'
import { getClients } from '../lib/api'
import { Link, useNavigate } from 'react-router-dom'

export default function Clients() {
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  useEffect(() => {
    let on = true
    ;(async () => {
      try {
        const data = await getClients()
        const list = Array.isArray(data) ? data : (data?.items || [])
        if (on) setRows(list)
      } catch (e) {
        if (on) setErr(e.message)
      } finally {
        on && setLoading(false)
      }
    })()
    return () => { on = false }
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter(c => {
      return [c.first_name, c.last_name, c.email, c.phone]
        .filter(Boolean).some(v => String(v).toLowerCase().includes(s))
    })
  }, [rows, q])

  return (
    <div className="page">
      <h1>Clients</h1>

      <div className="toolbar" style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '8px 0 16px' }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search name, email or phone…"
          className="input"
          style={{ maxWidth: 320 }}
        />
        <button className="btn" onClick={() => setQ('')}>Clear</button>
        <button className="btn-ghost" onClick={() => nav('/clients/new')}>+ New client</button>
      </div>

      {loading && <p>Loading…</p>}
      {err && <p className="error">Error: {err}</p>}

      {!loading &&
        <table className="table">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Created</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || '—'
              return (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{name}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                  <td>
                    <Link to={`/clients/${c.id}`} className="btn-ghost">View</Link>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && <tr><td colSpan={6}>No clients</td></tr>}
          </tbody>
        </table>
      }
    </div>
  )
}

