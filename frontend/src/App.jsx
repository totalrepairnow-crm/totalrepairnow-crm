// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx"; // ajusta la ruta si tu Login está en otro lugar

export default function App() {
  return (
    <Routes>
      {/* raíz → /login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* login */}
      <Route path="/login" element={<Login />} />

      {/* cualquier otra ruta → /login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
