// backend/lib/mailer.js
// English, branded invoice email via SendGrid.
// Safe defaults + environment overrides.

const sgMail = require('@sendgrid/mail');

const BRAND = {
  name: process.env.COMPANY_NAME || 'Total Repair Now',
  logoUrl:
    process.env.COMPANY_LOGO_URL ||
    'https://crm.totalrepairnow.com/v2/logo.png',
  siteUrl: process.env.COMPANY_SITE_URL || 'https://totalrepairnow.com',
  supportEmail:
    process.env.COMPANY_SUPPORT_EMAIL || 'info@totalrepairnow.com',
  phone: process.env.COMPANY_PHONE || '+1 (737) 555-0100',
  address: process.env.COMPANY_ADDRESS || '',
};

const FROM_EMAIL =
  process.env.MAIL_FROM || BRAND.supportEmail; // e.g. billing@yourdomain.com
const FROM_NAME =
  process.env.MAIL_FROM_NAME || `${BRAND.name} Billing`;

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fmtMoney(n) {
  if (n === null || n === undefined || n === '') return '';
  const num = typeof n === 'string' ? Number(n) : n;
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Builds the default English subject line with branding.
 */
function buildSubject(invoice) {
  const no = invoice?.invoice_no || invoice?.id;
  return `Invoice ${no ? `#${no} ` : ''}from ${BRAND.name}`;
}

/**
 * Plain-text fallback body.
 */
function buildTextBody({ invoice, message }) {
  const no = invoice?.invoice_no || invoice?.id || '';
  const total =
    invoice?.total ??
    invoice?.summary_total ??
    invoice?.computed_total ??
    '';
  return [
    `Hello,`,
    '',
    `Please find attached your invoice ${no ? `#${no} ` : ''}from ${
      BRAND.name
    }.`,
    message ? `\nMessage from ${BRAND.name}: ${message}\n` : '',
    total !== ''
      ? `Total: ${fmtMoney(total)} ${invoice?.currency || 'USD'}`
      : '',
    '',
    `If you have any questions, reply to this email or contact us:`,
    `Website: ${BRAND.siteUrl}`,
    `Email: ${BRAND.supportEmail}`,
    BRAND.phone ? `Phone: ${BRAND.phone}` : '',
    BRAND.address ? `Address: ${BRAND.address}` : '',
    '',
    `Thank you,`,
    `${BRAND.name}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Simple branded HTML body.
 */
function buildHtmlBody({ invoice, message }) {
  const no = invoice?.invoice_no || invoice?.id || '';
  const currency = invoice?.currency || 'USD';
  const subtotal = invoice?.subtotal ?? invoice?.summary_subtotal;
  const discount = invoice?.discount ?? invoice?.summary_discount;
  const tax = invoice?.tax ?? invoice?.summary_tax;
  const total =
    invoice?.total ??
    invoice?.summary_total ??
    invoice?.computed_total;

  const rows = [
    subtotal != null && subtotal !== ''
      ? `<tr><td style="padding:6px 0;color:#475569">Subtotal</td><td style="padding:6px 0;text-align:right;font-weight:600">$${fmtMoney(
          subtotal
        )} ${currency}</td></tr>`
      : '',
    discount != null && discount !== ''
      ? `<tr><td style="padding:6px 0;color:#475569">Discount</td><td style="padding:6px 0;text-align:right">-$${fmtMoney(
          discount
        )} ${currency}</td></tr>`
      : '',
    tax != null && tax !== ''
      ? `<tr><td style="padding:6px 0;color:#475569">Tax</td><td style="padding:6px 0;text-align:right">$${fmtMoney(
          tax
        )} ${currency}</td></tr>`
      : '',
    total != null && total !== ''
      ? `<tr><td style="padding:10px 0;border-top:1px solid #e2e8f0;color:#0f172a"><strong>Total</strong></td><td style="padding:10px 0;border-top:1px solid #e2e8f0;text-align:right"><strong>$${fmtMoney(
          total
        )} ${currency}</strong></td></tr>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(
    `Invoice ${no ? `#${no} ` : ''}from ${BRAND.name}`
  )}</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fb;color:#0f172a;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f8fb;padding:24px 0">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(15,23,42,.06);padding:24px">
          <tr>
            <td style="text-align:center;padding-bottom:16px">
              <a href="${escapeHtml(BRAND.siteUrl)}" style="text-decoration:none;border:0">
                <img src="${escapeHtml(
                  BRAND.logoUrl
                )}" alt="${escapeHtml(
    BRAND.name
  )}" height="40" style="display:inline-block;border:0;vertical-align:middle" />
              </a>
            </td>
          </tr>

          <tr>
            <td>
              <h1 style="margin:8px 0 0;font-size:20px;color:#0f172a">Invoice ${
                no ? `#${escapeHtml(no)} ` : ''
              }</h1>
              <p style="margin:8px 0 16px;color:#334155">
                Please find your invoice attached as a PDF.
              </p>

              ${
                message
                  ? `<div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin:12px 0;color:#0f172a">
                    <strong>Message from ${escapeHtml(BRAND.name)}:</strong><br />
                    ${escapeHtml(message)}
                  </div>`
                  : ''
              }

              ${
                rows
                  ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:8px 0 16px">${rows}</table>`
                  : ''
              }

              <p style="margin:16px 0 8px;color:#334155">
                If you have any questions, reply to this email or contact us.
              </p>

              <p style="margin:4px 0;color:#334155">
                <a href="${escapeHtml(
                  BRAND.siteUrl
                )}" style="color:#2563eb;text-decoration:none">${escapeHtml(
    BRAND.siteUrl
  )}</a><br/>
                ${escapeHtml(BRAND.supportEmail)}${
    BRAND.phone ? `<br/>${escapeHtml(BRAND.phone)}` : ''
  }${BRAND.address ? `<br/>${escapeHtml(BRAND.address)}` : ''}
              </p>

              <p style="margin:16px 0 0;color:#0f172a">Thank you,<br/>${
                BRAND.name
              }</p>
            </td>
          </tr>
        </table>

        <p style="color:#94a3b8;font-size:12px;margin:12px 0 0">
          This is an automated message from ${escapeHtml(
            BRAND.name
          )}. Please do not share this email with anyone you don’t trust.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Sends the invoice email with attached PDF (Buffer required).
 * @param {Object} params
 * @param {string} params.to
 * @param {string} [params.subject]
 * @param {string} [params.message]
 * @param {Buffer} params.pdfBuffer
 * @param {Object} [params.invoice] - optional invoice object for subject/body
 * @returns {Promise<{ok:boolean, engine:string, status:number}>}
 */
