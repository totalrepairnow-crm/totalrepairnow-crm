// Simple helper para listar facturas desde /api/invoices
export async function listInvoices({ page = 1, limit = 25, q = "" } = {}, token) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("limit", limit);
  if (q) params.set("q", q);

  const res = await fetch(`/api/invoices?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Failed to load invoices (${res.status}) ${txt}`);
  }
  return res.json(); // espera {items, page, totalPages, ...} o un array; abajo manejamos ambos casos
}
