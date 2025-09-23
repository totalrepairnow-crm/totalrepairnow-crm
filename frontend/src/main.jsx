// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./styles.css";
import Header from "./components/Header";

// Dashboard
import Dashboard from "./pages/Dashboard";

// Clients
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import ClientEdit from "./pages/ClientEdit";
import ClientNew from "./pages/ClientNew";

// Services
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import ServiceEdit from "./pages/ServiceEdit";
import ServiceNew from "./pages/ServiceNew";

// Users
import Users from "./pages/Users";
import UserDetail from "./pages/UserDetail";
import UserEdit from "./pages/UserEdit";
import UserNew from "./pages/UserNew";

// Auth
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter basename="/v2">
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<Dashboard />} />

        {/* Clients */}
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/new" element={<ClientNew />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/clients/:id/edit" element={<ClientEdit />} />

        {/* Services */}
        <Route path="/services" element={<Services />} />
        <Route path="/services/new" element={<ServiceNew />} />
        {/* Permite crear servicio desde la ficha del cliente */}
        <Route path="/clients/:id/services/new" element={<ServiceNew />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/services/:id/edit" element={<ServiceEdit />} />

        {/* Users */}
        <Route path="/users" element={<Users />} />
        <Route path="/users/new" element={<UserNew />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="/users/:id/edit" element={<UserEdit />} />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(<App />);
