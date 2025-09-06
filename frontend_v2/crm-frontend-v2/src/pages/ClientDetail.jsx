import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getClient } from '../lib/api'

export default function ClientDetail(){
  const { id } = useParams()
  const [client, setClient] = useState(null)
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let on = true
    ;(async () => {
      try {
        const data = await getClient(id)
        if (on) setClient(data)
      } catch (e) {
        if (on) setErr(e.message)
      } finally {
        on && setLoading(false)
      }
    })()
    return () => { on = false }
  }, [id])

  return (
    <div className="page">
      <div style={{display:'flex',alignItems:'center',gap:12, marginBottom:10}}>
        <h1 style={{margin:0}}>Client #{id}</h1>
        <Link to="/clients" className="btn-ghost">← Back</Link>
      </div>

      {loading && <p>Loading…</p>}
      {err && <p className="error">Error: {err}</p>}
      {(!loading && !client) && <p>No client data.</p>}

      {client && (
        <>
          <div className="card">
            <h3 style={{marginTop:0}}>Profile</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>
              <div><strong>First name:</strong> {client.first_name || '—'}</div>
              <div><strong>Last name:</strong> {client.last_name || '—'}</div>
              <div><strong>Email:</strong> {client.email || '—'}</div>
              <div><strong>Phone:</strong> {client.phone || '—'}</div>
              <div><strong>Created:</strong> {client.created_at ? new Date(client.created_at).toLocaleString() : '—'}</div>
            </div>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3 style={{marginTop:0}}>Services (WIP)</h3>
            <p>Coming soon.</p>
          </div>

          <div className="card" style={{marginTop:16}}>
            <h3 style={{marginTop:0}}>Invoices (WIP)</h3>
            <p>Coming soon.</p>
          </div>
        </>
      )}
    </div>
  )
}
