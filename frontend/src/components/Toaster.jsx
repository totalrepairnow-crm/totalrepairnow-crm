import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

const ToastCtx = createContext({ push: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

let seq = 0;

export function ToasterProvider({ children }) {
  const [items, setItems] = useState([]);

  const remove = useCallback((id) => {
    setItems(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((text, opts = {}) => {
    const id = ++seq;
    const toast = {
      id,
      text,
      type: opts.type || 'info', // 'success' | 'error' | 'info'
      ttl: opts.ttl ?? 3000,
    };
    setItems(prev => [...prev, toast]);
    if (toast.ttl > 0) {
      setTimeout(() => remove(id), toast.ttl);
    }
    return id;
  }, [remove]);

  const api = useMemo(() => ({ push, remove }), [push, remove]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <ToasterViewport items={items} onClose={remove} />
    </ToastCtx.Provider>
  );
}

function ToasterViewport({ items, onClose }) {
  return (
    <div className="toaster">
      {items.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <div className="toast-text">{t.text}</div>
          <button className="toast-close" onClick={() => onClose(t.id)} aria-label="Close">×</button>
        </div>
      ))}
    </div>
  );
}
