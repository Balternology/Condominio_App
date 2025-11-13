import React, { useEffect, useState, useCallback, useRef } from 'react'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../context/AuthContext'
import { formatClp } from '../../services/ufService'

const API_BASE_URL = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '') || '/api/v1'

export default function Morosidad() {
  const { can } = usePermissions()
  const { currentUser, getAuthHeaders } = useAuth()
  const [morosidad, setMorosidad] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const hasLoadedRef = useRef(false)
  
  // Verificar permisos
  if (!can.viewMorosidad()) {
    return (
      <div className="animate-fade-in">
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-600 dark:text-red-400">
            No tienes permiso para acceder a esta sección.
          </p>
        </div>
      </div>
    )
  }
  
  const cargarMorosidad = useCallback(async () => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/morosidad/`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        }
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setMorosidad(data)
    } catch (error) {
      console.error('Error al cargar morosidad:', error)
      setError('Error al cargar la información de morosidad')
      hasLoadedRef.current = false
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (can.viewMorosidad() && currentUser && !hasLoadedRef.current) {
      cargarMorosidad()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id])

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
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando morosidad...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Morosidad</h1>
            <p className="text-gray-600 dark:text-gray-300">
              {can.manageMorosidad() 
                ? 'Gestión y control de pagos atrasados'
                : 'Consulta de pagos atrasados'
              }
            </p>
          </div>
          {can.manageMorosidad() && (
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium focus-outline">
              Generar Reporte
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

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Viviendas Morosas</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {morosidad?.total_viviendas || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Adeudado</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {morosidad?.total_morosidad ? formatClp(morosidad.total_morosidad) : '$0'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Promedio por Vivienda</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {morosidad?.total_viviendas > 0 && morosidad?.total_morosidad
              ? formatClp(morosidad.total_morosidad / morosidad.total_viviendas)
              : '$0'
            }
          </p>
        </div>
      </div>

      {/* Lista de Viviendas Morosas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Viviendas con Pagos Atrasados
          </h2>
        </div>
        
        {!morosidad || morosidad.viviendas_morosas?.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-block p-4 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              ¡No hay morosidad!
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Todas las viviendas están al día con sus pagos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vivienda</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Residentes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Adeudado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Días de Atraso</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {morosidad.viviendas_morosas.map((vivienda) => (
                  <tr key={vivienda.vivienda_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {vivienda.numero_vivienda}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {vivienda.residentes && vivienda.residentes.length > 0 ? (
                        <div className="flex flex-col">
                          {vivienda.residentes.map((r, idx) => (
                            <span key={idx} className="text-xs">{r.nombre}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">Sin residentes</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600 dark:text-red-400">
                      {formatClp(vivienda.total_adeudado)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        vivienda.dias_atraso > 90
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          : vivienda.dias_atraso > 30
                          ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                          : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      }`}>
                        {vivienda.dias_atraso} días
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex flex-col text-xs">
                        <span>Gastos: {vivienda.gastos_pendientes}</span>
                        <span>Multas: {vivienda.multas_pendientes}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}