import React, { useState, useEffect } from 'react'
import { FiCalendar, FiClock, FiDollarSign, FiX, FiCheck, FiAlertCircle, FiFilter } from 'react-icons/fi'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../context/AuthContext'
import ReservasService from '../../services/reservasService'

const API_BASE_URL = (import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '') || 'http://localhost:8000/api/v1').replace(/\/$/, '')

export default function MisReservas({ usuarioId, onNuevaReserva }) {
  const { can } = usePermissions()
  const { getAuthHeaders } = useAuth()
  const [reservas, setReservas] = useState([])
  const [reservasFiltradas, setReservasFiltradas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('todas') // todas, activas, pasadas, canceladas
  const [espacioFiltro, setEspacioFiltro] = useState('todos')
  const [cancelandoId, setCancelandoId] = useState(null)

  useEffect(() => {
    if (usuarioId) {
      cargarReservas()
    }
  }, [usuarioId])

  useEffect(() => {
    aplicarFiltros()
  }, [reservas, filtro, espacioFiltro])

  const cargarReservas = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Si es admin/conserje, cargar todas las reservas
      // Si es residente, cargar solo sus reservas
      const endpoint = can.viewAllReservas()
        ? `${API_BASE_URL}/reservas/todas`
        : `${API_BASE_URL}/reservas/usuario/${usuarioId}`
      
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
      setReservas(data || [])
    } catch (error) {
      console.error('Error al cargar reservas:', error)
      setError('Error al cargar las reservas')
    } finally {
      setIsLoading(false)
    }
  }

  const aplicarFiltros = () => {
    let filtradas = [...reservas]

    // Filtro por estado
    if (filtro === 'activas') {
      filtradas = filtradas.filter(r => {
        const fechaFin = new Date(r.fecha_hora_fin)
        return fechaFin >= new Date()
      })
    } else if (filtro === 'pasadas') {
      filtradas = filtradas.filter(r => {
        const fechaFin = new Date(r.fecha_hora_fin)
        return fechaFin < new Date()
      })
    }

    // Filtro por espacio
    if (espacioFiltro !== 'todos') {
      filtradas = filtradas.filter(r => 
        r.espacio.toLowerCase().includes(espacioFiltro.toLowerCase())
      )
    }

    // Ordenar: activas primero, luego por fecha
    filtradas.sort((a, b) => {
      const fechaA = new Date(a.fecha_hora_inicio)
      const fechaB = new Date(b.fecha_hora_inicio)
      const ahora = new Date()
      
      const aActiva = fechaA >= ahora
      const bActiva = fechaB >= ahora
      
      if (aActiva && !bActiva) return -1
      if (!aActiva && bActiva) return 1
      return fechaB - fechaA
    })

    setReservasFiltradas(filtradas)
  }

  const handleCancelar = async (reservaId) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
      return
    }

    setCancelandoId(reservaId)
    try {
      const response = await fetch(`${API_BASE_URL}/reservas/${reservaId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Error al cancelar la reserva')
      }
      
      // Recargar reservas
      await cargarReservas()
    } catch (error) {
      console.error('Error al cancelar reserva:', error)
      alert(error.message || 'Error al cancelar la reserva')
    } finally {
      setCancelandoId(null)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatClp = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getEstadoReserva = (reserva) => {
    const ahora = new Date()
    const fechaInicio = new Date(reserva.fecha_hora_inicio)
    const fechaFin = new Date(reserva.fecha_hora_fin)

    if (fechaFin < ahora) {
      return { 
        texto: 'Finalizada', 
        color: 'gray',
        bgColor: 'bg-gray-100 dark:bg-gray-900',
        textColor: 'text-gray-600 dark:text-gray-400',
        icon: FiCheck 
      }
    } else if (fechaInicio <= ahora && fechaFin >= ahora) {
      return { 
        texto: 'En curso', 
        color: 'blue',
        bgColor: 'bg-blue-100 dark:bg-blue-900',
        textColor: 'text-blue-600 dark:text-blue-400',
        icon: FiClock 
      }
    } else {
      return { 
        texto: 'Próxima', 
        color: 'green',
        bgColor: 'bg-green-100 dark:bg-green-900',
        textColor: 'text-green-600 dark:text-green-400',
        icon: FiCalendar 
      }
    }
  }

  const espaciosUnicos = [...new Set(reservas.map(r => r.espacio))]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando reservas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header con botón Nueva Reserva */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {can.viewAllReservas() ? 'Todas las Reservas' : 'Mis Reservas'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {can.viewAllReservas() 
              ? 'Gestiona todas las reservas de espacios comunes del condominio'
              : 'Gestiona todas tus reservas de espacios comunes'
            }
          </p>
        </div>
        {can.createReservas() && (
          <button
            onClick={onNuevaReserva}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <FiCalendar className="w-4 h-4" />
            Nueva Reserva
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <FiFilter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros:</span>
          </div>
          
          {/* Filtro por estado */}
          <div className="flex gap-2">
            {['todas', 'activas', 'pasadas'].map((opcion) => (
              <button
                key={opcion}
                onClick={() => setFiltro(opcion)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filtro === opcion
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {opcion.charAt(0).toUpperCase() + opcion.slice(1)}
              </button>
            ))}
          </div>

          {/* Filtro por espacio */}
          <select
            value={espacioFiltro}
            onChange={(e) => setEspacioFiltro(e.target.value)}
            className="px-3 py-1 rounded-lg text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="todos">Todos los espacios</option>
            {espaciosUnicos.map((espacio) => (
              <option key={espacio} value={espacio}>{espacio}</option>
            ))}
          </select>

          {/* Contador */}
          <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
            {reservasFiltradas.length} de {reservas.length} reservas
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Lista de Reservas */}
      {reservasFiltradas.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="inline-block p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
            <FiCalendar className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {reservas.length === 0 ? 'No tienes reservas' : 'No hay reservas con estos filtros'}
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {reservas.length === 0 
              ? 'Crea tu primera reserva de un espacio común'
              : 'Intenta cambiar los filtros para ver más resultados'
            }
          </p>
          {reservas.length === 0 && (
            <button
              onClick={onNuevaReserva}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Crear Primera Reserva
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reservasFiltradas.map((reserva) => {
            const estado = getEstadoReserva(reserva)
            const EstadoIcon = estado.icon
            const puedeCancelar = new Date(reserva.fecha_hora_inicio) > new Date()

            return (
              <div
                key={reserva.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-full ${estado.bgColor}`}>
                        <EstadoIcon className={`w-5 h-5 ${estado.textColor}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {reserva.espacio}
                        </h3>
                        {can.viewAllReservas() && reserva.usuario_nombre && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            Reservado por: {reserva.usuario_nombre}
                          </p>
                        )}
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${estado.bgColor} ${estado.textColor}`}>
                          {estado.texto}
                        </span>
                      </div>
                    </div>

                    <div className="ml-11 space-y-2">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <FiCalendar className="w-4 h-4" />
                        <span className="font-medium">{formatDate(reserva.fecha_hora_inicio)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <FiClock className="w-4 h-4" />
                        <span>
                          {formatTime(reserva.fecha_hora_inicio)} - {formatTime(reserva.fecha_hora_fin)}
                        </span>
                      </div>
                      {reserva.monto_pago > 0 && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <FiDollarSign className="w-4 h-4" />
                          <span>
                            {formatClp(reserva.monto_pago)} - 
                            <span className={`ml-2 px-2 py-1 rounded text-xs ${
                              reserva.estado_pago === 'pagado' 
                                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                            }`}>
                              {reserva.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente'}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(puedeCancelar || can.manageReservas()) && (
                    <button
                      onClick={() => handleCancelar(reserva.id)}
                      disabled={cancelandoId === reserva.id}
                      className="ml-4 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={can.manageReservas() ? "Cancelar reserva (Administrador)" : "Cancelar reserva"}
                    >
                      {cancelandoId === reserva.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                      ) : (
                        <FiX className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

