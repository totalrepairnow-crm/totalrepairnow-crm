import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUser } from "../lib/api";

export default function UserNew() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "", role: "client", password: ""
  });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      const payload = { ...form };
      Object.keys(payload).forEach(k => { if (payload[k] === "") payload[k] = null; });
      const u = await createUser(payload);
      nav(`/users/${u.id}`);
    } catch {
      setErr("Create failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">New user</h1>
        <div className="toolbar"><Link className="btn" to="/users">Back</Link></div>
      </div>

      <div className="card">
        {err && <div className="error">{err}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-grid">
            <label>First name
              <input value={form.first_name || ""} onChange={e => setForm({ ...form, first_name: e.target.value })} />
            </label>
            <label>Last name
              <input value={form.last_name || ""} onChange={e => setForm({ ...form, last_name: e.target.value })} />
            </label>
            <label>Email
              <input type="email" required value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} />
            </label>
            <label>Phone
              <input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label>Role
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="client">client</option>
                <option value="tech">tech</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <label>Password
              <input type="password" required value={form.password || ""} onChange={e => setForm({ ...form, password: e.target.value })} />
            </label>
          </div>

          <div className="actions" style={{ marginTop: 12 }}>
            <button className="btn primary" disabled={saving}>{saving ? "Creating…" : "Create user"}</button>
            <Link className="btn" to="/users">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
