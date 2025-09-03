import React, { useEffect, useState } from "react";
import { listUsers, createUser } from "../utils/users";

export default function Users(){
  const [items,setItems] = useState([]);
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [role,setRole] = useState("tech");
  const [msg,setMsg] = useState("");

  async function load(){
    try{
      const res = await listUsers().catch(()=>({items:[]}));
      setItems(res.items || res || []);
    }catch(e){ /* opcional */ }
  }
  useEffect(()=>{ load(); },[]);

  async function submit(e){
    e.preventDefault();
    setMsg("");
    try{
      await createUser({email,password,role});
      setEmail(""); setPassword(""); setRole("tech");
      setMsg("Usuario creado");
      load();
    }catch(e){ setMsg(e.message || "Error"); }
  }

  return (
    <div className="container">
      <div className="dash-head"><h1 className="dash-title">Usuarios</h1></div>

      <section className="card" style={{marginBottom:12}}>
        <h3>Nuevo usuario</h3>
        {msg && <div className="alert">{msg}</div>}
        <form className="grid-2" onSubmit={submit}>
          <div>
            <label>Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div>
            <label>Contraseña</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <div>
            <label>Rol</label>
            <select value={role} onChange={e=>setRole(e.target.value)}>
              <option value="admin">Admin</option>
              <option value="tech">Técnico</option>
            </select>
          </div>
          <div style={{display:'flex',alignItems:'end'}}><button className="btn">Crear</button></div>
        </form>
      </section>

      <section className="card">
        <div className="card-head"><h3>Listado</h3></div>
        <div className="table">
          <div className="tr th"><div>ID</div><div>Email</div><div>Rol</div><div>—</div><div>—</div></div>
          {items.map((u,i)=>(
            <div className="tr" key={u.id||i}>
              <div>{u.id||"—"}</div>
              <div>{u.email||"—"}</div>
              <div>{u.role||"—"}</div>
              <div>—</div><div>—</div>
            </div>
          ))}
          {(!items||items.length===0) && <div className="empty">Sin usuarios</div>}
        </div>
      </section>
    </div>
  );
}
