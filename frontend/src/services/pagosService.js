// URL base de la API
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.trim().replace(/\/$/, '')
  }
  return import.meta.env.DEV ? '/api/v1' : 'http://localhost:8000/api/v1'
}

const API_BASE_URL = getApiBaseUrl()

export async function fetchPagosDesglose(usuarioId, signal) {
  const token = localStorage.getItem('authToken')
  const headers = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const res = await fetch(`${API_BASE_URL}/pagos/residente/${usuarioId}`, {
    signal,
    headers
  })
  
  if (!res.ok) {
    let detail = ''
    try { 
      const errorData = await res.json()
      detail = errorData.detail || errorData.message || ''
    } catch {
      try { detail = await res.text() } catch {}
    }
    throw new Error(`Error al cargar pagos (${res.status}): ${detail || res.statusText}`)
  }
  return res.json()
}
