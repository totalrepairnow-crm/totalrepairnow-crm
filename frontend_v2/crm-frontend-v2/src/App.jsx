import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Login from './pages/Login'
import Clients from './pages/Clients'
import { getToken } from './lib/api'

function RequireAuth({ children }) {
  const loc = useLocation()
  const t = getToken()
  if (!t) return <Navigate to="/login" replace state={{ from: loc }} />
  return children
}

function Dashboard() {
  return <div className="container" style={{margin:"24px auto"}}><h1>Dashboard</h1><p>WIP</p></div>
}
function Users() {
  return <div className="container" style={{margin:"24px auto"}}><h1>Users</h1><p>WIP</p></div>
}

export default function App() {
  return (
    <BrowserRouter basename="/v2">
      <Header />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/clients"   element={<RequireAuth><Clients /></RequireAuth>} />
        <Route path="/users"     element={<RequireAuth><Users /></RequireAuth>} />

        <Route path="/" element={<Navigate to="/clients" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

