import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { getToken, getUserFromToken, logoutAndGoLogin } from "../utils/auth";

export default function Header(){
  const nav = useNavigate();
  const token = getToken();
  const user = token ? getUserFromToken(token) : null;
  const isLogin = typeof window!=='undefined' && window.location.pathname === '/login';

  function doLogout(e){
    e.preventDefault();
    logoutAndGoLogin();
  }

  return (
    <header className="header" style={{display:'flex',alignItems:'center',gap:16,padding:'10px 16px'}}>
      <div className="brand" style={{display:'flex',alignItems:'center',gap:10}}>
        <img src="/logo.png" alt="CRM" style={{height:28}} />
        <Link to="/" className="brand-title" style={{fontWeight:700}}>Total Repair Now — CRM</Link>
      </div>
      {token && (
        <nav style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:12}}>
          <Link to="/">Dashboard</Link>
          <Link to="/clients">Clientes</Link>
          <Link to="/users">Usuarios</Link>
          <span className="api-chip">{user?.email || 'Sesión'} {user?.role ? `(${user.role})` : ''}</span>
          <a href="/logout" onClick={doLogout} className="btn secondary" style={{padding:'6px 10px'}}>Salir</a>
        </nav>
      )}
      {!token && !isLogin && (
        <nav style={{marginLeft:'auto'}}><Link className="btn" to="/login">Iniciar sesión</Link></nav>
      )}
    </header>
  );
}
