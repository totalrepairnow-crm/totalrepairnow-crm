import React from "react";
import Modal from "../components/Modal";
import { Input, Button } from "../components/Controls";

export default function Services(){
  const params = new URLSearchParams(typeof window!=="undefined" ? window.location.search : "");
  const clientId = params.get("client") || "";
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [openNew, setOpenNew] = React.useState(false);
  const [form, setForm] = React.useState({ service_name:"", description:"", quantity:1, unit_price:0 });

  const token = localStorage.getItem("token");

  const fetchList = React.useCallback(async ()=>{
    if(!clientId){ setError("Falta client id"); setLoading(false); return; }
    setLoading(true); setError("");
    try{
      const r = await fetch(`/api/clients/${clientId}/services`, { headers:{ Authorization:`Bearer ${token}` }});
      const j = await r.json();
      if(!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setItems(j.items || []);
    }catch(e){ setError(e.message); } finally{ setLoading(false); }
  }, [clientId, token]);

  React.useEffect(()=>{ if(!token){location.href="/login";return;} fetchList(); }, [fetchList]);

  async function createService(){
    try{
      const body = {
        service_name: form.service_name,
        description: form.description,
        quantity: Number(form.quantity||1),
        unit_price: Number(form.unit_price||0)
      };
      const r = await fetch(`/api/clients/${clientId}/services`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const j = await r.json();
      if(!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setOpenNew(false);
      setForm({ service_name:"", description:"", quantity:1, unit_price:0 });
      fetchList();
    }catch(e){ alert("Error: " + e.message); }
  }

  const totalGeneral = items.reduce((acc, it)=> acc + Number(it.total||0), 0);

  return (
    <div className="container">
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:10}}>
        <h2 style={{margin:"16px 0"}}>Servicios {clientId && <small style={{color:"var(--muted)"}}>(cliente #{clientId})</small>}</h2>
        <div className="toolbar">
          <Button className="ghost" onClick={()=>location.href="/"}>← Volver</Button>
          <Button kind="ok" onClick={()=>setOpenNew(true)}>+ Nuevo servicio</Button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="skel" style={{height:40}}/> :
        error ? <div className="err">Error: {error}</div> :
        <div style={{overflowX:"auto"}}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Servicio</th><th>Descripción</th><th>Cantidad</th><th>P.Unitario</th><th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it=>(
                <tr key={it.id}>
                  <td>{it.id}</td>
                  <td>{it.service_name}</td>
                  <td>{it.description || "-"}</td>
                  <td>{it.quantity}</td>
                  <td>$ {Number(it.unit_price).toFixed(2)}</td>
                  <td style={{fontWeight:700}}>$ {Number(it.total).toFixed(2)}</td>
                </tr>
              ))}
              {items.length===0 && <tr><td colSpan="6" style={{color:"var(--muted)", padding:"20px"}}>Sin servicios</td></tr>}
              {items.length>0 && (
                <tr>
                  <td colSpan="5" style={{textAlign:"right", fontWeight:700}}>Total general</td>
                  <td style={{fontWeight:800}}>$ {totalGeneral.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>}
      </div>

      <Modal open={openNew} title="Nuevo servicio" onClose={()=>setOpenNew(false)}
        footer={<>
          <Button className="ghost" onClick={()=>setOpenNew(false)}>Cancelar</Button>
          <Button kind="ok" onClick={createService}>Crear</Button>
        </>}>
        <div className="grid">
          <Input placeholder="Nombre del servicio *" value={form.service_name} onChange={e=>setForm(f=>({...f, service_name:e.target.value}))}/>
          <Input placeholder="Descripción" value={form.description} onChange={e=>setForm(f=>({...f, description:e.target.value}))}/>
          <Input placeholder="Cantidad" type="number" min="1" step="1" value={form.quantity}
                 onChange={e=>setForm(f=>({...f, quantity:e.target.value}))}/>
          <Input placeholder="Precio unitario" type="number" min="0" step="0.01" value={form.unit_price}
                 onChange={e=>setForm(f=>({...f, unit_price:e.target.value}))}/>
        </div>
      </Modal>
    </div>
  );
}
