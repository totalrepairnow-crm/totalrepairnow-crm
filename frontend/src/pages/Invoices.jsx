// src/pages/Invoices.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listInvoices } from "../lib/invoices";

function fmtMoney(n) {
  if (n == null) return "-";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n));
  } catch {
    return String(n);
  }
}
function fmtDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(+dt)) return "-";
  return dt.toLocaleDateString();
}

export default function Invoices() {
  const { token } = useAuth?.() || {}; // si tu AuthContext expone token
  const fallbackToken =
    token ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("jwt");

  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(25);
  const [page, setPage] = useState(1);

  const [data, setData] = useState({
    items: [],
    page: 1,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function fetchData({ keepPage = false } = {}) {
    setLoading(true);
    setErr("");
    try {
      const res = await listInvoices(
        { q, page: keepPage ? page : 1, limit },
        fallbackToken
      );

      // Soporta dos formatos: paginado ({items,...}) o array simple
      if (Array.isArray(res)) {
        setData({
          items: res,
          page: 1,
          totalPages: 1,
          hasPrev: false,
          hasNext: false,
          total: res.length,
        });
        if (!keepPage) setPage(1);
      } else {
        setData({
          items: res.items || [],
          page: res.page || 1,
          totalPages: res.totalPages || 1,
          hasPrev: !!res.hasPrev,
          hasNext: !!res.hasNext,
          total: res.total ?? (res.items ? res.items.length : 0),
        });
        if (!keepPage) setPage(res.page || 1);
      }
    } catch (e) {
      setErr(e?.message || "Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData({ keepPage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const items = useMemo(() => data.items || [], [data.items]);

  function gotoPage(p) {
    const next = Math.max(1, Math.min(p, data.totalPages || 1));
    setPage(next);
  }

  function applyFilters() {
    setPage(1);
    fetchData({ keepPage: false });
  }

  function changeLimit(v) {
    const num = parseInt(v, 10) || 25;
    setLimit(num);
    setPage(1);
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 16 }}>Invoices</h1>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <input
          placeholder="Search (number, client, status)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => (e.key === "Enter" ? applyFilters() : null)}
          className="input"
          style={{ padding: "8px 10px", flex: 1, border: "1px solid #e5e7eb", borderRadius: 6 }}
        />
        <select
          value={limit}
          onChange={(e) => changeLimit(e.target.value)}
          className="input"
          style={{ padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 6 }}
        >
          <option value="10">10 / page</option>
          <option value="25">25 / page</option>
          <option value="50">50 / page</option>
        </select>
        <button onClick={applyFilters} className="btn">
          Apply
        </button>
      </div>

      {err && (
        <div style={{ margin: "8px 0", padding: 12, border: "1px solid #fecaca", background: "#fee2e2", color: "#7f1d1d", borderRadius: 6 }}>
          {err}
        </div>
      )}

      <div className="table-wrap" style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f8fafc" }}>
            <tr>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #e5e7eb" }}>#</th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #e5e7eb" }}>Client</th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #e5e7eb" }}>Status</th>
              <th style={{ textAlign: "right", padding: 10, borderBottom: "1px solid #e5e7eb" }}>Total</th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #e5e7eb" }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 18 }}>
                  Loading…
                </td>
              </tr>
            )}

            {!loading &&
              items.map((inv) => (
                <tr key={inv.id ?? inv.number}>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{inv.number ?? inv.id}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                    {inv.client_name ?? inv.client?.name ?? "-"}
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                    {inv.status ?? "-"}
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9", textAlign: "right" }}>
                    {fmtMoney(inv.total)}
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                    {fmtDate(inv.created_at || inv.date)}
                  </td>
                </tr>
              ))}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 18, color: "#94a3b8" }}>
                  No results
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
        <button className="btn" disabled={!data.hasPrev || loading} onClick={() => gotoPage((data.page || 1) - 1)}>
          ◀ Prev
        </button>
        <span className="muted">Page {data.page || 1} / {data.totalPages || 1}</span>
        <button className="btn" disabled={!data.hasNext || loading} onClick={() => gotoPage((data.page || 1) + 1)}>
          Next ▶
        </button>
      </div>
    </div>
  );
}
