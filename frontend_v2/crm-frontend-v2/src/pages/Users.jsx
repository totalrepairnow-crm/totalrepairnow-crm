import React, { useEffect, useMemo, useState } from 'react'
import { getUsers } from '../lib/api'

function RoleBadge({ role }) {
  const r = (role || '').toLowerCase()
  const className = `badge ${r ? `role-${r}` : ''}`
  const label = r ? r.charAt(0).toUpperCase() + r.slice(1) : 'User'
  return <span className={className}>{label}</span>
}

export default function Users() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    setErr('')
    getUsers()
      .then(data => {
        if (!alive) return
        const arr = Array.isArray(data) ? data : (data?.items || [])
        setRows(arr)
      })
      .catch(e => {
        if (!alive) return
        setErr(e?.message || 'Failed to load users')
      })
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter(u =>
      [u.email, u.username, u.role]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(s))
    )
  }, [rows, q])

  return (
    <div>
      <div className="toolbar">
        <h1>Users</h1>
        <div className="toolbar-actions">
          <input
            className="input"
            placeholder="Search…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
      </div>

      {loading && <div className="muted">Loading…</div>}
      {err && <div className="alert error">{err}</div>}

      {!loading && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th><th>Username</th><th>Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.username || '-'}</td>
                  <td><RoleBadge role={u.role} /></td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: '#64748b' }}>
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

