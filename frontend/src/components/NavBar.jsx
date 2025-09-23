// src/components/NavBar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const link = { textDecoration: "none" };
  const btn = { marginLeft: "auto" };

  return (
    <header style={wrap}>
      <span style={brand}>Total Repair Now CRM</span>
      <Link to="/clients" style={link}>Clients</Link>
      <Link to="/services" style={link}>Services</Link>
      <button onClick={doLogout} style={btn}>Logout</button>
    </header>
  );
}
