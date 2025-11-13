import React, { useEffect, useState, useCallback, useRef } from 'react'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../context/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '') || '/api/v1'

export default function Residentes() {
  const { can } = usePermissions()
  const { currentUser, getAuthHeaders } = useAuth()
  const [residentes, setResidentes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const hasLoadedRef = useRef(false)
  
  // Verificar permisos
  if (!can.viewResidentes()) {
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
  
  const cargarResidentes = useCallback(async () => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/residentes/`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        }
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setResidentes(data.residentes || [])
    } catch (error) {
      console.error('Error al cargar residentes:', error)
      setError('Error al cargar los residentes')
      hasLoadedRef.current = false
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (can.viewResidentes() && currentUser && !hasLoadedRef.current) {
      cargarResidentes()
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
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando residentes...</p>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Residentes</h1>
            <p className="text-gray-600 dark:text-gray-300">
              {can.createResidentes() 
                ? 'Gestión completa de residentes del condominio'
                : 'Consulta de información de residentes'
              }
            </p>
          </div>
          {can.createResidentes() && (
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium focus-outline">
              + Nuevo Residente
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
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Residentes</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{residentes.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Con Viviendas</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {residentes.filter(r => r.viviendas && r.viviendas.length > 0).length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Activos</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{residentes.length}</p>
        </div>
      </div>

      {/* Lista de Residentes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Viviendas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Último Acceso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {residentes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No hay residentes registrados
                  </td>
                </tr>
              ) : (
                residentes.map((residente) => (
                  <tr key={residente.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {residente.nombre_completo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {residente.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {residente.viviendas && residente.viviendas.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {residente.viviendas.map((v, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                              {v.numero}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">Sin vivienda</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {residente.last_login ? formatDate(residente.last_login) : 'Nunca'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}