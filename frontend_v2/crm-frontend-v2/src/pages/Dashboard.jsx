import React, { useEffect, useState } from 'react'
import { getDashboard } from '../lib/api'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let on = true
    getDashboard()
      .then(d => { if (on) setData(d) })
      .catch(e => { if (on) setErr(e.message) })
      .finally(() => on && setLoading(false))
    return () => { on = false }
  }, [])

  if (loading) return <div className="page"><h1>Dashboard</h1><p>Loading…</p></div>
  if (err) return <div className="page"><h1>Dashboard</h1><p className="error">Error: {err}</p></div>

  const totals = data?.totals || {}
  const series = data?.series?.servicesPerWeek || []

  return (
    <div className="page">
      <h1>Dashboard</h1>

      <div className="metrics">
        <div className="card">
          <div className="label">Clients</div>
          <div className="big">{totals.clients ?? '—'}</div>
        </div>
        <div className="card">
          <div className="label">Users</div>
          <div className="big">{totals.users ?? '—'}</div>
        </div>
        <div className="card">
          <div className="label">Services</div>
          <div className="big">{totals.services ?? '—'}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Services per week</h3>
        <table className="table">
          <thead><tr><th>Week</th><th>Count</th></tr></thead>
          <tbody>
            {series.map((r, i) => (
              <tr key={i}>
                <td>{new Date(r.week).toLocaleDateString()}</td>
                <td>{r.count}</td>
              </tr>
            ))}
            {series.length === 0 && <tr><td colSpan={2}>No data</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

