// src/pages/Clients.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listClients, deleteClient, getRole } from "../lib/api";

function safe(v) {
  return v ?? "-";
}

function renderName(c) {
  const first = c.first_name?.trim() || "";
  const last = c.last_name?.trim() || "";
  const full = `${first} ${last}`.trim();
  return full || c.name || "-";
}

export default function Clients() {
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState("name_asc"); // name_asc | name_desc | city_asc | created_desc | created_asc
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

  const isAdmin = getRole() === "admin";

  async function fetchData({ keepPage = false } = {}) {
    setLoading(true);
    setErr("");
    try {
      const res = await listClients({ q, page: keepPage ? page : 1, limit });
      setData({
        items: res.items || [],
        page: res.page || 1,
        totalPages: res.totalPages || 1,
        hasPrev: !!res.hasPrev,
        hasNext: !!res.hasNext,
        total: res.total ?? (res.items ? res.items.length : 0),
      });
      if (!keepPage) setPage(1);
    } catch (e) {
      setErr(e?.message || "Failed to load clients.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData({ keepPage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const sortedItems = useMemo(() => {
    const items = [...(data.items || [])];
    const by =
      {
        name_asc: (a, b) =>
          renderName(a).localeCompare(renderName(b), undefined, { sensitivity: "base" }),
        name_desc: (a, b) =>
          -renderName(a).localeCompare(renderName(b), undefined, { sensitivity: "base" }),
        city_asc: (a, b) =>
          (a.city || "").localeCompare(b.city || "", undefined, { sensitivity: "base" }),
        created_asc: (a, b) =>
          new Date(a.created_at || 0) - new Date(b.created_at || 0),
        created_desc: (a, b) =>
          new Date(b.created_at || 0) - new Date(a.created_at || 0),
      }[order] || ((a, b) => 0);
    return items.sort(by);
  }, [data.items, order]);

  function gotoPage(p) {
    const next = Math.max(1, Math.min(p, data.totalPages || 1));
    setPage(next);
  }

  async function onDelete(id) {
    if (!isAdmin) return;
    if (
      !window.confirm(
        "Are you sure you want to delete this client? This action cannot be undone."
      )
    )
      return;
    try {
      await deleteClient(id);
      const remains = (data.items?.length || 1) - 1;
      const newPage = remains === 0 && page > 1 ? page - 1 : page;
      setPage(newPage);
      await fetchData({ keepPage: true });
    } catch (e) {
      alert(e?.message || "Failed to delete client.");
    }
  }

  function applyFilters() {
    setPage(1);
    fetchData({ keepPage: false });
  }

  function changeLimit(v) {
    const num = parseInt(v, 10) || 10;
    setLimit(num);
    setPage(1);
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Clients</h1>
        <div className="spacer" />
        <Link className="btn primary" to="/clients/new">
          + New Client
        </Link>
      </div>

      {/* Toolbar: búsqueda + orden + paginación */}
      <div className="toolbar">
        <div className="toolbar-left">
          <input
            className="input"
            placeholder="Search (name, email, phone)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? applyFilters() : null)}
            aria-label="Search clients"
          />
          <select
            className="input"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            title="Sort by"
            aria-label="Sort clients"
          >
            <option value="name_asc">Name (A→Z)</option>
            <option value="name_desc">Name (Z→A)</option>
            <option value="city_asc">City (A→Z)</option>
            <option value="created_desc">Newest first</option>
            <option value="created_asc">Oldest first</option>
          </select>
          <button className="btn" onClick={applyFilters} disabled={loading}>
            Apply
          </button>
        </div>

        <div className="toolbar-right">
          <label className="muted" htmlFor="rows-select">
            Rows
          </label>
          <select
            id="rows-select"
            className="input"
            value={limit}
            onChange={(e) => changeLimit(e.target.value)}
            aria-label="Rows per page"
          >
            <option value="5">5 / page</option>
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
          </select>
        </div>
      </div>

      {err && <div className="alert">{err}</div>}

      <div className="table-wrap">
        <table className="table table-fixed">
          <colgroup>
            <col style={{ width: "84px" }} />
            <col />
            <col style={{ width: "22ch" }} />
            <col style={{ width: "16ch" }} />
            <col style={{ width: "260px" }} />
          </colgroup>

          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th className="actions-cell">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center" }}>
                  Loading…
                </td>
              </tr>
            )}

            {!loading &&
              sortedItems.map((c) => (
                <tr key={c.id}>
                  <td className="nowrap">#{c.id}</td>
                  <td>
                    <span className="ellipsis" title={renderName(c)}>
                      {renderName(c)}
                    </span>
                  </td>
                  <td>
                    <span className="ellipsis" title={c.email || "-"}>
                      {safe(c.email)}
                    </span>
                  </td>
                  <td className="nowrap">
                    {safe(c.phone_mobile || c.phone || c.phone_home)}
                  </td>
                  <td className="actions-cell">
                    <div className="actions">
                      <Link className="btn" to={`/clients/${c.id}`}>
                        View
                      </Link>
                      {isAdmin && (
                        <Link className="btn primary" to={`/clients/${c.id}/edit`}>
                          Edit
                        </Link>
                      )}
                      {isAdmin && (
                        <button
                          className="btn danger"
                          onClick={() => onDelete(c.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

            {!loading && sortedItems.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: "center", color: "#94a3b8" }}
                >
                  No results
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="pager">
        <button
          className="btn"
          disabled={!data.hasPrev || loading}
          onClick={() => gotoPage((data.page || 1) - 1)}
        >
          ◀ Prev
        </button>
        <span className="muted">
          Page {data.page || 1} / {data.totalPages || 1}
        </span>
        <button
          className="btn"
          disabled={!data.hasNext || loading}
          onClick={() => gotoPage((data.page || 1) + 1)}
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}
