// src/pages/ClientView.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';

function money(n) {
  return Number.isFinite(+n) ? (+n).toFixed(2) : (n ?? '—');
}

export default function ClientView() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function loadClient() {
    try {
      const data = await apiFetch(`/api/clients/${id}`);
      setClient(data);
    } catch (_e) {
      setErr('No se pudo cargar el cliente');
    }
  }

  async function loadServices() {
    try {
      const data = await apiFetch(`/api/clients/${id}/services`);
      setServices(Array.isArray(data?.items) ? data.items : []);
    } catch (_e) {
      setServices([]);
    }
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadClient(), loadServices()]).finally(() => setLoading(false));
    // Si tu ESLint pide deps exhaustivas, podrías mover loadClient/loadServices dentro del useEffect
  }, [id]);

  if (loading)
    return (
      <div className="container page-white">
        <div className="skel" />
      </div>
    );

  if (err)
    return (
      <div className="container page-white">
        <div className="alert error">{err}</div>
      </div>
    );

  if (!client)
    return (
      <div className="container page-white">
        <div className="alert">Cliente no encontrado</div>
      </div>
    );

  const totalGeneral = services.reduce(
    (acc, s) => acc + Number(s.total_amount ?? (+s.quantity || 0) * (+s.unit_price || 0)),
    0
  );

  return (
    <div className="container page-white">
      <div className="dash-head">
        <h1 className="dash-title">Ver Cliente</h1>
        <div className="spacer" />
        <Link className="btn" to={`/clients/${id}`}>
          Ir a Detalle
        </Link>
      </div>

      <section className="card client-card">
        <div className="card-head">
          <h3>Datos del cliente</h3>
        </div>
        <div className="table">
          <div className="tr">
            <div>ID</div>
            <div>{client.id}</div>
          </div>
          <div className="tr">
            <div>Empresa</div>
            <div>{client.empresa || '—'}</div>
          </div>
          <div className="tr">
            <div>Email</div>
            <div>{client.email || '—'}</div>
          </div>
          <div className="tr">
            <div>Teléfono</div>
            <div>{client.telefono || '—'}</div>
          </div>
          <div className="tr">
            <div>Estado</div>
            <div>{client.estado || '—'}</div>
          </div>
          <div className="tr">
            <div>Creado</div>
            <div>{client.created_at || '—'}</div>
          </div>
          <div className="tr">
            <div>Actualizado</div>
            <div>{client.updated_at || '—'}</div>
          </div>
        </div>
      </section>

      <section className="card services-card" style={{ marginTop: 16 }}>
        <div className="card-head">
          <h3>Servicios actuales</h3>
        </div>
        {services.length === 0 ? (
          <div className="empty">Sin servicios</div>
        ) : (
          <div className="table">
            <div className="tr th">
              <div>Servicio</div>
              <div>Cant.</div>
              <div>Precio</div>
              <div>Total</div>
              <div>Descripción</div>
            </div>
            {services.map((s) => (
              <div className="tr" key={s.id || `${s.service_name}-${s.created_at}`}>
                <div>{s.service_name || s.titulo || '—'}</div>
                <div>{s.quantity ?? '—'}</div>
                <div>${money(s.unit_price)}</div>
                <div>${money(s.total_amount ?? (+s.quantity || 0) * (+s.unit_price || 0))}</div>
                <div>{s.description || '—'}</div>
              </div>
            ))}
            {services.length > 0 && (
              <div className="tr">
                <div style={{ gridColumn: '1 / span 4', textAlign: 'right', fontWeight: 700 }}>
                  Total general
                </div>
                <div style={{ fontWeight: 800 }}>${money(totalGeneral)}</div>
                <div />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
