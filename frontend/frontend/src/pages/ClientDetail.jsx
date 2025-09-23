// src/pages/ClientDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as API from "../lib/api";
import EmailInvoiceButton from "../components/EmailInvoiceButton";

export default function ClientDetail() {
  const { id } = useParams();
  const clientId = Number(id);

  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [draft, setDraft] = useState(null); // preview totals
  const [creating, setCreating] = useState(false);
  const [invoice, setInvoice] = useState(null); // { id, invoice_no }
  const [error, setError] = useState("");

  const clientEmail = client?.email || "";

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [clientId]);

  async function load() {
    setError("");
    setInvoice(null);
    setDraft(null);
    setSelectedIds([]);
    try {
      const c = await API.getClient(clientId);
      setClient(c);
    } catch (e) {
      setError(String(e?.message || "Client not found"));
    }
    try {
      const sv = await API.listClientServices(clientId);
      setServices(Array.isArray(sv) ? sv : []);
    } catch (e) {
      // si tu backend devuelve otra forma, no rompemos la UI
      console.warn("listClientServices error:", e);
    }
  }

  function toggleService(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const currency = useMemo(() => "USD", []);
  const canInvoice = selectedIds.length > 0;

  async function onDraft() {
    setError("");
    setDraft(null);
    try {
      const data = await API.draftInvoice({
        client_id: clientId,
        service_ids: selectedIds,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        currency,
      });
      setDraft(data || null);
    } catch (e) {
      setError(String(e?.message || "Draft failed"));
    }
  }

  async function onCreate() {
    if (!canInvoice) return;
    setCreating(true);
    setError("");
    try {
      const data = await API.createInvoiceFromServices({
        client_id: clientId,
        service_ids: selectedIds,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
      });
      // Esperado: { id, invoice_no }
      if (!data?.id) throw new Error("No invoice id in response");
      setInvoice({ id: data.id, invoice_no: data.invoice_no });
      setDraft(null);
    } catch (e) {
      setError(String(e?.message || "Create invoice failed"));
    } finally {
      setCreating(false);
    }
  }

  async function onViewPdf() {
    if (!invoice?.id) return;
    try {
      await API.openInvoicePDF(invoice.id);
    } catch (e) {
      alert(String(e?.message || "PDF failed"));
    }
  }

  return (
    <div className="container" style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <Link to="/clients" style={{ textDecoration: "none" }}>← Back to Clients</Link>
      </div>

      <h1 style={{ marginTop: 0 }}>Client detail</h1>

      {error && (
        <div style={{ background: "#ffecec", borderRadius: 6, padding: 12, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {!client ? (
        <div>Loading...</div>
      ) : (
        <>
          <section style={{ marginBottom: 16 }}>
            <div><strong>Name:</strong> {client.name || `${client.first_name || ""} ${client.last_name || ""}`}</div>
            <div><strong>Email:</strong> {client.email || "—"}</div>
            <div><strong>Phone:</strong> {client.phone || client.phone_mobile || client.phone_home || "—"}</div>
          </section>

          <h2 style={{ margin: "12px 0" }}>Client services</h2>
          {services.length === 0 ? (
            <div>No services for this client.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Sel</th>
                    <th style={th}>ID</th>
                    <th style={th}>Name/Desc</th>
                    <th style={th}>Qty</th>
                    <th style={th}>Unit</th>
                    <th style={th}>Total</th>
                    <th style={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => {
                    const id = s.id || s.service_id || s.ID;
                    const checked = selectedIds.includes(id);
                    const qty = Number(s.quantity ?? 1);
                    const unit = Number(s.unit_price ?? 0);
                    const total = Number(s.total ?? qty * unit);
                    const desc = s.description || s.service_name || `Service #${id}`;
                    return (
                      <tr key={id}>
                        <td style={td}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleService(id)}
                          />
                        </td>
                        <td style={td}>{id}</td>
                        <td style={td}>{desc}</td>
                        <td style={td} align="right">{qty}</td>
                        <td style={td} align="right">{unit.toFixed(2)}</td>
                        <td style={td} align="right">{total.toFixed(2)}</td>
                        <td style={td}>{s.status || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
            <label>Discount&nbsp;
              <input
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                style={{ width: 100 }}
              />
            </label>
            <label>Tax (%)&nbsp;
              <input
                type="number"
                step="0.01"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                style={{ width: 100 }}
              />
            </label>

            <button type="button" onClick={onDraft} disabled={!canInvoice}>
              Draft totals
            </button>

            <button type="button" onClick={onCreate} disabled={!canInvoice || creating}>
              {creating ? "Creating..." : "Create invoice"}
            </button>
          </div>

          {draft && (
            <div style={{ marginTop: 12, background: "#f6f9ff", padding: 12, borderRadius: 6 }}>
              <strong>Draft</strong>
              <div>Currency: {draft.currency}</div>
              <div>Subtotal: {Number(draft.subtotal).toFixed(2)}</div>
              <div>Discount: {Number(draft.discount).toFixed(2)}</div>
              <div>Tax (%): {Number(draft.tax).toFixed(2)} — Amount: {Number(draft.tax_amount).toFixed(2)}</div>
              <div><strong>Total: {Number(draft.total).toFixed(2)}</strong></div>
            </div>
          )}

          {invoice && (
            <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div><strong>Invoice:</strong> #{invoice.invoice_no || invoice.id}</div>
              <button type="button" onClick={onViewPdf}>View PDF</button>
              <EmailInvoiceButton
                invoiceId={invoice.id}
                invoiceNo={invoice.invoice_no}
                clientEmail={clientEmail}
                label="Email Invoice"
                className="btn"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

const th = { textAlign: "left", padding: "8px 6px", borderBottom: "1px solid #ddd" };
const td = { padding: "6px 6px", borderBottom: "1px solid #eee" };
