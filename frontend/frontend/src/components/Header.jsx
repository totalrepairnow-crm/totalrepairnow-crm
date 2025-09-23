// src/components/Header.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getToken, onAuthChange, isAdminFromToken, logout } from '../lib/api';

export default function Header() {
  const [authed, setAuthed] = useState(!!getToken());
  const [isAdmin, setIsAdmin] = useState(isAdminFromToken());
  const loc = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const off = onAuthChange(() => {
      setAuthed(!!getToken());
      setIsAdmin(isAdminFromToken());
    });
    return off;
  }, []);

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  // Oculta botones en /login, pero el header siempre se muestra
  const hideNav = loc.pathname.startsWith('/login');

  return (
    <header className="topbar">
      <div className="container flex items-center justify-between">
        <Link to="/dashboard" className="brand flex items-center gap-2">
          <img src="/v2/logo.png" alt="Total Repair Now" className="h-10 w-10" />
          <span className="brand-title">Total Repair Now CRM</span>
        </Link>

        {!hideNav && authed && (
          <nav className="nav flex items-center gap-3">
            <Link to="/clients" className="btn-link">Clients</Link>
            <Link to="/services" className="btn-link">Services</Link>
            {isAdmin && <Link to="/users" className="btn-link">Users</Link>}
            <button className="btn" onClick={onLogout}>Logout</button>
          </nav>
        )}

        {!hideNav && !authed && (
          <nav className="nav">
            <Link to="/login" className="btn">Login</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
