/**
 * Contexto de autenticación para la aplicación React.
 * 
 * Este módulo proporciona:
 * - Gestión del estado de autenticación (usuario, token JWT)
 * - Funciones de login y logout
 * - Persistencia de sesión en localStorage
 * - Función para obtener headers de autenticación
 * - Validación de expiración de tokens
 * 
 * El token JWT se almacena en localStorage junto con su fecha de expiración.
 * Al recargar la página, se restaura la sesión si el token aún es válido.
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'

const AuthContext = createContext()

/**
 * Hook para acceder al contexto de autenticación.
 * Debe usarse dentro de un componente envuelto por AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// ============================================================================
// Configuración de la API
// ============================================================================
/**
 * Obtiene la URL base de la API desde variables de entorno o valores por defecto.
 * En desarrollo usa ruta relativa (proxy de Vite), en producción usa URL completa.
 */
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.trim().replace(/\/$/, '')
  }
  return import.meta.env.DEV ? '/api/v1' : 'http://localhost:8000/api/v1'
}
const API_BASE_URL = getApiBaseUrl()

// ============================================================================
// Constantes para localStorage
// ============================================================================
const TOKEN_KEY = 'authToken'           // Clave para almacenar el token JWT
const TOKEN_EXP_KEY = 'authTokenExpiresAt'  // Clave para almacenar la fecha de expiración
const USER_KEY = 'currentUser'         // Clave para almacenar los datos del usuario

/**
 * Verifica si un token ha expirado comparando la fecha de expiración con la fecha actual.
 * 
 * @param {string} expiresAt - Fecha de expiración en formato ISO string
 * @returns {boolean} - True si el token ha expirado, False si aún es válido
 */
const isTokenExpired = (expiresAt) => {
  if (!expiresAt) return false
  const expiresDate = new Date(expiresAt)
  return Number.isNaN(expiresDate.getTime()) ? false : expiresDate.getTime() <= Date.now()
}

/**
 * Provider del contexto de autenticación.
 * 
 * Gestiona:
 * - Estado del usuario actual y token JWT
 * - Restauración de sesión desde localStorage al cargar la app
 * - Funciones de login y logout
 * - Headers de autenticación para peticiones API
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [authToken, setAuthToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Efecto que se ejecuta al montar el componente.
   * Restaura la sesión desde localStorage si el token aún es válido.
   */
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY)
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedExpiry = localStorage.getItem(TOKEN_EXP_KEY)

    // Restaurar sesión solo si el token existe y no ha expirado
    if (storedToken && !isTokenExpired(storedExpiry) && storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser))
        setAuthToken(storedToken)
      } catch (error) {
        console.error('Error al cargar usuario desde localStorage:', error)
        // Limpiar datos corruptos
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(TOKEN_EXP_KEY)
      }
    } else {
      // Limpiar datos expirados o inválidos
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(TOKEN_EXP_KEY)
    }

    setIsLoading(false)
  }, [])

  /**
   * Persiste la sesión del usuario en el estado y localStorage.
   * 
   * @param {Object} user - Objeto con datos del usuario
   * @param {string} token - Token JWT
   * @param {number} expiresInSeconds - Tiempo de expiración en segundos
   */
  const persistSession = (user, token, expiresInSeconds) => {
    setCurrentUser(user)
    setAuthToken(token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    localStorage.setItem(TOKEN_KEY, token)
    if (expiresInSeconds) {
      const expiryDate = new Date(Date.now() + expiresInSeconds * 1000)
      localStorage.setItem(TOKEN_EXP_KEY, expiryDate.toISOString())
    } else {
      localStorage.removeItem(TOKEN_EXP_KEY)
    }
  }

  /**
   * Limpia la sesión del usuario del estado y localStorage.
   */
  const clearSession = () => {
    setCurrentUser(null)
    setAuthToken(null)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXP_KEY)
  }

  /**
   * Inicia sesión con email y contraseña.
   * 
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<Object>} - { success: boolean, message?: string }
   */
  const login = async (email, password) => {
    try {
      const loginUrl = `${API_BASE_URL}/auth/login`
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const contentType = response.headers.get('content-type')
      let data
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const rawText = await response.text()
        try {
          data = rawText ? JSON.parse(rawText) : {}
        } catch {
          data = { detail: rawText }
        }
      }

      if (!response.ok) {
        const errorMessage =
          data.detail ||
          data.message ||
          (response.status === 503
            ? 'Error al conectar con la base de datos. Verifica la disponibilidad del backend.'
            : response.status === 401
              ? 'Credenciales inválidas. Verifica tu email y contraseña.'
              : 'Error al iniciar sesión')

        return { success: false, message: errorMessage }
      }

      const user = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.nombre_completo,
        role: data.user.rol,
      }

      persistSession(user, data.access_token, data.expires_in)
      return { success: true }
    } catch (error) {
      console.error('Error en login:', error)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        return {
          success: false,
          message: 'Error al conectar con el servidor. Verifica que el backend esté ejecutándose en http://localhost:8000',
        }
      }

      return {
        success: false,
        message: error.message || 'Error inesperado al iniciar sesión',
      }
    }
  }

  /**
   * Cierra la sesión del usuario.
   */
  const logout = () => {
    clearSession()
  }

  /**
   * Función memoizada que retorna los headers de autenticación para peticiones API.
   * Lee el token desde el estado o localStorage como fallback.
   * 
   * @returns {Object} - Headers con Authorization Bearer token o objeto vacío
   */
  const getAuthHeaders = useMemo(() => {
    return () => {
      // Leer el token actual desde el estado o localStorage (fallback)
      const token = authToken || localStorage.getItem(TOKEN_KEY)
      if (!token) {
        return {}
      }
      return {
        Authorization: `Bearer ${token}`,
      }
    }
  }, [authToken])

  const value = {
    currentUser,
    authToken,
    isLoading,
    login,
    logout,
    getAuthHeaders,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}