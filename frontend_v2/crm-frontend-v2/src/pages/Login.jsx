// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, setToken } from "../lib/api";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e){
    e.preventDefault();
    setErr("");
    setLoading(true);
    try{
      const res = await login({ email, password });
      const t = res?.accessToken || res?.token;
      if(!t) throw new Error("Missing token in response");
      setToken(t);
      nav("/dashboard", { replace:true });
    }catch(e){
      setErr(e?.message || "Login failed.");
    }finally{
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <img src="/v2/logo.png" alt="Total Repair Now" onError={(ev)=>{ev.currentTarget.style.display='none';}} />
            <h1>Sign in</h1>
          </div>
          <p className="muted" style={{marginTop:-6}}>Access your TRN CRM account</p>

          {err && <div className="alert" style={{marginTop:10}}>{err}</div>}

          <form onSubmit={onSubmit} style={{marginTop:10}}>
            <div className="field">
              <label>Email</label>
              <input
                type="email" className="input"
                value={email} onChange={(e)=>setEmail(e.target.value)}
                placeholder="you@example.com" required
              />
            </div>

            <div className="field" style={{marginTop:10}}>
              <label>Password</label>
              <input
                type="password" className="input"
                value={password} onChange={(e)=>setPassword(e.target.value)}
                placeholder="••••••••" required
              />
            </div>

            <div className="form-actions">
              <button className="btn primary" type="submit" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
