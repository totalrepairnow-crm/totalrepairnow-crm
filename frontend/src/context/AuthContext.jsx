// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { login as apiLogin, hasSession, clearToken } from '../lib/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(hasSession());
  const [profile, setProfile] = useState(null);

  // Si hay token en localStorage al arrancar, marca sesión activa
  useEffect(() => {
    setIsAuthenticated(hasSession());
  }, []);

  async function login(email, password) {
    // api.login ya guarda los tokens internamente (src/lib/api.js)
    const data = await apiLogin(email, password);
    setIsAuthenticated(true);
    setProfile({ email: data?.email || email, role: data?.role });
    return true; // <- importante: tu Login.jsx espera un boolean de éxito
  }

  function logout() {
    clearToken();
    setIsAuthenticated(false);
    setProfile(null);
  }

  const value = useMemo(
    () => ({ isAuthenticated, login, logout, profile }),
    [isAuthenticated, profile]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
