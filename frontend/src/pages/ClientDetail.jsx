// src/pages/ClientDetail.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getClient, listServices, isAdmin, createInvoice } from '../lib/api';

export default function ClientDetail() {
  const { id } = useParams(); // client_id
  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const admin = isAdmin();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [c, svc] = await Promise.all([
          getClient(id),
          listServices({ client_id: id, limit: 100 })
        ]);
        if (!mounted) return;
        setClient(c);
        setServices(svc?.items || svc || []);
      } catch (e) {
        console.error(e);
        alert(e.message || 'Error loading client');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  const toggleSelect = (sid) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid); else next.add(sid);
      return next;
    });
  };

  const allSelected = useMemo(() => {
    if (!services.length) return false;
    return selected.size === services.length;
  }, [selected, services]);

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(services.map(s => s.id)));
    }
  };

  const subtotal = useMemo(() => {
    return services.reduce((acc, s) => acc + Number(s.total || 0), 0);
  }, [services]);

  const invoiceSelected = async () => {
    if (!selected.size) return;
    try {
      const service_ids = Array.from(selected);
      const inv = await createInvoice({ client_id: Number(id), service_ids });
      window.open(`/api/invoices/${inv.id}/pdf`, '_blank');
      setSelected(new Set());
    } catch (e) {
      console.error(e);
      alert(e.message || 'Error creating invoice');
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Client #{id}</h1>
        <div className="spacer" />
        <Link className="btn" to="/clients">← Back</Link>
        <Link className="btn primary" to={`/services/new?client_id=${id}`}>+ New Service</Link>
        {admin && <Link className="btn" to={`/clients/${id}/edit`}>Edit</Link>}
        <button
          className="btn primary"
          onClick={invoiceSelected}
          disabled={!selected.size}
          title={selected.size ? `Facturar ${selected.size} WOs` : 'Selecciona WOs'}
          style={{ marginLeft: 8 }}
        >
          Invoice ({selected.size || 0})
        </button>
      </div>

      {loading && <div className="card">Loading…</div>}

      {!loading && client && (
        <>
          {/* Datos del cliente (minimal) */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div><strong>Name:</strong> {client.first_name} {client.last_name}</div>
            <div><strong>Email:</strong> {client.email || '-'}</div>
            <div><strong>Phone:</strong> {client.phone || '-'}</div>
            <div><strong>Address:</strong> {[client.address_line1, client.address_line2, client.city, client.state, client.postal_code].filter(Boolean).join(', ') || '-'}</div>
          </div>

          {/* Tabla de servicios del cliente */}
          <div className="card">
            <div className="card-title">Services</div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        aria-label="select all"
                      />
                    </th>
                    <th>WO</th>
                    <th>Service</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(s => (
                    <tr key={s.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(s.id)}
                          onChange={() => toggleSelect(s.id)}
                          aria-label={`select ${s.id}`}
                        />
                      </td>
                      <td>{s.id}</td>
                      <td>{s.service_name || s.description || '-'}</td>
                      <td>{Number(s.quantity ?? 0)}</td>
                      <td>${Number(s.unit_price ?? 0).toFixed(2)}</td>
                      <td>${Number(s.total ?? 0).toFixed(2)}</td>
                      <td>{s.status || '-'}</td>
                      <td>
                        <Link className="btn" to={`/services/${s.id}`}>View</Link>
                      </td>
                    </tr>
                  ))}
                  {!services.length && (
                    <tr>
                      <td colSpan={8} className="muted">No services yet.</td>
                    </tr>
                  )}
                </tbody>
                {services.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={5} className="right"><strong>Subtotal:</strong></td>
                      <td colSpan={3}><strong>${subtotal.toFixed(2)}</strong></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
