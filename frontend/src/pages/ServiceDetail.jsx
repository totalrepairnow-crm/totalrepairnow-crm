import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import * as API from "../lib/api";
import EmailInvoiceButton from "../components/EmailInvoiceButton";

const INVOICEABLE = new Set(["pending", "approved", "ready", "done", "scheduled"]);
function canInvoice(status) {
  if (!status) return true;
  return INVOICEABLE.has(String(status).toLowerCase());
}

export default function ServiceDetail() {
  const { id } = useParams();
  const [svc, setSvc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Campos para factura
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [creating, setCreating] = useState(false);
  const [invoice, setInvoice] = useState(null); // { id, invoice_no }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const data = await API.getService(id);
        if (!alive) return;
        setSvc(data);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Error loading service");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const canCreate = useMemo(() => {
    if (!svc) return false;
    return canInvoice(svc.status);
  }, [svc]);

  async function handleCreateInvoice() {
    if (!svc) return;
    setErr("");
    setCreating(true);
    try {
      const payload = {
        client_id: svc.client_id || svc.clientId,
        service_ids: [Number(svc.id)],
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
      };
      const data = await API.createInvoiceFromServices(payload);
      // Esperado: { id, invoice_no }
      setInvoice(data);
    } catch (e) {
      setErr(e?.message || "Failed to create invoice");
    } finally {
      setCreating(false);
    }
  }

  async function handleOpenPdf() {
    if (!invoice?.id) return;
    try {
      await API.openInvoicePDF(invoice.id);
    } catch (e) {
      alert(e?.message || "Failed to open PDF");
    }
  }

  if (loading) {
    return (
      <div className="container py-6">
        <h1>Service</h1>
        <p>Loading…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="container py-6">
        <h1>Service</h1>
        <div className="alert error">{err}</div>
        <p><Link to="/services" className="btn">← Back to Services</Link></p>
      </div>
    );
  }

  if (!svc) {
    return (
      <div className="container py-6">
        <h1>Service</h1>
        <div className="alert">Service not found</div>
        <p><Link to="/services" className="btn">← Back to Services</Link></p>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1>Service #{svc.id}</h1>
        <div>
          <Link to="/services" className="btn">← Back</Link>
          {" "}
          <Link to={`/services/${svc.id}/edit`} className="btn primary">Edit</Link>
        </div>
      </div>

      <div className="card p-4" style={{ marginTop: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Client ID" value={svc.client_id ?? svc.clientId} />
          <Field label="Status" value={svc.status || "-"} />
          <Field label="Service" value={svc.service_name || svc.serviceName || svc.description || "-"} />
          <Field label="Description" value={svc.description || "-"} />
          <Field label="Quantity" value={svc.quantity ?? 1} />
          <Field label="Unit price" value={fmtMoney(svc.unit_price ?? 0)} />
          <Field label="Total" value={fmtMoney(svc.total ?? (Number(svc.quantity||1)*Number(svc.unit_price||0)))} />
          <Field label="Created at" value={fmtDate(svc.created_at || svc.createdAt)} />
        </div>
      </div>

      <div className="card p-4" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Invoice</h2>

        {!invoice && (
          <>
            {!canCreate && (
              <div className="alert" style={{ marginBottom: 12 }}>
                This service status is not invoiceable.
              </div>
            )}

            <div style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
              <div className="field" style={{ minWidth: 160 }}>
                <span>Discount</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
              <div className="field" style={{ minWidth: 160 }}>
                <span>Tax (%)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                />
              </div>

              <button
                className="btn primary"
                onClick={handleCreateInvoice}
                disabled={!canCreate || creating}
              >
                {creating ? "Creating…" : "Create invoice from this service"}
              </button>
            </div>
          </>
        )}

        {invoice && (
          <>
            <div className="alert success" style={{ marginBottom: 12 }}>
              Invoice created: <strong>#{invoice.invoice_no || invoice.id}</strong>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn" onClick={handleOpenPdf}>View PDF</button>

              <EmailInvoiceButton
                invoiceId={invoice.id}
                defaultSubject={`Invoice ${invoice.invoice_no || invoice.id}`}
                defaultMessage="Please find your invoice attached."
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div>{value ?? "-"}</div>
    </label>
  );
}

function fmtMoney(n) {
  const v = Number(n || 0);
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
  } catch {
    return `$${v.toFixed(2)}`;
  }
}

function fmtDate(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
}
