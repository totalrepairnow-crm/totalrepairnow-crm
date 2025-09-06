import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Clients from './pages/Clients.jsx'
import ClientDetail from './pages/ClientDetail.jsx'
import ClientNew from './pages/ClientNew.jsx'
import Users from './pages/Users.jsx'
import { getToken } from './lib/api.js'
import './styles.css'

function Protected({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <>
      <Header />
            <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/clients" element={<Protected><Clients /></Protected>} />
        <Route path="/clients/new" element={<Protected><ClientNew /></Protected>} />
        <Route path="/clients/:id" element={<Protected><ClientDetail /></Protected>} />
        <Route path="/users" element={<Protected><Users /></Protected>} />
        <Route path="*" element={<div className="page">Not found</div>} />
      </Routes>

    </>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/v2">
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