async function sendInvoiceEmail({ to, subject, message, pdfBuffer, invoice }) {
  if (!SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY is not configured on the server');
  }
  if (!to) throw new Error('Parameter "to" is required');
  if (!Buffer.isBuffer(pdfBuffer)) {
    throw new Error('Parameter "pdfBuffer" must be a Buffer');
  }

  const sub = subject && subject.trim().length ? subject : buildSubject(invoice);
  const html = buildHtmlBody({ invoice, message });
  const text = buildTextBody({ invoice, message });

  const filename = `Invoice-${invoice?.invoice_no || invoice?.id || 'document'}.pdf`;

  const msg = {
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    replyTo: BRAND.supportEmail,
    subject: sub,
    text,
    html,
    attachments: [
      {
        content: pdfBuffer.toString('base64'),
        filename,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  };

  const [res] = await sgMail.send(msg);
  return { ok: true, engine: 'sendgrid', status: res?.statusCode || 202 };
}

/**
 * Backward-compat wrapper to preserve old signature:
 *   sendMail(to, subject, message, pdfBuffer, meta)
 */
async function sendMail(to, subject, message, pdfBuffer, meta = {}) {
  return sendInvoiceEmail({ to, subject, message, pdfBuffer, invoice: meta });
}

module.exports = {
  sendInvoiceEmail,
  sendMail,
  BRAND, // exported in case routes want to read branding
};
