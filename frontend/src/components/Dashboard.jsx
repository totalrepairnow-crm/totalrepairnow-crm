import React from "react";

function StatCard({label, value, subtitle}) {
  return (
    <div className="rounded-2xl shadow p-5 bg-white">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
      {subtitle ? <div className="text-xs text-gray-400 mt-1">{subtitle}</div> : null}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[1,2,3].map(i => (
        <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}

export default function Dashboard({ apiBase = process.env.REACT_APP_API_URL || "/api" }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [stats, setStats] = React.useState({ total: 0, activos: 0, inactivos: 0 });

  const token = React.useMemo(() => localStorage.getItem("token") || "", []);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchClientsAndCompute() {
      setLoading(true); setError("");
      try {
        // Llama al listado y computa métricas en el cliente
        // Ajusta pageSize si tu backend valida máximos; 1000 es un valor conservador
        const url = `${apiBase}/clients?page=1&pageSize=1000`;
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          credentials: "include"
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        const rows = Array.isArray(data?.items) ? data.items
                   : Array.isArray(data) ? data
                   : Array.isArray(data?.rows) ? data.rows
                   : [];

        const total = rows.length;
        const activos = rows.filter(c => (c?.estado || c?.status || "").toString().toLowerCase() === "activo").length;
        const inactivos = rows.filter(c => (c?.estado || c?.status || "").toString().toLowerCase() === "inactivo").length;

        if (!cancelled) setStats({ total, activos, inactivos });
      } catch (e) {
        if (!cancelled) setError("No se pudieron cargar las métricas");
        console.error("Dashboard metrics error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchClientsAndCompute();
    // Refetch suave cada 60s
    const t = setInterval(fetchClientsAndCompute, 60000);
    return () => { cancelled = true; clearInterval(t); };
  }, [apiBase, token]);

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4">Dashboard</h1>

      {loading ? <Skeleton /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total de clientes" value={stats.total} />
            <StatCard label="Clientes activos" value={stats.activos} />
            <StatCard label="Clientes inactivos" value={stats.inactivos} />
          </div>

          {error ? (
            <div className="mt-4 text-sm text-red-600">{error}</div>
          ) : null}
        </>
      )}
    </div>
  );
}
