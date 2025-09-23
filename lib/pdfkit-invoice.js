// /home/crmadmin/crm_app/backend/lib/pdfkit-invoice.js
// Internal PDF (PDFKit) with aligned columns + simple branding via env vars.

const PDFDocument = require("pdfkit");
const fs = require("fs");

// ===== Helpers =====
const r2 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
const money = (n) => `$${r2(n).toFixed(2)}`;

// ===== Branding (ENV) =====
const BRAND = {
  NAME:      process.env.BRAND_NAME      || "Total Repair Now",
  ADDRESS:   process.env.BRAND_ADDRESS   || "123 Main St, Austin, TX 78701",
  PHONE:     process.env.BRAND_PHONE     || "+1 512-555-0000",
  EMAIL:     process.env.BRAND_EMAIL     || "info@totalrepairnow.com",
  WEBSITE:   process.env.BRAND_WEBSITE   || "https://totalrepairnow.com",
  LOGO_PATH: process.env.BRAND_LOGO_PATH || null,
};

// ===== Layout =====
const MARGIN_X = 50;
const MARGIN_Y = 60;

function rightX(doc) {
  return doc.page.width - MARGIN_X;
}
function drawHr(doc, y) {
  doc
    .moveTo(MARGIN_X, y)
    .lineTo(rightX(doc), y)
    .strokeColor("#cccccc")
    .lineWidth(1)
    .stroke()
    .fillColor("#000000");
}

function drawHeader(doc, data) {
  const top = MARGIN_Y;

  // Logo (optional)
  if (BRAND.LOGO_PATH && fs.existsSync(BRAND.LOGO_PATH)) {
    try {
      doc.image(BRAND.LOGO_PATH, MARGIN_X, top-28, { width: 110 });
    } catch (_) {}
  }

  // Company block
  const companyX = BRAND.LOGO_PATH ? MARGIN_X + 130 : MARGIN_X;
  doc.font("Helvetica-Bold").fontSize(16).fillColor("#000");
  doc.text(BRAND.NAME, companyX, top);

  doc.font("Helvetica").fontSize(10);
  doc.text(BRAND.ADDRESS, companyX, top + 18);
  doc.text(BRAND.PHONE, companyX, top + 32);
  doc.text(BRAND.EMAIL, companyX, top + 46);
  doc.text(BRAND.WEBSITE, companyX, top + 60, { link: BRAND.WEBSITE, underline: false });

  // Title + meta (right)
  const metaX = rightX(doc) - 220;
  doc.font("Helvetica-Bold").fontSize(24).text("INVOICE", metaX, top, { width: 220, align: "right" });
  doc.font("Helvetica").fontSize(11);

  const invNo = data.number || data.invoice_no || data.invoiceNo || "";
  const created = data.meta?.invoice_date || data.created_at || data.date || new Date();
  let dateTxt = "";
  try {
    dateTxt = new Date(created).toLocaleDateString("en-US");
  } catch {
    dateTxt = "";
  }

  doc.text(`Invoice #: ${invNo}`, metaX, top + 34, { width: 220, align: "right" });
  if (dateTxt) doc.text(`Date: ${dateTxt}`, metaX, top + 50, { width: 220, align: "right" });

  drawHr(doc, top + 90);
}

function drawBillTo(doc, data) {
  const y = MARGIN_Y + 105;

  doc.font("Helvetica-Bold").fontSize(12).text("Bill To", MARGIN_X, y);
  doc.font("Helvetica").fontSize(11);

  const to = (data.to || "").toString().trim();
  const lines = to ? to.split("\n").filter(Boolean) : [];
  let y2 = y + 18;
  for (const line of lines) {
    doc.text(line, MARGIN_X, y2);
    y2 += 14;
  }

  // Invoice meta (right block small)
  const metaX = rightX(doc) - 220;
  doc.font("Helvetica-Bold").text("Details", metaX, y, { width: 220, align: "right" });
  doc.font("Helvetica");

  const currency = data.currency || "USD";
  doc.text(`Currency: ${currency}`, metaX, y + 18, { width: 220, align: "right" });
  return Math.max(y2, y + 40);
}

