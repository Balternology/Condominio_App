/**
 * Componente raíz de la aplicación React.
 * 
 * Este componente:
 * - Configura los providers globales (Auth, Theme, Router)
 * - Maneja la navegación entre LoginScreen y MainApp según el estado de autenticación
 * - Muestra un loader mientras se verifica la sesión del usuario
 * 
 * Estructura:
 * - AuthProvider: Gestiona el estado de autenticación y tokens JWT
 * - ThemeProvider: Gestiona el tema (dark/light mode)
 * - Router: Maneja el enrutamiento de la aplicación
 * - ToastContainer: Muestra notificaciones toast en toda la aplicación
 */

import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginScreen from './components/LoginScreen'
import MainApp from './components/MainApp'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ToastContainer from './components/ToastContainer'

/**
 * Componente interno que decide qué mostrar según el estado de autenticación.
 * Debe estar dentro de AuthProvider para acceder a useAuth().
 */
function AppContent() {
  const { currentUser, isLoading } = useAuth()

  // Mostrar un loader mientras se verifica la sesión desde localStorage
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  // Renderizar MainApp si hay usuario autenticado, LoginScreen si no
  return (
    <div className="min-h-screen">
      <ToastContainer />
      {currentUser ? <MainApp /> : <LoginScreen />}
    </div>
  )
}

/**
 * Componente principal de la aplicación.
 * Configura todos los providers necesarios y el router.
 */
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  )
}
