// src/components/NavBar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function doLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const wrap = {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "10px 16px",
    borderBottom: "1px solid #e5e7eb",
    background: "#fff",
    position: "sticky",
    top: 0,
    zIndex: 10,
  };

  const brand = { fontWeight: 600, marginRight: 12 };
  const btn = { marginLeft: "auto" };

  const linkBase = {
    textDecoration: "none",
    padding: "6px 8px",
    borderRadius: 6,
    color: "#111827",
  };
  const activeStyle = {
    background: "#eef2ff",
    color: "#1d4ed8",
    fontWeight: 600,
  };

  const linkStyle = ({ isActive }) =>
    isActive ? { ...linkBase, ...activeStyle } : linkBase;

  return (
    <header style={wrap}>
      <span style={brand}>Total Repair Now CRM</span>

      <NavLink to="/clients" style={linkStyle}>Clients</NavLink>
      <NavLink to="/services" style={linkStyle}>Services</NavLink>
      <NavLink to="/invoices" style={linkStyle}>Invoices</NavLink>

      <button onClick={doLogout} style={btn}>Logout</button>
    </header>
  );
}
