import React, { useEffect, useState } from 'react'
import { getUsers } from '../lib/api'

export default function Users() {
  const [rows, setRows] = useState([])
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let on = true
    getUsers()
      .then(d => {
        const items = Array.isArray(d) ? d : (d?.items || [])
        if (on) setRows(items)
      })
      .catch(e => { if (on) setErr(e.message) })
      .finally(() => on && setLoading(false))
    return () => { on = false }
  }, [])

  return (
    <div className="page">
      <h1>Users</h1>
      {loading && <p>Loading…</p>}
      {err && <p className="error">Error: {err}</p>}
      {!loading &&
        <table className="table">
          <thead><tr><th>ID</th><th>Email</th><th>Role</th><th>Username</th></tr></thead>
          <tbody>
            {rows.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.username}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4}>No users (or forbidden)</td></tr>}
          </tbody>
        </table>
      }
    </div>
  )
}

