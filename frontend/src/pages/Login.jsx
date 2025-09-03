import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "../utils/auth";

export default function Login(){
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [msg,setMsg] = useState("");
  const nav = useNavigate();

  async function submit(e){
    e.preventDefault();
    setMsg("");
    try{
      const r = await fetch('/api/auth/login', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, password })
      });
      const data = await r.json().catch(()=>({}));
      if (!r.ok || !data.token) throw new Error(data.error || 'Credenciales inválidas');
      setToken(data.token);
      nav('/', { replace:true });
    }catch(e){
      setMsg(e.message || "Error");
    }
  }

  return (
    <div className="container" style={{maxWidth:420}}>
      <h1 className="dash-title" style={{margin:'16px 0'}}>Iniciar sesión</h1>
      {msg && <div className="alert error">{msg}</div>}
      <form className="card form" onSubmit={submit}>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Contraseña</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <button className="btn" type="submit">Entrar</button>
      </form>
    </div>
  );
}
