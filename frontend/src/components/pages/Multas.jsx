import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'

const API_BASE_URL = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '') || '/api/v1'

export default function Multas() {
  const { currentUser, getAuthHeaders } = useAuth()
  const { can } = usePermissions()
  const [multas, setMultas] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [viviendas, setViviendas] = useState([])
  const [formData, setFormData] = useState({
    vivienda_id: '',
    monto: '',
    descripcion: '',
    fecha_aplicada: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (currentUser) {
      cargarMultas()
    }
  }, [currentUser])

  useEffect(() => {
    if (can.createMultas() && currentUser) {
      cargarViviendas()
    }
  }, [can, currentUser])

  const cargarViviendas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/viviendas/`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        }
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setViviendas(data.viviendas || [])
    } catch (error) {
      console.error('Error al cargar viviendas:', error)
    }
  }

  const cargarMultas = async () => {
    if (!currentUser) return
    
    setIsLoading(true)
    setError(null)
    try {
      // Si es admin/conserje/directiva, cargar todas las multas
      // Si es residente, cargar solo sus multas
      const endpoint = can.viewAllMultas() 
        ? `${API_BASE_URL}/multas/todas`
        : `${API_BASE_URL}/multas/residente/${currentUser.id}`
      
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        }
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setMultas(data.multas || data || [])
      setTotal(data.total || (data.multas || data).reduce((sum, m) => sum + (parseFloat(m.monto) || 0), 0))
    } catch (error) {
      console.error('Error al cargar multas:', error)
      setError('Error al cargar las multas')
    } finally {
      setIsLoading(false)
    }
  }

  const formatClp = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleCrearMulta = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch(`${API_BASE_URL}/multas/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          vivienda_id: parseInt(formData.vivienda_id),
          monto: parseFloat(formData.monto),
          descripcion: formData.descripcion,
          fecha_aplicada: formData.fecha_aplicada
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Error al crear la multa')
      }
      
      // Recargar multas
      await cargarMultas()
      
      // Cerrar modal y limpiar formulario
      setShowModal(false)
      setFormData({
        vivienda_id: '',
        monto: '',
        descripcion: '',
        fecha_aplicada: new Date().toISOString().split('T')[0]
      })
      
      alert('Multa creada correctamente')
    } catch (error) {
      console.error('Error al crear multa:', error)
      alert(error.message || 'Error al crear la multa')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando multas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {can.viewAllMultas() ? 'Multas' : 'Mis Multas'}
              </h1>
              <div className="group relative">
                <InfoIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  {can.viewAllMultas() 
                    ? 'Gestiona todas las multas del condominio. Las multas deben ser pagadas junto con los gastos comunes.'
                    : 'Consulta todas las multas aplicadas a tus viviendas. Las multas deben ser pagadas junto con los gastos comunes.'
                  }
                </div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              {can.viewAllMultas() 
                ? 'Gestión de multas del condominio'
                : 'Consulta las multas aplicadas a tus viviendas'
              }
            </p>
          </div>
          {can.createMultas() && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium focus-outline"
            >
              + Nueva Multa
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Multas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{multas.length}</p>
            </div>
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
              <ExclamationIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monto Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatClp(total)}</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
              <MoneyIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Estado</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {multas.length === 0 ? 'Al día' : 'Pendientes'}
              </p>
            </div>
            <div className={`p-3 rounded-full ${multas.length === 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-yellow-100 dark:bg-yellow-900'}`}>
              {multas.length === 0 ? (
                <CheckIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : (
                <WarningIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Multas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Historial de Multas</h2>
            <div className="group relative">
              <InfoIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                Lista completa de multas ordenadas por fecha de aplicación, desde la más reciente.
              </div>
            </div>
          </div>
        </div>
        
        {multas.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-block p-4 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <CheckIcon className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              ¡No tienes multas!
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Mantén el orden y respeta las normas del condominio.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {multas.map((multa) => (
              <div key={multa.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                        <ExclamationIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {multa.descripcion}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Vivienda: {multa.vivienda}
                        </p>
                      </div>
                    </div>
                    <div className="ml-11 space-y-1">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Fecha aplicada:</span> {formatDate(multa.fecha_aplicada)}
                      </p>
                      {multa.created_at && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Registrada el {formatDate(multa.created_at)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {formatClp(multa.monto)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Monto</p>
                    {can.editMultas() && (
                      <div className="flex space-x-2 mt-3">
                        <button
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm"
                        >
                          Editar
                        </button>
                        {can.deleteMultas() && (
                          <button
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 text-sm"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para crear multa */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Nueva Multa
              </h3>
            </div>
            <form onSubmit={handleCrearMulta} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vivienda *
                </label>
                <select
                  required
                  value={formData.vivienda_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, vivienda_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Seleccione una vivienda</option>
                  {viviendas.map(v => (
                    <option key={v.id} value={v.id}>{v.numero_vivienda}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monto (CLP) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={formData.monto}
                  onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Descripción de la multa..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Aplicación *
                </label>
                <input
                  type="date"
                  required
                  value={formData.fecha_aplicada}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_aplicada: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setFormData({
                      vivienda_id: '',
                      monto: '',
                      descripcion: '',
                      fecha_aplicada: new Date().toISOString().split('T')[0]
                    })
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus-outline"
                >
                  Crear Multa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Icon components
function InfoIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ExclamationIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function MoneyIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function WarningIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  )
}

