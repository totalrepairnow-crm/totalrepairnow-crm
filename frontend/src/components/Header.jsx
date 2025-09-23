// src/components/Header.jsx
import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { getToken, clearToken, getRole, onAuthChange } from "../lib/api";

export default function Header() {
  const [authed, setAuthed] = useState(!!getToken());
  const [role, setRole] = useState(getRole());
  const location = useLocation();
  const navigate = useNavigate();

  const inLogin = location.pathname.endsWith("/login"); // cubre /login y /v2/login

  useEffect(() => {
    const sync = () => {
      setAuthed(!!getToken());
      setRole(getRole());
    };
    const off = onAuthChange(sync);
    sync();
    return () => {
      try {
        off && off();
      } catch {
        /* no-op */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const logout = () => {
    clearToken();
    setAuthed(false);
    setRole("");
    navigate("/login", { replace: true });
  };

  const showLogin = !authed && !inLogin;

  return (
    <header className="trn-header">
      <div className="trn-header__inner container">
        <Link to="/dashboard" className="trn-brand" aria-label="Home">
          <img
            src="/v2/logo.png"
            alt="Logo"
            height={28}
            onError={(e) => {
              e.currentTarget.src = "/logo.png";
            }}
          />
          <span className="trn-brand__title">Total Repair Now CRM</span>
        </Link>

        <nav className="trn-nav" aria-label="Main">
          {authed ? (
            <>
              <NavLink to="/dashboard" className="trn-nav__link">
                Dashboard
              </NavLink>
              <NavLink to="/clients" className="trn-nav__link">
                Clients
              </NavLink>
              <NavLink to="/services" className="trn-nav__link">
                Services
              </NavLink>
              <NavLink to="/users" className="trn-nav__link">
                Users
              </NavLink>
              <button type="button" className="btn" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            showLogin && (
              <Link className="btn btn--primary" to="/login">
                Login
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
