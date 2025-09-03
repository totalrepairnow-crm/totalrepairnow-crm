import React from 'react';

export default function MetricCard({ title, value, hint, accent = 'brand' , loading=false }) {
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">{title}</div>
        <span className="pill">{hint}</span>
      </div>
      {loading ? (
        <>
          <div className="skel" />
          <div className="skel" style={{ width: '60%' }} />
        </>
      ) : (
        <div className="kpi" style={{
          background: `linear-gradient(90deg, var(--${accent}), var(--brand-2))`,
          WebkitBackgroundClip: 'text',
          color: 'transparent'
        }}>
          {value}
        </div>
      )}
    </div>
  );
}
