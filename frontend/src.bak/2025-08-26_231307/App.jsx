import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Clients from "./pages/Clients";
import Services from "./pages/Services";

const RequireAuth = ({children}) => {
  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("token");
  return hasToken ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        {/* Público */}
        <Route path="/login" element={<Login />} />

        {/* Privado */}
        <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/clients" element={<RequireAuth><Clients /></RequireAuth>} />
        <Route path="/services" element={<RequireAuth><Services /></RequireAuth>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
