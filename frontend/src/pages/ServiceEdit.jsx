// src/pages/ServiceEdit.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getService, updateService, isAdminFromToken } from "../lib/api";

const money = (n) => (Number(n || 0)).toFixed(2);

export default function ServiceEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAdmin = isAdminFromToken();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [client_id, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit_price, setUnitPrice] = useState(0);
  const [status, setStatus] = useState("scheduled");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await getService(id);
        if (!mounted) return;
        setClientId(s.client_id);
        setDescription(s.description || s.service_name || "");
        setQuantity(Number(s.quantity || 1));
        setUnitPrice(Number(s.unit_price || 0));
        setStatus(s.status || "scheduled");
      } catch (e) {
        if (mounted) setError(e?.message || "Failed to load service");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const lineTotal = useMemo(
    () => Number(quantity || 0) * Number(unit_price || 0),
    [quantity, unit_price]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      // No enviamos "total", DB lo recalcula
      const payload = {
        description: description.trim(),
        quantity: Number(quantity || 0),
        unit_price: Number(unit_price || 0),
        status,
      };
      await updateService(id, payload);
      navigate(`/services/${id}`);
    } catch (err) {
      setError(err?.message || "Failed to update service");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="container"><div className="muted">Loading…</div></div>;

  return (
    <div className="container">
      <div className="page-header">
        <h1>WO #{id} · Edit</h1>
        <div className="spacer" />
        <Link className="btn" to={client_id ? `/clients/${client_id}` : "/services"}>← Back</Link>
      </div>

      {error && <div className="alert error">{error}</div>}

      <form className="card" onSubmit={handleSubmit}>
        {/* Resumen cliente */}
        {client_id && (
          <div className="field" style={{ marginBottom: 8 }}>
            <label>Client</label>
            <div className="muted">
              <Link to={`/clients/${client_id}`}>#{client_id}</Link>
            </div>
          </div>
        )}

        {/* Tabla simple de una línea */}
        <div className="table-wrap" style={{ overflowX: "auto", marginTop: 12 }}>
          <table className="table clean">
            <thead>
              <tr>
                <th>Service</th>
                <th style={{ width: 110 }}>Qty</th>
                <th style={{ width: 140 }}>Unit price</th>
                <th style={{ width: 140 }}>Line total</th>
                <th style={{ width: 150 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input
                    placeholder="Water heater"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    style={{ textAlign: "right" }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={unit_price}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    style={{ textAlign: "right" }}
                  />
                </td>
                <td style={{ textAlign: "right" }}>
                  ${money(lineTotal)}
                </td>
                <td>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="form-actions">
          <Link className="btn" to={`/services/${id}`}>Cancel</Link>
          <button className="btn primary" type="submit" disabled={!isAdmin || saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
