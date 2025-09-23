import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getUser, updateUser, deleteUser, isAdminFromToken, fullName } from "../lib/api";

export default function UserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [u, setU] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getUser(id);
        setU(data);
      } catch {
        setErr("Not found");
      }
    })();
  }, [id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!u) return;
    setSaving(true);
    setErr("");
    try {
      const payload = {
        first_name: u.first_name || null,
        last_name:  u.last_name  || null,
        email:      u.email      || null,
        phone:      u.phone      || null,
        role:       u.role       || "client",
      };
      const updated = await updateUser(id, payload);
      setU(updated);
    } catch {
      setErr("Error saving");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Delete this user?")) return;
    try {
      await deleteUser(id);
      navigate("/users");
    } catch {
      alert("Delete failed");
    }
  };

  if (!u) {
    return (
      <div className="container">
        <div className="card">Loading…{err && <div className="error">{err}</div>}</div>
      </div>
    );
  }

  const canAdmin = isAdminFromToken();

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit user #{u.id}</h1>
          <div className="subtitle">{fullName(u)}</div>
        </div>
        <div className="toolbar">
          <Link className="btn" to={`/users/${u.id}`}>Back</Link>
          {canAdmin && <button className="btn danger" onClick={onDelete}>Delete</button>}
        </div>
      </div>

      <div className="card">
        {err && <div className="error">{err}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-grid">
            <label>First name
              <input value={u.first_name || ""} onChange={e => setU({ ...u, first_name: e.target.value })} />
            </label>
            <label>Last name
              <input value={u.last_name || ""} onChange={e => setU({ ...u, last_name: e.target.value })} />
            </label>
            <label>Email
              <input type="email" value={u.email || ""} onChange={e => setU({ ...u, email: e.target.value })} />
            </label>
            <label>Phone
              <input value={u.phone || ""} onChange={e => setU({ ...u, phone: e.target.value })} />
            </label>
            <label>Role
              <select value={u.role || "client"} onChange={e => setU({ ...u, role: e.target.value })}>
                <option value="client">client</option>
                <option value="tech">tech</option>
                <option value="admin">admin</option>
              </select>
            </label>
          </div>

          <div className="actions" style={{ marginTop: 12 }}>
            <button className="btn primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
            <Link className="btn" to={`/users/${u.id}`}>Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
