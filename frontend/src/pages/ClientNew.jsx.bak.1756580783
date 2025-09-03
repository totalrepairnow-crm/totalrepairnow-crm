import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createClient } from "../utils/clients";

export default function ClientNew(){
  const [empresa,setEmpresa] = useState("");
  const [email,setEmail] = useState("");
  const [telefono,setTelefono] = useState("");
  const [estado,setEstado] = useState("activo");
  const [msg,setMsg] = useState("");
  const navigate = useNavigate();

  async function submit(e){
    e.preventDefault();
    setMsg("");
    try{
      await createClient({empresa,email,telefono,estado});
      navigate("/clients", { replace:true });
    }catch(e){ setMsg(e.message||"Error"); }
  }

  return (
    <div className="container">
      <div className="dash-head">
        <h1 className="dash-title">Nuevo cliente</h1>
        <div className="spacer" />
        <Link to="/clients" className="btn secondary">Volver</Link>
      </div>
      {msg && <div className="alert error">{msg}</div>}
      <form className="card form" onSubmit={submit}>
        <div className="grid-2">
          <div>
            <label>Empresa *</label>
            <input value={empresa} onChange={e=>setEmpresa(e.target.value)} required />
          </div>
          <div>
            <label>Estado</label>
            <select value={estado} onChange={e=>setEstado(e.target.value)}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <div>
            <label>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div>
            <label>Teléfono</label>
            <input value={telefono} onChange={e=>setTelefono(e.target.value)} />
          </div>
        </div>
        <button className="btn" type="submit">Guardar</button>
      </form>
    </div>
  );
}