function drawItemsTable(doc, data, startY) {
  const cols = {
    descX: MARGIN_X,
    qtyR: rightX(doc) - 200,
    unitR: rightX(doc) - 120,
    totalR: rightX(doc) - 40,
  };

  let y = startY + 20;

  // Header
  doc.font("Helvetica-Bold").fontSize(11);
  doc.text("Description", cols.descX, y);
  doc.text("Qty", cols.qtyR - 50, y, { width: 50, align: "right" });
  doc.text("Unit", cols.unitR - 60, y, { width: 60, align: "right" });
  doc.text("Total", cols.totalR - 60, y, { width: 60, align: "right" });

  y += 16;
  drawHr(doc, y);
  y += 6;

  // Rows
  doc.font("Helvetica").fontSize(10);

  const items = Array.isArray(data.items) ? data.items : [];
  for (const it of items) {
    const name = it.name || it.description || "";
    const qty = Number(it.quantity || 0);
    const unit = Number(it.unit_cost || it.unit_price || 0);
    const total = r2(qty * unit);

    doc.text(name, cols.descX, y, { width: cols.qtyR - cols.descX - 12, align: "left" });
    doc.text(String(qty), cols.qtyR - 50, y, { width: 50, align: "right" });
    doc.text(money(unit), cols.unitR - 60, y, { width: 60, align: "right" });
    doc.text(money(total), cols.totalR - 60, y, { width: 60, align: "right" });

    y += 16;

    // page break
    if (y > doc.page.height - 180) {
      doc.addPage();
      y = MARGIN_Y;
    }
  }

  drawHr(doc, y + 4);
  return y + 14;
}

function drawTotals(doc, data, yStart) {
  // compute
  const items = Array.isArray(data.items) ? data.items : [];
  const subtotal = r2(items.reduce((a, it) => a + r2(Number(it.quantity || 0) * Number(it.unit_cost || it.unit_price || 0)), 0));
  const discounts = r2(Number(data.discounts || data.discount || 0));
  const taxPct = Number(data.tax || 0);
  const base = Math.max(0, subtotal - discounts);
  const taxAmt = r2(base * (taxPct / 100));
  const total = r2(base + taxAmt);

  const boxW = 220;
  const x = rightX(doc) - boxW;
  let y = yStart + 10;

  doc.font("Helvetica").fontSize(11);

  function row(label, value) {
    doc.text(label, x, y, { width: boxW - 90, align: "right" });
    doc.text(value, x + boxW - 80, y, { width: 80, align: "right" });
    y += 16;
  }

  row("Subtotal:", money(subtotal));
  row("Discounts:", `- ${money(discounts)}`);
  row(`Tax (${r2(taxPct)}%):`, money(taxAmt));

  doc.font("Helvetica-Bold").fontSize(12);
  row("Total:", money(total));

  return y;
}

function drawFooter(doc) {
  const y = doc.page.height - 60;
  drawHr(doc, y - 10);
  doc.font("Helvetica").fontSize(9).fillColor("#555");
  doc.text("Thank you for your business!", MARGIN_X, y);
}

// ===== Core renderers =====
function renderInvoicePdfBuffer(payload = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "LETTER", margins: { top: MARGIN_Y, left: MARGIN_X, right: MARGIN_X, bottom: MARGIN_Y } });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Build
      drawHeader(doc, payload);
      const y1 = drawBillTo(doc, payload);
      const y2 = drawItemsTable(doc, payload, y1);
      drawTotals(doc, payload, y2);
      drawFooter(doc);

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function streamInvoicePdf(payload, res, { disposition = "inline", filename } = {}) {
  const buf = await renderInvoicePdfBuffer(payload);
  const fname =
    filename ||
    `Invoice-${payload.number || payload.invoice_no || payload.invoiceNo || "0001"}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `${disposition}; filename="${fname}"`);
  res.end(buf);
}

module.exports = { renderInvoicePdfBuffer, streamInvoicePdf };
