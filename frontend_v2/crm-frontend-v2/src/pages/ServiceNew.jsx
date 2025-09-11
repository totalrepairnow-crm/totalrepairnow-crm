// src/pages/ServiceNew.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createService } from "../lib/api";

function num(v, d=0){ const n = Number(v); return Number.isFinite(n) ? n : d; }

export default function ServiceNew(){
  const nav = useNavigate();
  const [params] = useSearchParams();
  const initialClientId = params.get("client_id") || "";

  const [client_id, setClientId] = useState(initialClientId);
  const [service_name, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit_price, setUnitPrice] = useState(0);
  const total = num(quantity)*num(unit_price);

  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(()=>{ if(initialClientId) setClientId(initialClientId); },[initialClientId]);

  async function onSubmit(e){
    e.preventDefault();
    setErr("");
    setSaving(true);
    try{
      const payload = {
        client_id: client_id ? Number(client_id) : null,
        service_name, description,
        quantity: Number(quantity),
        unit_price: Number(unit_price)
      };
      const created = await createService(payload);
      const id = created?.id;
      if(id) nav(`/services/${id}`, { replace:true });
      else nav("/services", { replace:true });
    }catch(e){
      setErr(e?.message || "Failed to create service.");
    }finally{
      setSaving(false);
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>New Service</h1>
        <div className="spacer" />
        <Link className="btn" to="/services">← Back</Link>
      </div>

      {err && <div className="alert">{err}</div>}

      <form className="form-card" onSubmit={onSubmit}>
        <div className="form-grid">
          <div className="field">
            <label>Client ID (optional)</label>
            <input type="number" value={client_id} onChange={(e)=>setClientId(e.target.value)} placeholder="e.g. 11" />
            <div className="hint">If you came from a client, this field is pre-filled.</div>
          </div>

          <div className="field">
            <label>Service name</label>
            <input value={service_name} onChange={(e)=>setServiceName(e.target.value)} placeholder="e.g. Water heater replacement" required />
          </div>

          <div className="field">
            <label>Quantity</label>
            <input type="number" step="1" min="1" value={quantity} onChange={(e)=>setQuantity(e.target.value)} required />
          </div>

          <div className="field">
            <label>Unit price</label>
            <input type="number" step="0.01" min="0" value={unit_price} onChange={(e)=>setUnitPrice(e.target.value)} required />
          </div>

          <div className="field" style={{gridColumn:"1 / -1"}}>
            <label>Description</label>
            <textarea value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Add notes or details…" />
          </div>
        </div>

        <div className="form-actions">
          <div className="muted" style={{marginRight:"auto"}}>Total: <b>${total.toFixed(2)}</b></div>
          <Link className="btn" to="/services">Cancel</Link>
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Create service"}
          </button>
        </div>
      </form>
    </div>
  );
}

