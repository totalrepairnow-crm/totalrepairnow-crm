import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClient } from '../lib/api';

export default function ClientDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const data = await getClient(id);
        if (!live) return;
        setItem(data);
      } catch (e) {
        console.error('Client detail error', e);
        if (live) setErr('Could not load client');
      }
    })();
    return () => { live = false; };
  }, [id]);

  if (err) return <div className="alert error">{err}</div>;
  if (!item) return <div>Loading...</div>;

  const name = [item.first_name, item.last_name].filter(Boolean).join(' ') || '(no name)';

  return (
    <div>
      <div className="toolbar">
        <h1>Client</h1>
        <div className="toolbar-actions">
          <Link to="/clients" className="btn btn-ghost">Back to list</Link>
        </div>
      </div>

      <div className="card">
        <div className="card-row"><strong>Name:</strong> {name}</div>
        <div className="card-row"><strong>Email:</strong> {item.email || '-'}</div>
        <div className="card-row"><strong>Phone:</strong> {item.phone || '-'}</div>
        <div className="card-row"><strong>Created:</strong> {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</div>
      </div>
    </div>
  );
}

