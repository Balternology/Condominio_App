/**
 * Servicio centralizado para hacer peticiones a la API con autenticación JWT
 */

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.trim().replace(/\/$/, '')
  }
  return import.meta.env.DEV ? '/api/v1' : 'http://localhost:8000/api/v1'
}

const API_BASE_URL = getApiBaseUrl()

/**
 * Obtiene el token de autenticación desde localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('authToken')
}

/**
 * Realiza una petición fetch con autenticación JWT
 * @param {string} endpoint - Endpoint relativo (ej: '/auth/login')
 * @param {RequestInit} options - Opciones de fetch
 * @returns {Promise<Response>}
 */
export const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken()
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const config = {
    ...options,
    headers,
  }

  try {
    const response = await fetch(url, config)
    
    // Si el token expiró o es inválido, limpiar sesión
    if (response.status === 401 && token) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('authTokenExpiresAt')
      localStorage.removeItem('currentUser')
      // Redirigir al login si estamos en una ruta protegida
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return response
  } catch (error) {
    console.error('Error en apiFetch:', error)
    throw error
  }
}

/**
 * Helper para peticiones GET
 */
export const apiGet = async (endpoint, options = {}) => {
  return apiFetch(endpoint, { ...options, method: 'GET' })
}

/**
 * Helper para peticiones POST
 */
export const apiPost = async (endpoint, data, options = {}) => {
  return apiFetch(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Helper para peticiones PUT
 */
export const apiPut = async (endpoint, data, options = {}) => {
  return apiFetch(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * Helper para peticiones DELETE
 */
export const apiDelete = async (endpoint, options = {}) => {
  return apiFetch(endpoint, { ...options, method: 'DELETE' })
}

export default {
  fetch: apiFetch,
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  getBaseUrl: () => API_BASE_URL,
}

