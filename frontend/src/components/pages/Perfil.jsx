import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '') || '/api/v1'

function InfoIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default function Perfil() {
  const { currentUser, getAuthHeaders } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [perfilData, setPerfilData] = useState(null)
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    telefono: '',
    direccion: ''
  })
  const [notificaciones, setNotificaciones] = useState({
    email: true,
    push: true
  })

  const displayName = perfilData?.nombre_completo || currentUser?.name || 'Usuario'
  const displayEmail = perfilData?.email || currentUser?.email || ''
  const displayRole = currentUser?.role ? currentUser.role.replace('_', ' ') : 'usuario'
  const displayInitial = displayName.charAt(0).toUpperCase()

  useEffect(() => {
    if (currentUser) {
      cargarPerfil()
    }
  }, [currentUser])

  useEffect(() => {
    if (currentUser?.id && perfilData) {
      // Cargar notificaciones desde el perfil cuando esté disponible
      if (perfilData.notificaciones_email !== undefined || perfilData.notificaciones_push !== undefined) {
        setNotificaciones({
          email: perfilData.notificaciones_email ?? true,
          push: perfilData.notificaciones_push ?? true
        })
      } else {
        // Si no están en perfilData, cargar directamente
        cargarNotificaciones()
      }
    }
  }, [currentUser?.id, perfilData])

  const cargarNotificaciones = async () => {
    if (!currentUser?.id) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/perfil/${currentUser.id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setNotificaciones({
          email: data.notificaciones_email ?? true,
          push: data.notificaciones_push ?? true
        })
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error)
      // Fallback a valores por defecto si falla
      setNotificaciones({ email: true, push: true })
    }
  }

  const guardarNotificaciones = async (tipo, valor) => {
    if (!currentUser?.id) return
    
    const nuevasNotificaciones = {
      ...notificaciones,
      [tipo]: valor
    }
    
    // Actualizar estado inmediatamente para mejor UX
    setNotificaciones(nuevasNotificaciones)
    
    try {
      const response = await fetch(`${API_BASE_URL}/perfil/${currentUser.id}/notificaciones`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          notificaciones_email: tipo === 'email' ? valor : notificaciones.email,
          notificaciones_push: tipo === 'push' ? valor : notificaciones.push
        })
      })
      
      if (!response.ok) {
        // Revertir cambio si falla
        setNotificaciones(notificaciones)
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Error al guardar preferencias')
      }
    } catch (error) {
      console.error('Error al guardar notificaciones:', error)
      // Revertir cambio
      setNotificaciones(notificaciones)
      alert('Error al guardar las preferencias. Por favor, intenta nuevamente.')
    }
  }

  const cargarPerfil = async () => {
    if (!currentUser) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/perfil/${currentUser.id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        }
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }
      
      const data = await response.json()
      setPerfilData(data)
      setFormData({
        nombre_completo: data.nombre_completo || '',
        email: data.email || '',
        telefono: '', // No hay campo teléfono en la BD aún
        direccion: data.viviendas && data.viviendas.length > 0 
          ? data.viviendas.map(v => v.numero).join(', ')
          : ''
      })
    } catch (error) {
      console.error('Error al cargar perfil:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentUser) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/perfil/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          nombre_completo: formData.nombre_completo,
          email: formData.email
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Error al actualizar perfil')
      }
      
      const data = await response.json()
      // Actualizar el contexto de autenticación
      const updatedUser = {
        ...currentUser,
        name: data.nombre_completo,
        email: data.email
      }
      localStorage.setItem('currentUser', JSON.stringify(updatedUser))
      window.location.reload() // Recargar para actualizar el contexto
      
      setIsEditing(false)
    } catch (error) {
      console.error('Error al actualizar perfil:', error)
      alert(error.message || 'Error al actualizar el perfil')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
          <div className="group relative">
            <InfoIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 cursor-help" />
            <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              Actualiza tu información personal. El email debe ser único y válido.
            </div>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300">Gestiona tu información personal</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header del perfil */}
          <div className="px-6 py-6 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">{displayInitial}</span>
              </div>
              <div className="ml-6">
                <h2 className="text-2xl font-bold text-white">{displayName}</h2>
                <p className="text-blue-100 capitalize">{displayRole}</p>
                <p className="text-blue-200">{displayEmail}</p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Información Personal</h3>
                <div className="group relative">
                  <InfoIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    Puedes actualizar tu nombre completo y email. El rol no puede ser modificado.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium focus-outline"
              >
                {isEditing ? 'Cancelar' : 'Editar'}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={formData.nombre_completo}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre_completo: e.target.value }))}
                    disabled={!isEditing || isLoading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rol en el Sistema
                </label>
                <input
                  type="text"
                  value={displayRole.toUpperCase()}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  El rol no puede ser modificado. Contacta al administrador si necesitas cambios.
                </p>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus-outline"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus-outline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Configuraciones adicionales */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configuraciones</h3>
            <div className="group relative">
              <InfoIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                Configura tus preferencias de notificaciones y comunicaciones.
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Notificaciones por Email
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Recibir notificaciones importantes por correo
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={notificaciones.email}
                  onChange={(e) => guardarNotificaciones('email', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Notificaciones Push
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Recibir notificaciones en tiempo real
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={notificaciones.push}
                  onChange={(e) => guardarNotificaciones('push', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}