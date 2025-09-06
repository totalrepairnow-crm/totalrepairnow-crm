import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'

import Header from './components/Header'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientNew from './pages/ClientNew'
import ClientDetail from './pages/ClientDetail'
import Users from './pages/Users'

import { getToken } from './lib/api'
import './styles.css'

function Protected() {
  const authed = !!getToken()
  return authed ? <Outlet /> : <Navigate to="/login" replace />
}

function ProtectedLayout() {
  return (
    <>
      <Header />
      <div className="page">
        <Outlet />
      </div>
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter basename="/v2">
    <Routes>
      {/* público */}
      <Route path="/login" element={<Login />} />

      {/* redirección raíz */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* privado (con header) */}
      <Route element={<Protected />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/new" element={<ClientNew />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/users" element={<Users />} />
        </Route>
      </Route>

      {/* catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
)
