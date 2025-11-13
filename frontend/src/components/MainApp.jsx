/**
 * Componente principal de la aplicación después del login.
 * 
 * Este componente:
 * - Renderiza el layout principal con header, sidebar y contenido
 * - Maneja el enrutamiento de todas las páginas protegidas
 * - Controla el estado del sidebar (abierto/cerrado) en móviles
 * - Integra el sistema de permisos mediante ProtectedRoute
 * 
 * Estructura:
 * - Header: Barra superior con logo, usuario y controles (tema, logout)
 * - Sidebar: Navegación lateral con menú según el rol del usuario
 * - Main Content: Área de contenido donde se renderizan las páginas
 * - ProtectedRoute: Wrapper que valida permisos antes de renderizar cada página
 */

import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Sidebar from './Sidebar'
import ProtectedRoute from './ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Gastos from './pages/Gastos'
import Pagos from './pages/Pagos'
import Morosidad from './pages/Morosidad'
import Reservas from './pages/Reservas'
import Residentes from './pages/Residentes'
import Usuarios from './pages/Usuarios'
import Condominios from './pages/Condominios'
import Perfil from './pages/Perfil'
import Multas from './pages/Multas'
import Anuncios from './pages/Anuncios'
import Novedades from './pages/Novedades'
import Reportes from './pages/Reportes'

export default function MainApp() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { currentUser, logout } = useAuth()
  const { toggleTheme, isDarkMode } = useTheme()

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 transition-colors duration-300 min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Mobile menu button */}
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus-outline"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <div className="flex items-center">
            <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">EspacioAdmin</h1>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus-outline"
              title="Cambiar tema"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* User info */}
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {currentUser.name.charAt(0)}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{currentUser.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{currentUser.role.replace('_', ' ')}</p>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus-outline"
              title="Cerrar sesión"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main content */}
        <main className="flex-1 md:ml-64">
          <div className="p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<ProtectedRoute path="/dashboard"><Dashboard /></ProtectedRoute>} />
              <Route path="/gastos" element={<ProtectedRoute path="/gastos"><Gastos /></ProtectedRoute>} />
              <Route path="/pagos" element={<ProtectedRoute path="/pagos"><Pagos /></ProtectedRoute>} />
              <Route path="/morosidad" element={<ProtectedRoute path="/morosidad"><Morosidad /></ProtectedRoute>} />
              <Route path="/reservas" element={<ProtectedRoute path="/reservas"><Reservas /></ProtectedRoute>} />
              <Route path="/residentes" element={<ProtectedRoute path="/residentes"><Residentes /></ProtectedRoute>} />
              <Route path="/usuarios" element={<ProtectedRoute path="/usuarios"><Usuarios /></ProtectedRoute>} />
              <Route path="/condominios" element={<ProtectedRoute path="/condominios"><Condominios /></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute path="/perfil"><Perfil /></ProtectedRoute>} />
              <Route path="/multas" element={<ProtectedRoute path="/multas"><Multas /></ProtectedRoute>} />
              <Route path="/anuncios" element={<ProtectedRoute path="/anuncios"><Anuncios /></ProtectedRoute>} />
              <Route path="/novedades" element={<ProtectedRoute path="/novedades"><Novedades /></ProtectedRoute>} />
              <Route path="/reportes" element={<ProtectedRoute path="/reportes"><Reportes /></ProtectedRoute>} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}