// src/pages/Login.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@totalrepairnow.com");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      // redirige cuando ya hay token (p.ej. después de un login OK)
      navigate("/clients", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const ok = await login(email.trim(), password);
      if (ok) navigate("/clients", { replace: true });
    } catch (e2) {
      setErr(String(e2?.message || "Login failed"));
    }
  }

  return (
    <div className="container">
      <h1>Login</h1>
      {err && (
        <div style={{ background: "#fce2e2", padding: 12, borderRadius: 6, marginBottom: 12 }}>
          {err}
        </div>
      )}
      <form onSubmit={onSubmit}>
        <div>
          <label>Email&nbsp;</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
          <label style={{ marginLeft: 10 }}>Password&nbsp;</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" style={{ marginLeft: 10 }}>Entrar</button>
        </div>
      </form>
    </div>
  );
}
