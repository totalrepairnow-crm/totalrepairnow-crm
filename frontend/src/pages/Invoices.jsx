// src/pages/Invoices.jsx
import React, { useEffect, useState } from "react";
import { listInvoices } from "../lib/invoices";

function money(n) {
  const v = Number(n || 0);
  return v.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export default function Invoices() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [data, setData] = useState({
    items: [],
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr("");

    listInvoices({ q, page, limit })
      .then((json) => {
        if (cancelled) return;
        setData({
          items: json.items || [],
          page: json.page || 1,
          totalPages: json.totalPages || 1,
          total: json.total ?? (json.items ? json.items.length : 0),
        });
      })
      .catch((e) => !cancelled && setErr(e.message || "Failed to load invoices"))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [q, page, limit]);

  const hasPrev = (data.page || 1) > 1;
  const hasNext = (data.page || 1) < (data.totalPages || 1);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Invoices</h1>
        <div className="spacer" />
      </div>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search (number, client)…"
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
        />
        <label className="muted">Rows</label>
        <select
          className="input"
          value={limit}
          onChange={(e) => {
            setPage(1);
            setLimit(parseInt(e.target.value, 10) || 10);
          }}
        >
          <option value="5">5 / page</option>
          <option value="10">10 / page</option>
          <option value="25">25 / page</option>
        </select>
      </div>

      {err && <div className="alert">{err}</div>}

      <div className="table-wrap">
        <table className="table table-fixed">
          <colgroup>
            <col style={{ width: "90px" }} />
            <col style={{ width: "16ch" }} />
            <col />
            <col style={{ width: "12ch" }} />
            <col style={{ width: "10ch" }} />
            <col style={{ width: "18ch" }} />
          </colgroup>
          <thead>
            <tr>
              <th>ID</th>
              <th>No.</th>
              <th>Client</th>
              <th>Total</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center" }}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading &&
              data.items.map((inv) => (
                <tr key={inv.id}>
                  <td className="nowrap">#{inv.id}</td>
                  <td>{inv.number || "-"}</td>
                  <td className="ellipsis" title={inv.client_name || "-"}>
                    {inv.client_name || "-"}
                  </td>
                  <td className="nowrap">{money(inv.total)}</td>
                  <td className="nowrap">{inv.status || "-"}</td>
                  <td className="nowrap">
                    {new Date(inv.created_at || inv.createdAt || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            {!loading && data.items.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#94a3b8" }}>
                  No results
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <button
          className="btn"
          disabled={!hasPrev || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          ◀ Prev
        </button>
        <span className="muted">
          Page {data.page || 1} / {data.totalPages || 1} • {data.total || 0} total
        </span>
        <button
          className="btn"
          disabled={!hasNext || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}
