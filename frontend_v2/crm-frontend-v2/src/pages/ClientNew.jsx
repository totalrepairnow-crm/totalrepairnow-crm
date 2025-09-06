import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createClient } from '../lib/api'

export default function ClientNew(){
  const nav = useNavigate()
  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', phone:'' })
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(false)

  function upd(k, v){ setForm(s => ({ ...s, [k]: v })) }

  async function onSubmit(e){
    e.preventDefault()
    setErr(null); setLoading(true)
    try {
      const res = await createClient(form)
      // si backend devuelve el id nuevo, vamos al detalle
      const id = res?.id
      if (id) nav(`/clients/${id}`, { replace:true })
      else nav('/clients', { replace:true })
    } catch (e) {
      setErr(e.message || 'Error creating client')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{maxWidth:640}}>
      <div style={{display:'flex',alignItems:'center',gap:12, marginBottom:10}}>
        <h1 style={{margin:0}}>New client</h1>
        <Link to="/clients" className="btn-ghost">← Cancel</Link>
      </div>

      {err && <p className="error">Error: {err}</p>}

      <form onSubmit={onSubmit} className="card" style={{display:'grid', gap:12}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:12}}>
          <label>
            <div>First name</div>
            <input className="input" value={form.first_name} onChange={e=>upd('first_name', e.target.value)} />
          </label>
          <label>
            <div>Last name</div>
            <input className="input" value={form.last_name} onChange={e=>upd('last_name', e.target.value)} />
          </label>
        </div>
        <label>
          <div>Email</div>
          <input className="input" value={form.email} onChange={e=>upd('email', e.target.value)} />
        </label>
        <label>
          <div>Phone</div>
          <input className="input" value={form.phone} onChange={e=>upd('phone', e.target.value)} />
        </label>
        <button className="btn" disabled={loading}>{loading ? 'Saving…' : 'Save client'}</button>
        <p style={{color:'#64748b', margin:0, fontSize:12}}>
          If your backend doesn’t support <code>POST /api/clients</code> yet, you’ll see a 404/403 error here (UI won’t crash).
        </p>
      </form>
    </div>
  )
}
