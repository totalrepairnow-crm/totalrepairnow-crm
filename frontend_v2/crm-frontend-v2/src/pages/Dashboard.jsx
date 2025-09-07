import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getToken } from '../lib/api'
import './Dashboard.css'   // <— IMPORTA EL CSS LOCAL

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [totals, setTotals] = useState({ clients: 0, users: 0, services: 0 })
  const [series, setSeries] = useState({ servicesPerWeek: [] })

  useEffect(() => {
    let abort = false
    ;(async () => {
      setLoading(true)
      setErr('')
      try {
        const res = await fetch('/api/dashboard', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken() || ''}`,
          },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (abort) return

        if (data?.totals) setTotals(data.totals)
        if (data?.series) setSeries(data.series)
      } catch (_e) {
        if (!abort) setErr('Error loading dashboard')
      } finally {
        if (!abort) setLoading(false)
      }
    })()
    return () => { abort = true }
  }, [])

  return (
    <div className="dashboard-page">
      <div className="toolbar">
        <h1>Dashboard</h1>
      </div>

      {err && <div className="alert error">{err}</div>}

      <div className="dash-row">
        {/* Clients */}
        <section className="dash-card">
          <header className="dash-card__header">
            <h2>Clients</h2>
            <Link className="btn btn-primary" to="/clients">View</Link>
          </header>
          <div className="kpi">
            <div className="kpi-value">{totals.clients}</div>
            <div className="kpi-label">Total clients</div>
          </div>
          <div className="dash-card__body">
            <table className="table table-compact">
              <tbody>
                <tr>
                  <td>Registered</td>
                  <td style={{textAlign:'right'}}>{totals.clients}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Users */}
        <section className="dash-card">
          <header className="dash-card__header">
            <h2>Users</h2>
            <Link className="btn" to="/users">View</Link>
          </header>
          <div className="kpi">
            <div className="kpi-value">{totals.users}</div>
            <div className="kpi-label">Total users</div>
          </div>
          <div className="dash-card__body">
            <table className="table table-compact">
              <tbody>
                <tr>
                  <td>Active</td>
                  <td style={{textAlign:'right'}}>{totals.users}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Services */}
        <section className="dash-card">
          <header className="dash-card__header">
            <h2>Services</h2>
            <span className="badge">coming soon</span>
          </header>
          <div className="kpi">
            <div className="kpi-value">{totals.services}</div>
            <div className="kpi-label">Total services</div>
          </div>
          <div className="dash-card__body">
            <table className="table table-compact">
              <tbody>
                {Array.isArray(series.servicesPerWeek) && series.servicesPerWeek.slice(0,4).map((w, i) => (
                  <tr key={i}>
                    <td>{new Date(w.week).toLocaleDateString()}</td>
                    <td style={{textAlign:'right'}}>{w.count}</td>
                  </tr>
                ))}
                {!Array.isArray(series.servicesPerWeek) || !series.servicesPerWeek.length ? (
                  <tr><td colSpan={2} style={{textAlign:'center', color:'#64748b'}}>No data</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}
    </div>
  )
}

