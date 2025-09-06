import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createClient } from '../lib/api';

export default function ClientNew() {
  const nav = useNavigate();
  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', phone:'' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type:'', text:'' });

  async function onSubmit(e){
    e.preventDefault();
    setMsg({type:'', text:''});
    setSubmitting(true);
    try {
      const created = await createClient(form);
      setMsg({type:'success', text:'Client created'});
      if (created?.id) {
        nav(`/clients/${created.id}`, { replace:true });
      } else {
        nav('/clients', { replace:true });
      }
    } catch (err) {
      console.error(err);
      setMsg({type:'error', text: err.message || 'Error creating client'});
    } finally {
      setSubmitting(false);
    }
  }

  function setField(k, v){ setForm(prev => ({...prev, [k]: v})); }

  return (
    <div>
      <div className="toolbar">
        <h1>New Client</h1>
        <div className="toolbar-actions">
          <Link to="/clients" className="btn btn-ghost">Cancel</Link>
        </div>
      </div>

      {msg.text && <div className={`alert ${msg.type}`}>{msg.text}</div>}

      <form className="form" onSubmit={onSubmit}>
        <div className="grid">
          <label>First name
            <input className="input" value={form.first_name} onChange={e=>setField('first_name', e.target.value)} />
          </label>
          <label>Last name
            <input className="input" value={form.last_name} onChange={e=>setField('last_name', e.target.value)} />
          </label>
          <label>Email
            <input type="email" className="input" value={form.email} onChange={e=>setField('email', e.target.value)} />
          </label>
          <label>Phone
            <input className="input" value={form.phone} onChange={e=>setField('phone', e.target.value)} />
          </label>
        </div>
        <div style={{marginTop:16}}>
          <button className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

