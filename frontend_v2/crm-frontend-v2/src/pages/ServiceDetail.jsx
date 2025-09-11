// src/pages/ServiceDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getService, deleteService } from '../lib/api';

export default function ServiceDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [svc, setSvc] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setErr('');
        const data = await getService(id);
        if (!cancel) setSvc(data);
      } catch (e) {
        if (!cancel) setErr(e.message || 'Error');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [id]);

  const onDelete = async () => {
    if (!confirm('¿Eliminar este servicio?')) return;
    try {
      await deleteService(id);
      nav('/services');
    } catch (e) {
      alert(e.message || 'Error');
    }
  };

  if (loading) return <div className="page"><div className="toolbar"><h1>Service #{id}</h1></div>Loading…</div>;
  if (err) return <div className="page"><div className="toolbar"><h1>Service #{id}</h1></div><div className="alert">{err}</div></div>;
  if (!svc) return null;

  return (
    <div>
      <div className="toolbar">
        <h1>Service #{svc.id}</h1>
        <div className="toolbar-actions">
          <Link className="btn" to="/services">← Back</Link>
          <button className="btn danger" onClick={onDelete}>Delete</button>
        </div>
      </div>

      <div className="card">
        <div className="grid2">
          <div><b>Name</b><div>{svc.service_name}</div></div>
          <div><b>Status</b><div>{svc.status ?? '-'}</div></div>
          <div><b>Client ID</b><div>{svc.client_id ?? '-'}</div></div>
          <div><b>Created</b><div>{new Date(svc.created_at).toLocaleString()}</div></div>
          <div><b>Qty</b><div>{svc.quantity}</div></div>
          <div><b>Unit Price</b><div>{svc.unit_price}</div></div>
          <div style={{gridColumn:'1 / -1'}}><b>Description</b><div>{svc.description || '—'}</div></div>
          <div><b>Total</b><div style={{fontWeight:600}}>{svc.total}</div></div>
        </div>
      </div>
    </div>
  );
}

