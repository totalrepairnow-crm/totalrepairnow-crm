import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

export default function ClientServices({ clientId }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    titulo: "",
    monto: "",
    estado: "abierto",
    tecnico: "",
    descripcion: ""
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await apiFetch(`/clients/${clientId}/services`);
      setServices(r.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function create(e) {
    e.preventDefault();
    setError(null);
    try {
      const body = {
        titulo: (form.titulo || "").trim(),
        monto: Number(form.monto || 0),
        estado: form.estado || "abierto",
        tecnico: (form.tecnico || "").trim() || null,
        descripcion: (form.descripcion || "").trim() || null
      };
      const r = await fetch(`/api/clients/${clientId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!r.ok) {
        let be = null;
        try { be = await r.json(); } catch {}
        throw new Error(be?.error || `HTTP ${r.status}`);
      }
      setForm({ titulo: "", monto: "", estado: "abierto", tecnico: "", descripcion: "" });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, [clientId]);

  return (
    <div className="services">
      <h3>Servicios</h3>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? <p>Cargando...</p> : (
        <>
          <ul>
            {services.map(s => (
              <li key={s.id}>
                <b>{s.titulo}</b> — ${s.monto} — {s.estado} — {s.tecnico || "Sin técnico"}
              </li>
            ))}
          </ul>
          <form onSubmit={create}>
            <input
              type="text"
              placeholder="Título del servicio"
              value={form.titulo}
              onChange={e => setForm({ ...form, titulo: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Monto"
              value={form.monto}
              onChange={e => setForm({ ...form, monto: e.target.value })}
            />
            <select
              value={form.estado}
              onChange={e => setForm({ ...form, estado: e.target.value })}
            >
              <option value="abierto">Abierto</option>
              <option value="cerrado">Cerrado</option>
            </select>
            <input
              type="text"
              placeholder="Técnico"
              value={form.tecnico}
              onChange={e => setForm({ ...form, tecnico: e.target.value })}
            />
            <textarea
              placeholder="Descripción"
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
            />
            <button type="submit">Agregar servicio</button>
          </form>
        </>
      )}
    </div>
  );
}
