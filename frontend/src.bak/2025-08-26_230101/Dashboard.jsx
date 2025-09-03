import React from "react";

export default function Dashboard() {
  const [state, setState] = React.useState({ loading: true, error: "", data: null });

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }

    fetch("/api/metrics", { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then(data => setState({ loading: false, error: "", data }))
      .catch(err => setState({ loading: false, error: err.message, data: null }));
  }, []);

  const { loading, error, data } = state;

  const Card = ({ title, value }) => (
    <div className="card col-4">
      <h3>{title}</h3>
      {loading ? <div className="skel" /> : <div className="big">{value}</div>}
    </div>
  );

  return (
    <div className="container">
      <div style={{display:"flex", alignItems:"baseline", gap:10}}>
        <h2 style={{margin:"16px 0"}}>Dashboard</h2>
        {error && <span className="err">No se pudieron cargar las métricas ({error})</span>}
      </div>

      <div className="grid">
        <Card title="Total de clientes" value={data?.total_clients ?? 0} />
        <Card title="Clientes activos" value={data?.active_clients ?? 0} />
        <Card title="Clientes inactivos" value={data?.inactive_clients ?? 0} />

        <div className="card col-6">
          <h3>Servicios</h3>
          {loading ? <div className="skel" /> : (
            <div style={{display:"flex", gap:20}}>
              <div><div style={{fontSize:12, color:"var(--muted)"}}>Cantidad</div><div className="big">{data?.services_count ?? 0}</div></div>
              <div><div style={{fontSize:12, color:"var(--muted)"}}>Total</div><div className="big">$ {data?.services_total_amount ?? "0.00"}</div></div>
            </div>
          )}
        </div>

        <div className="card col-6">
          <h3>Estado</h3>
          {loading ? <div className="skel" /> : <div>Todo OK ✅</div>}
        </div>
      </div>
    </div>
  );
}
