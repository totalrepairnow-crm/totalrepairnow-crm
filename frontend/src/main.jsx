// frontend/src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Clients from "./pages/Clients";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";

import Header from "./components/Header";   // <- NUEVO
import "./index.css";

// Detecta base para /v2-staging y /v2
function detectBase() {
  const p = window.location.pathname || "/";
  if (p.startsWith("/v2-staging/") || p === "/v2-staging") return "/v2-staging";
  if (p.startsWith("/v2/") || p === "/v2") return "/v2";
  return "/";
}
const basename = detectBase();

function Private({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function WithHeader({ children }) {
  return (
    <>
      <Header />
      <div className="container">{children}</div>
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <Private>
                <WithHeader><Clients /></WithHeader>
              </Private>
            }
          />
          <Route
            path="/clients"
            element={
              <Private>
                <WithHeader><Clients /></WithHeader>
              </Private>
            }
          />
          <Route
            path="/services"
            element={
              <Private>
                <WithHeader><Services /></WithHeader>
              </Private>
            }
          />
          <Route
            path="/services/:id"
            element={
              <Private>
                <WithHeader><ServiceDetail /></WithHeader>
              </Private>
            }
          />
          <Route path="*" element={<Navigate to="/clients" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
