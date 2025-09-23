// src/pages/ServiceDetail.jsx
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getService, createInvoice } from '../lib/api';

export default function ServiceDetail() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const s = await getService(id);
        if (!mounted) return;
        setService(s);
      } catch (e) {
        console.error(e);
        alert(e.message || 'Error loading service');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const invoiceThis = async () => {
    if (!service) return;
    try {
      const inv = await createInvoice({
        client_id: Number(service.client_id),
        service_ids: [Number(service.id)]
      });
      window.open(`/api/invoices/${inv.id}/pdf`, '_blank');
    } catch (e) {
      console.error(e);
      alert(e.message || 'Error creating invoice');
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>WO #{id}</h1>
        <div className="spacer" />
        <Link className="btn" to="/services">← Back</Link>
        {service && (
          <Link className="btn" to={`/clients/${service.client_id}`}>Client</Link>
        )}
        <button className="btn primary" onClick={invoiceThis} disabled={!service}>
          Invoice this WO
        </button>
      </div>

      {loading && <div className="card">Loading…</div>}

      {!loading && service && (
        <div className="card">
          <div className="grid col-2 gap">
            <div>
              <div className="muted">Client ID</div>
              <div>{service.client_id}</div>
            </div>
            <div>
              <div className="muted">Status</div>
              <div>{service.status || '-'}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="muted">Service</div>
              <div>{service.service_name || service.description || '-'}</div>
            </div>
            <div>
              <div className="muted">Qty</div>
              <div>{Number(service.quantity ?? 0)}</div>
            </div>
            <div>
              <div className="muted">Unit price</div>
              <div>${Number(service.unit_price ?? 0).toFixed(2)}</div>
            </div>
            <div>
              <div className="muted">Total</div>
              <div><strong>${Number(service.total ?? 0).toFixed(2)}</strong></div>
            </div>
            <div className="muted" style={{ gridColumn: '1 / -1' }}>
              Created at: {service.created_at ? new Date(service.created_at).toLocaleString() : '-'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
