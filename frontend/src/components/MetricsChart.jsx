import React from 'react';

/**
 * Mini gráfico de barras para el Dashboard sin librerías externas.
 * Recibe:
 *  - metrics: { total_clients, active_clients, inactive_clients, services_total_amount }
 *  - loading: boolean
 */
export default function MetricsChart({ metrics, loading }) {
  if (loading) {
    return (
      <section className="card">
        <div className="card-head">
          <h3>Resumen visual</h3>
        </div>
        <div className="skel" style={{ height: 120 }} />
      </section>
    );
  }
  if (!metrics) return null;

  const total = Number(metrics.total_clients || 0);
  const act = Number(metrics.active_clients || 0);
  const ina = Number(metrics.inactive_clients || 0);
  const amount = Number(metrics.services_total_amount || 0);

  const maxClients = Math.max(total, act, ina, 1);

  const W = 360;
  const H = 140;
  const pad = 28;
  const barW = 60;
  const gap = 32;

  const bars = [
    { label: 'Total', value: total },
    { label: 'Activos', value: act },
    { label: 'Inactivos', value: ina },
  ];

  const scaleY = (v) => {
    const usable = H - pad * 2;
    return (v / maxClients) * usable;
  };

  const firstX = (W - (bars.length * barW + (bars.length - 1) * gap)) / 2;

  return (
    <section className="card">
      <div className="card-head" style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h3>Resumen visual</h3>
        <span style={{ fontSize: 12, color: '#667085' }}>
          (Servicios totales: ${amount.toFixed(2)})
        </span>
      </div>

      <div className="chart-wrap">
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Gráfico de métricas"
        >
          <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#EAECF0" strokeWidth="2" />
          {bars.map((b, i) => {
            const h = scaleY(b.value);
            const x = firstX + i * (barW + gap);
            const y = H - pad - h;
            return (
              <g key={b.label}>
                <rect x={x} y={y} width={barW} height={h} rx="8" fill="#155EEF" />
                <text
                  x={x + barW / 2}
                  y={H - pad + 16}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#667085"
                >
                  {b.label}
                </text>
                <text
                  x={x + barW / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#101828"
                  fontWeight="600"
                >
                  {b.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
