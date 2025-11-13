import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Rutas permitidas por rol según validaciones del backend
const roleRoutes = {
  super_admin: ['/dashboard', '/condominios', '/usuarios', '/reportes', '/perfil'],
  admin: ['/dashboard', '/gastos', '/pagos', '/residentes', '/multas', '/morosidad', '/reservas', '/anuncios', '/reportes', '/perfil'],
  conserje: ['/dashboard', '/pagos', '/reservas', '/novedades', '/residentes', '/multas', '/morosidad', '/perfil'],
  directiva: ['/dashboard', '/gastos', '/multas', '/anuncios', '/reportes', '/morosidad', '/perfil'],
  residente: ['/dashboard', '/pagos', '/multas', '/reservas', '/anuncios', '/perfil']
}

export default function ProtectedRoute({ children, path }) {
  const { currentUser } = useAuth()

  if (!currentUser) {
    return <Navigate to="/" replace />
  }

  // Verificar si el usuario tiene acceso a esta ruta
  const allowedRoutes = roleRoutes[currentUser.role] || []
  
  if (!allowedRoutes.includes(path)) {
    // Si no tiene acceso, redirigir al dashboard
    return <Navigate to="/dashboard" replace />
  }

  return children
}

