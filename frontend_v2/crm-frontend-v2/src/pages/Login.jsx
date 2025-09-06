import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../lib/api'

export default function Login(){
  const nav = useNavigate()
  const [email, setEmail] = useState('admin@totalrepairnow.com')
  const [password, setPassword] = useState('Alfa12345.')
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e){
    e.preventDefault()
    setErr(null); setLoading(true)
    try {
      await login(email, password)
      nav('/dashboard', { replace:true })
    } catch (e) {
      setErr(e.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{maxWidth:420}}>
      <h1>Sign in</h1>
      {err && <p className="error">Error: {err}</p>}
      <form onSubmit={onSubmit} className="card" style={{display:'grid', gap:12}}>
        <label>
          <div>Email</div>
          <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
        </label>
        <label>
          <div>Password</div>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </label>
        <button className="btn" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}

