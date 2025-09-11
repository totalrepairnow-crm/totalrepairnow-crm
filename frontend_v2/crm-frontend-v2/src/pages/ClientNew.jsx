// src/pages/ClientNew.jsx
import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createClient, isAdminFromToken } from "../lib/api";

export default function ClientNew() {
  const navigate = useNavigate();
  const isAdmin = isAdminFromToken();

  // Campos alineados a Edit Client (mismos nombres/orden)
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");

  const [address_line1, setAddress1] = useState("");
  const [address_line2, setAddress2] = useState("");
  const [city, setCity]               = useState("");
  const [state, setState]             = useState("");
  const [postal_code, setPostal]      = useState("");
  const [country, setCountry]         = useState("");

  const [warranty_company, setWarranty] = useState("");
  const [lead_source, setLeadSource]    = useState("");
  const [referred_by, setReferredBy]    = useState("");

  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const fullName = useMemo(() => {
    const name = [first_name, last_name].filter(Boolean).join(" ").trim();
    return name || email || "-";
  }, [first_name, last_name, email]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      const payload = {
        first_name,
        last_name,
        email,
        phone,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        warranty_company,
        lead_source,
        referred_by,
        notes,
      };

      const res = await createClient(payload);
      if (res?.id) {
        navigate(`/clients/${res.id}`);
      } else {
        navigate("/clients");
      }
    } catch (ex) {
      console.error("CREATE /clients error:", ex);
      setErr(ex?.message || "Error creating client");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container">
      {/* Header idéntico a Edit (solo cambia el título) */}
      <div className="page-header">
        <div>
          <h1>New Client</h1>
          <p className="muted">Create a new customer and save all their details.</p>
        </div>
        <div className="actions">
          <Link className="btn" to="/clients">Back</Link>
        </div>
      </div>

      {err && <div className="alert error" style={{ marginBottom: 12 }}>{err}</div>}

      <div className="card">
        <form onSubmit={onSubmit} className="form-grid">
          {/* Nombre */}
          <div className="field">
            <label>First name</label>
            <input
              value={first_name}
              onChange={e=>setFirstName(e.target.value)}
              disabled={!isAdmin}
              placeholder=" "
            />
          </div>
          <div className="field">
            <label>Last name</label>
            <input
              value={last_name}
              onChange={e=>setLastName(e.target.value)}
              disabled={!isAdmin}
              placeholder=" "
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              value={email}
              onChange={e=>setEmail(e.target.value)}
              disabled={!isAdmin}
              placeholder=" "
              type="email"
            />
          </div>
          <div className="field">
            <label>Phone</label>
            <input
              value={phone}
              onChange={e=>setPhone(e.target.value)}
              disabled={!isAdmin}
              placeholder=" "
            />
          </div>

          {/* Dirección */}
          <div className="field" style={{gridColumn:"1 / -1"}}>
            <label>Address line 1</label>
            <input
              value={address_line1}
              onChange={e=>setAddress1(e.target.value)}
              disabled={!isAdmin}
              placeholder=" "
            />
          </div>
          <div className="field" style={{gridColumn:"1 / -1"}}>
            <label>Address line 2</label>
            <input
              value={address_line2}
              onChange={e=>setAddress2(e.target.value)}
              disabled={!isAdmin}
              placeholder=" "
            />
          </div>

          <div className="field">
            <label>City</label>
            <input
              value={city}
              onChange={e=>setCity(e.target.value)}
              disabled={!isAdmin}
              placeholder=" "
            />
          </div>
          <div className="field">
            <label>State</label>
            <input
              value={state}
              onChange={e=>setState(e.target.value)}
              disabled={!isAdmin}
              placeholder=" "
            />
          </div>
          <div className="field">
            <label>Postal code</label>
            <input
              value={postal_code}
              onChange={e=>setPostal(e.target.value)}
              disabled={!isAdmin}
              placeholder=" "
            />
          </div>
          <div className="field">
            <label>Country</label>
            <input
              value={country}
              onChange={e=>setCountry(e.target.value)}
              disabled={!isAdmin}
              placeholder=" "
            />
          </div>

          {/* Extra / fuente de cliente */}
          <div className="field">
            <label>Warranty company</label>
            <input
              value={warranty_company}
              onChange={e=>setWarranty(e.target.value)}
              disabled={!isAdmin}
              placeholder=" "
            />
          </div>
          <div className="field">
            <label>Lead source</label>
            <input
              value={lead_source}
              onChange={e=>setLeadSource(e.target.value)}
              disabled={!isAdmin}
              placeholder=" "
            />
          </div>
          <div className="field">
            <label>Referred by</label>
            <input
              value={referred_by}
              onChange={e=>setReferredBy(e.target.value)}
              disabled={!isAdmin}
              placeholder=" "
            />
          </div>

          {/* Notas y preview */}
          <div className="field" style={{gridColumn:"1 / -1"}}>
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={e=>setNotes(e.target.value)}
              disabled={!isAdmin}
              rows={4}
              placeholder="Optional"
            />
          </div>

          <div className="field" style={{gridColumn:"1 / -1"}}>
            <label>Preview</label>
            <div className="muted">{fullName}</div>
          </div>

          {/* Acciones */}
          <div className="form-actions">
            <Link className="btn" to="/clients">Cancel</Link>
            <button className="btn primary" type="submit" disabled={!isAdmin || saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
