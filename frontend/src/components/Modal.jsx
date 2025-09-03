import React from "react";

export default function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
          <h3>{title}</h3>
          <button className="button ghost" onClick={onClose}>Cerrar</button>
        </div>
        <div>{children}</div>
        {footer && <div style={{marginTop:14, display:"flex", gap:10, justifyContent:"flex-end"}}>{footer}</div>}
      </div>
    </div>
  );
}
