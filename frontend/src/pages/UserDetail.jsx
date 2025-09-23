import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getUser, isAdminFromToken, fullName } from "../lib/api";

export default function UserDetail() {
  const { id } = useParams();
  const [u, setU] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setU(await getUser(id));
      } catch {
        setErr("Not found");
      }
    })();
  }, [id]);

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
          <h1 className="page-title">User #{u.id}</h1>
          <div className="subtitle">{fullName(u)}</div>
        </div>
        <div className="toolbar">
          <Link className="btn" to="/users">Back</Link>
          {canAdmin && <Link className="btn primary" to={`/users/${u.id}/edit`}>Edit</Link>}
        </div>
      </div>

      <div className="card">
        <div className="detail-grid">
          <div><div className="label">Name</div><div className="value">{fullName(u)}</div></div>
          <div><div className="label">Email</div><div className="value">{u.email || "-"}</div></div>
          <div><div className="label">Phone</div><div className="value">{u.phone || "-"}</div></div>
          <div><div className="label">Role</div><div className="value">{u.role || "-"}</div></div>
          <div><div className="label">Created</div><div className="value">{u.created_at || "-"}</div></div>
          <div><div className="label">Updated</div><div className="value">{u.updated_at || "-"}</div></div>
        </div>
      </div>
    </div>
  );
}
