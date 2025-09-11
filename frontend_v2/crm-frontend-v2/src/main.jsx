// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles.css";

import Header from "./components/Header";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import ClientEdit from "./pages/ClientEdit";
import ClientNew from "./pages/ClientNew";

import Services from "./pages/Services";

import Users from "./pages/Users";
import UserDetail from "./pages/UserDetail";
import UserEdit from "./pages/UserEdit";
import UserNew from "./pages/UserNew";

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/new" element={<ClientNew />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/clients/:id/edit" element={<ClientEdit />} />

        <Route path="/services" element={<Services />} />

        <Route path="/users" element={<Users />} />
        <Route path="/users/new" element={<UserNew />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="/users/:id/edit" element={<UserEdit />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
