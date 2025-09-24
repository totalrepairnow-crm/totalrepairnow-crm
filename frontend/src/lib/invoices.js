// src/lib/invoices.js
// Cliente ligero para el API de facturas

export async function listInvoices({ q = "", page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("page", page);
  params.set("limit", limit);

  const res = await fetch(`/api/invoices?${params.toString()}`, {
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET /api/invoices -> ${res.status}: ${text}`);
  }
  // Esperado:
  // { items: [...], page: 1, totalPages: 1, total: 0 }
  return res.json();
}

export async function getInvoice(id) {
  const res = await fetch(`/api/invoices/${id}`, {
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`GET /api/invoices/${id} -> ${res.status}`);
  return res.json();
}
