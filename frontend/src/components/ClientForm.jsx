import React, { useState } from "react";
import { apiFetch } from "../utils/api";

export default function ClientForm({ initial = null, onSaved, submittingText = "Guardando…" }) {
  const [empresa, setEmpresa]   = useState(initial?.empresa || "");
  const [email, setEmail]       = useState(initial?.email || "");
  const [telefono, setTelefono] = useState(initial?.telefono || "");
  const [estado, setEstado]     = useState(initial?.estado || "activo");
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      const body = JSON.stringify({ empresa, email, telefono, estado });
      let res;
      if (initial?.id) {
        res = await apiFetch(`/api/clients/${initial.id}`, { method: "PUT", body });
      } else {
        res = await apiFetch(`/api/clients`, { method: "POST", body });
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      onSaved?.(data);
    } catch (e) {
      console.error(e);
      setErr(e.message || "Error guardando");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="form">
      {err && <div className="alert error">{err}</div>}
      <label className="lbl">Empresa *</label>
      <input className="input" value={empresa} onChange={e=>setEmpresa(e.target.value)} required />

      <label className="lbl">Email</label>
      <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} />

      <label className="lbl">Teléfono</label>
      <input className="input" value={telefono} onChange={e=>setTelefono(e.target.value)} />

      <label className="lbl">Estado</label>
      <select className="input" value={estado} onChange={e=>setEstado(e.target.value)}>
        <option value="activo">activo</option>
        <option value="inactivo">inactivo</option>
      </select>

      <div style={{display:"flex", gap:10, marginTop:12}}>
        <button className="btn" type="submit" disabled={saving}>
          {saving ? submittingText : "Guardar"}
        </button>
      </div>
    </form>
  );
}
// src/components/ClientForm.jsx
import React, { useState, useEffect } from 'react';

export default function ClientForm({ initial = null, onSubmit, saving = false, error = null }) {
  const [form, setForm] = useState({
    empresa: '',
    email: '',
    telefono: '',
    estado: 'activo',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });

  useEffect(() => {
    if (initial) {
      setForm({
        empresa: initial.empresa || '',
        email: initial.email || '',
        telefono: initial.telefono || '',
        estado: initial.estado || 'activo',
        address_line1: initial.address_line1 || '',
        address_line2: initial.address_line2 || '',
        city: initial.city || '',
        state: initial.state || '',
        zip: initial.zip || '',
        country: initial.country || '',
      });
    }
  }, [initial]);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSubmit?.(form);
  };

  return (
    <form className="card" onSubmit={submit} style={{ maxWidth: 800 }}>
      <div className="card-head">
        <h3>{initial ? 'Editar cliente' : 'Nuevo cliente'}</h3>
      </div>

      {error && <div className="pill" style={{ background: 'var(--err)' }}>{String(error)}</div>}

      <div className="grid grid-2">
        <label>
          <span>Empresa *</span>
          <input name="empresa" value={form.empresa} onChange={handle} required />
        </label>

        <label>
          <span>Estado</span>
          <select name="estado" value={form.estado} onChange={handle}>
            <option value="activo">activo</option>
            <option value="inactivo">inactivo</option>
          </select>
        </label>

        <label>
          <span>Email</span>
          <input type="email" name="email" value={form.email} onChange={handle} />
        </label>

        <label>
          <span>Teléfono</span>
          <input name="telefono" value={form.telefono} onChange={handle} />
        </label>
      </div>

      <h4 style={{ marginTop: 16 }}>Dirección</h4>
      <div className="grid grid-2">
        <label>
          <span>Address line 1</span>
          <input name="address_line1" value={form.address_line1} onChange={handle} />
        </label>
        <label>
          <span>Address line 2</span>
          <input name="address_line2" value={form.address_line2} onChange={handle} />
        </label>
        <label>
          <span>Ciudad</span>
          <input name="city" value={form.city} onChange={handle} />
        </label>
        <label>
          <span>Estado/Provincia</span>
          <input name="state" value={form.state} onChange={handle} />
        </label>
        <label>
          <span>ZIP</span>
          <input name="zip" value={form.zip} onChange={handle} />
        </label>
        <label>
          <span>País</span>
          <input name="country" value={form.country} onChange={handle} />
        </label>
      </div>

      <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        <a href="/" className="btn">Cancelar</a>
      </div>
    </form>
  );
}
