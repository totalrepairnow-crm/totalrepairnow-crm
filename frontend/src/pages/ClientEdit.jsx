// src/pages/ClientEdit.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getRole, getClient, updateClient } from "../lib/api";

function safe(v){ return v ?? ""; }

export default function ClientEdit(){
  const { id } = useParams();
  const nav = useNavigate();
  const isAdmin = getRole() === "admin";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone_mobile, setPhoneMobile] = useState("");
  const [phone_home, setPhoneHome]     = useState("");

  const [address_line1, setAddress1] = useState("");
  const [address_line2, setAddress2] = useState("");
  const [city, setCity]             = useState("");
  const [state, setState]           = useState("");
  const [postal_code, setPostal]    = useState("");
  const [country, setCountry]       = useState("");

  const [warranty_company, setWarranty] = useState("");
  const [lead_source, setLeadSource]    = useState("");
  const [referred_by, setReferredBy]    = useState("");

  useEffect(()=>{
    let alive = true;
    (async ()=>{
      setErr("");
      setLoading(true);
      try{
        const c = await getClient(id);
        if(!alive) return;
        setFirstName(safe(c.first_name));
        setLastName(safe(c.last_name));
        setEmail(safe(c.email));
        setPhoneMobile(safe(c.phone_mobile || c.phone));
        setPhoneHome(safe(c.phone_home));

        setAddress1(safe(c.address_line1));
        setAddress2(safe(c.address_line2));
        setCity(safe(c.city));
        setState(safe(c.state));
        setPostal(safe(c.postal_code));
        setCountry(safe(c.country));

        setWarranty(safe(c.warranty_company));
        setLeadSource(safe(c.lead_source));
        setReferredBy(safe(c.referred_by));
      }catch(e){
        if(!alive) return;
        setErr(e?.message || "Failed to load client.");
      }finally{
        if(alive) setLoading(false);
      }
    })();
    return ()=>{ alive = false; };
  },[id]);

  async function onSubmit(e){
    e.preventDefault();
    if(!isAdmin){
      setErr("You don't have permission to edit this client.");
      return;
    }
    setErr("");
    setSaving(true);
    try{
      const payload = {
        first_name, last_name, email,
        phone_mobile, phone_home,
        address_line1, address_line2, city, state, postal_code, country,
        warranty_company, lead_source, referred_by,
      };
      await updateClient(id, payload);
      nav(`/clients/${id}`, { replace:true });
    }catch(e){
      setErr(e?.message || "Failed to update client.");
    }finally{
      setSaving(false);
    }
  }

  const fullName = `${first_name} ${last_name}`.trim() || "(no name)";

  return (
    <div className="container">
      <div className="page-header">
        <h1>Edit Client #{id}</h1>
        <div className="spacer" />
        <Link className="btn" to={`/clients/${id}`}>View</Link>
        <Link className="btn" to="/clients">← Back</Link>
      </div>

      {!isAdmin && (
        <div className="alert">Only administrators can edit client records.</div>
      )}
      {err && <div className="alert">{err}</div>}

      {loading ? (
        <div className="form-card">Loading…</div>
      ) : (
        <form className="form-card" onSubmit={onSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>First name</label>
              <input value={first_name} onChange={e=>setFirstName(e.target.value)} disabled={!isAdmin} />
            </div>
            <div className="field">
              <label>Last name</label>
              <input value={last_name} onChange={e=>setLastName(e.target.value)} disabled={!isAdmin} />
            </div>

            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} disabled={!isAdmin} />
            </div>
            <div className="field">
              <label>Phone (mobile)</label>
              <input value={phone_mobile} onChange={e=>setPhoneMobile(e.target.value)} disabled={!isAdmin} />
            </div>
            <div className="field">
              <label>Phone (home)</label>
              <input value={phone_home} onChange={e=>setPhoneHome(e.target.value)} disabled={!isAdmin} />
            </div>

            <div className="field" style={{gridColumn:"1 / -1"}}>
              <label>Address line 1</label>
              <input value={address_line1} onChange={e=>setAddress1(e.target.value)} disabled={!isAdmin} />
            </div>
            <div className="field" style={{gridColumn:"1 / -1"}}>
              <label>Address line 2</label>
              <input value={address_line2} onChange={e=>setAddress2(e.target.value)} disabled={!isAdmin} />
            </div>

            <div className="field">
              <label>City</label>
              <input value={city} onChange={e=>setCity(e.target.value)} disabled={!isAdmin} />
            </div>
            <div className="field">
              <label>State</label>
              <input value={state} onChange={e=>setState(e.target.value)} disabled={!isAdmin} />
            </div>
            <div className="field">
              <label>Postal code</label>
              <input value={postal_code} onChange={e=>setPostal(e.target.value)} disabled={!isAdmin} />
            </div>
            <div className="field">
              <label>Country</label>
              <input value={country} onChange={e=>setCountry(e.target.value)} disabled={!isAdmin} />
            </div>

            <div className="field">
              <label>Warranty company</label>
              <input value={warranty_company} onChange={e=>setWarranty(e.target.value)} disabled={!isAdmin} />
            </div>
            <div className="field">
              <label>Lead source</label>
              <input value={lead_source} onChange={e=>setLeadSource(e.target.value)} disabled={!isAdmin} />
            </div>
            <div className="field">
              <label>Referred by</label>
              <input value={referred_by} onChange={e=>setReferredBy(e.target.value)} disabled={!isAdmin} />
            </div>

            <div className="field" style={{gridColumn:"1 / -1"}}>
              <label>Preview</label>
              <div className="muted">{fullName}</div>
            </div>
          </div>

          <div className="form-actions">
            <Link className="btn" to={`/clients/${id}`}>Cancel</Link>
            <button className="btn primary" type="submit" disabled={!isAdmin || saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
