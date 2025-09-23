// src/pages/ServiceNew.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { listClients, createService, isAdminFromToken } from "../lib/api";

function displayClientName(c = {}) {
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  return name || c.company || c.email || `#${c.id}`;
}
const money = (n) => (Number(n || 0)).toFixed(2);

export default function ServiceNew() {
  const navigate = useNavigate();
  const { id: clientIdFromRoute } = useParams();
  const [sp] = useSearchParams();

  const initialClientId = clientIdFromRoute || sp.get("client_id") || "";
  const clientLocked = !!initialClientId;

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [client_id, setClientId] = useState(String(initialClientId || ""));
  const isAdmin = isAdminFromToken();

  // Varias líneas (cada línea => 1 registro en "services")
  const [rows, setRows] = useState([
    { description: "Water heater", quantity: 1, unit_price: 0, status: "scheduled" },
  ]);
  const [discount, setDiscount] = useState(0); // monto absoluto

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await listClients({ page: 1, limit: 1000 });
        if (mounted) setClients(resp?.items || []);
      } catch (e) {
        if (mounted) setError(e?.message || "Failed to load clients");
      } finally {
        if (mounted) setLoadingClients(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const subtotal = useMemo(
    () => rows.reduce((acc, r) => acc + (Number(r.quantity || 0) * Number(r.unit_price || 0)), 0),
    [rows]
  );
  const grandTotal = useMemo(
    () => Math.max(0, subtotal - Number(discount || 0)),
    [subtotal, discount]
  );

  function updateRow(i, patch) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, { description: "", quantity: 1, unit_price: 0, status: "scheduled" }]);
  }
  function removeRow(i) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Validaciones
    const cid = Number(client_id);
    if (!cid) {
      setError("Client is required.");
      return;
    }
    const clean = rows
      .map((r) => ({
        description: String(r.description || "").trim(),
        quantity: Number(r.quantity || 0),
        unit_price: Number(r.unit_price || 0),
        status: r.status || "scheduled",
      }))
      .filter((r) => r.description.length > 0);

    if (!clean.length) {
      setError("At least one service line with description is required.");
      return;
    }

    setSaving(true);
    try {
      // Enviamos SIEMPRE en formato batch (backend lo soporta)
      const payload = { client_id: cid, lines: clean };
      const res = await createService(payload);
      // Navegación post-creación
      if (res?.items?.length) {
        // Batch -> llevar a la ficha del cliente (donde se ven todos los WO)
        navigate(`/clients/${cid}`);
      } else if (res?.id) {
        // Single -> detalle del servicio
        navigate(`/services/${res.id}`);
      } else {
        navigate(`/clients/${cid}`);
      }
    } catch (err) {
      setError(err?.message || "Failed to create service(s)");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>New Service{rows.length > 1 ? "s" : ""}</h1>
        <div className="spacer" />
        <Link className="btn" to={client_id ? `/clients/${client_id}` : "/services"}>← Back</Link>
      </div>

      {error && <div className="alert error">{error}</div>}

      <form className="card" onSubmit={handleSubmit}>
        {/* Cliente */}
        <div className="form-grid">
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Client *</label>
            {loadingClients ? (
              <div className="muted">Loading clients…</div>
            ) : clientLocked ? (
              <div className="muted">
                {displayClientName(clients.find((c) => String(c.id) === String(client_id)))}{" "}
                <Link className="btn" to={`/clients/${client_id}`}>View client</Link>
              </div>
            ) : (
              <select
                value={client_id}
                onChange={(e) => setClientId(e.target.value)}
                required
              >
                <option value="">— Select client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {displayClientName(c)} (#{c.id})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Tabla tipo ClientDetail: WO, Service, Qty, Price, Total, Status */}
        <div className="table-wrap" style={{ overflowX: "auto", marginTop: 12 }}>
          <table className="table clean">
            <thead>
              <tr>
                <th style={{ width: 48 }}>#</th>
                <th>Service</th>
                <th style={{ width: 110 }}>Qty</th>
                <th style={{ width: 140 }}>Unit price</th>
                <th style={{ width: 140 }}>Line total</th>
                <th style={{ width: 150 }}>Status</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const lt = Number(r.quantity || 0) * Number(r.unit_price || 0);
                return (
                  <tr key={i}>
                    <td className="muted">{i + 1}</td>
                    <td>
                      <input
                        placeholder="Water heater"
                        value={r.description}
                        onChange={(e) => updateRow(i, { description: e.target.value })}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={r.quantity}
                        onChange={(e) => updateRow(i, { quantity: e.target.value })}
                        style={{ textAlign: "right" }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={r.unit_price}
                        onChange={(e) => updateRow(i, { unit_price: e.target.value })}
                        style={{ textAlign: "right" }}
                      />
                    </td>
                    <td style={{ textAlign: "right" }}>${money(lt)}</td>
                    <td>
                      <select
                        value={r.status || "scheduled"}
                        onChange={(e) => updateRow(i, { status: e.target.value })}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="in_progress">In progress</option>
                        <option value="completed">Completed</option>
                        <option value="canceled">Canceled</option>
                      </select>
                    </td>
                    <td>
                      {rows.length > 1 && (
                        <button
                          type="button"
                          className="btn"
                          onClick={() => removeRow(i)}
                          title="Remove line"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={7}>
                  <button type="button" className="btn" onClick={addRow}>
                    + Add line
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Totales */}
        <div className="form-grid" style={{ marginTop: 16 }}>
          <div className="field" style={{ gridColumn: "1 / -1", textAlign: "right" }}>
            <div className="muted">Subtotal: <b>${money(subtotal)}</b></div>
            <div style={{ marginTop: 6 }}>
              <label style={{ marginRight: 8 }}>Discount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                style={{ width: 140, textAlign: "right" }}
              />
            </div>
            <div className="muted" style={{ marginTop: 6 }}>
              Grand total: <b>${money(grandTotal)}</b>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <Link className="btn" to={client_id ? `/clients/${client_id}` : "/services"}>Cancel</Link>
          <button className="btn primary" type="submit" disabled={!isAdmin || saving}>
            {saving ? "Saving…" : rows.length > 1 ? "Create services" : "Create service"}
          </button>
        </div>
      </form>
    </div>
  );
}
