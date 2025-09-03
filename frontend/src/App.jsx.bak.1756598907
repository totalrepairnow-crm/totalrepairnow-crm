import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientNew from "./pages/ClientNew";
import ClientDetail from "./pages/ClientDetail";
import ClientEdit from "./pages/ClientEdit";
import Users from "./pages/Users";
import { getToken, isTokenValid } from "./utils/auth";
import "./styles/app.css";

function ProtectedRoute({ children }) {
  const token = getToken();
  if (!token || !isTokenValid(token)) return <Navigate to="/login" replace />;
  return children;
}
function PublicOnly({ children }) {
  const token = getToken();
  if (token && isTokenValid(token)) return <Navigate to="/" replace />;
  return children;
}

export default function App(){
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/login" element={<PublicOnly><Login/></PublicOnly>} />
        <Route path="/" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute><Clients/></ProtectedRoute>} />
        <Route path="/clients/new" element={<ProtectedRoute><ClientNew/></ProtectedRoute>} />
        <Route path="/clients/:id" element={<ProtectedRoute><ClientDetail/></ProtectedRoute>} />
        <Route path="/clients/:id/edit" element={<ProtectedRoute><ClientEdit/></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users/></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
