// src/components/EmailInvoiceButton.jsx
import React, { useMemo, useRef, useState } from "react";
import * as API from "../lib/api";

export default function EmailInvoiceButton({
  invoiceId,
  invoiceNo,
  clientEmail,
  defaultSubject,
  defaultMessage,
  className = "",
  label = "Email Invoice",
}) {
  const dlgRef = useRef(null);
  const [to, setTo] = useState(clientEmail || "");
  const subject = useMemo(
    () => defaultSubject || `Invoice ${invoiceNo || invoiceId}`,
    [defaultSubject, invoiceNo, invoiceId]
  );
  const [message, setMessage] = useState(
    defaultMessage || "Please find your invoice attached. Thank you!"
  );

  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  function open() {
    setErr(""); setOk("");
    if (dlgRef.current && dlgRef.current.showModal) {
      dlgRef.current.showModal();
    } else {
      // Fallback sin <dialog>
      const email = prompt("Send to (email):", to || clientEmail || "");
      if (!email) return;
      doSend(email, subject, message);
    }
  }

  function close() {
    if (dlgRef.current && dlgRef.current.close) dlgRef.current.close();
  }

  async function doSend(toEmail, subj, msg) {
    setSending(true); setErr(""); setOk("");
    try {
      const resp = await API.sendInvoiceEmail(invoiceId, {
        to: toEmail,
        subject: subj,
        message: msg,
      });
      setOk("Email sent.");
      // opcional: cerrar aut.
      setTimeout(() => { close(); }, 600);
      return resp;
    } catch (e) {
      setErr(String(e?.message || "Email failed"));
      throw e;
    } finally {
      setSending(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    await doSend(to, subject, message);
  }

  return (
    <>
      <button type="button" className={className} onClick={open}>
        {label}
      </button>

      <dialog ref={dlgRef} style={{ maxWidth: 520, width: "92%" }}>
        <form method="dialog" onSubmit={onSubmit}>
          <h3 style={{ marginTop: 0 }}>Send Invoice</h3>

          {ok && <div style={{ background: "#e8fff0", padding: 10, borderRadius: 6, marginBottom: 10 }}>{ok}</div>}
          {err && <div style={{ background: "#ffecec", padding: 10, borderRadius: 6, marginBottom: 10 }}>{err}</div>}

          <div style={{ display: "grid", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span>To</span>
              <input
                type="email"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="client@example.com"
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Subject</span>
              <input type="text" required value={subject} readOnly />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Message</span>
              <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
            </label>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
            <button type="button" onClick={close} disabled={sending}>Cancel</button>
            <button type="submit" disabled={sending}>
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
