import React, { useState, useEffect } from 'react'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../context/AuthContext'
import { showToast } from '../ToastContainer'

// URL base de la API
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.trim().replace(/\/$/, '')
  }
  return import.meta.env.DEV ? '/api/v1' : 'http://localhost:8000/api/v1'
}
const API_BASE_URL = getApiBaseUrl()

export default function Gastos() {
  const { can } = usePermissions()
  const { currentUser, getAuthHeaders } = useAuth()
  const [gastos, setGastos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showModal, setShowModal] = useState(false)
  const [editingGasto, setEditingGasto] = useState(null)
  const [formData, setFormData] = useState({
    concepto: '',
    monto: '',
    fecha: '',
    estado: 'pendiente'
  })

  // Verificar permisos
  if (!can.viewGastos()) {
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

  useEffect(() => {
    if (currentUser) {
      cargarGastos()
    }
  }, [currentUser])

  const cargarGastos = async () => {
    if (!currentUser) return
    
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/gastos/usuario/${currentUser.id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        }
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      // Transformar datos del backend al formato esperado por el componente
      const gastosTransformados = data.map(gasto => ({
        id: gasto.id,
        concepto: `Gasto Común ${gasto.mes}/${gasto.ano} - Vivienda ${gasto.vivienda_numero}`,
        monto: gasto.monto_total,
        fecha: gasto.created_at ? gasto.created_at.split('T')[0] : `${gasto.ano}-${String(gasto.mes).padStart(2, '0')}-01`,
        estado: gasto.estado,
        vivienda_id: gasto.vivienda_id,
        vivienda_numero: gasto.vivienda_numero,
        mes: gasto.mes,
        ano: gasto.ano,
        vencimiento: gasto.vencimiento
      }))
      setGastos(gastosTransformados)
    } catch (error) {
      console.error('Error al cargar gastos:', error)
      setError('Error al cargar los gastos')
      showToast('Error al cargar los gastos', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Nota: La creación/edición de gastos requiere implementación en el backend
    // Por ahora, solo mostramos un mensaje
    showToast('La creación/edición de gastos requiere permisos de administrador y está en desarrollo', 'info')
    
    setShowModal(false)
    setEditingGasto(null)
    setFormData({ concepto: '', monto: '', fecha: '', estado: 'pendiente' })
    
    // Recargar gastos después de cualquier cambio
    if (currentUser) {
      await cargarGastos()
    }
  }

  const handleEdit = (gasto) => {
    setEditingGasto(gasto)
    setFormData({
      concepto: gasto.concepto,
      monto: gasto.monto.toString(),
      fecha: gasto.fecha,
      estado: gasto.estado
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      // Nota: La eliminación de gastos requiere implementación en el backend
      showToast('La eliminación de gastos requiere permisos de administrador y está en desarrollo', 'info')
      // Recargar gastos
      if (currentUser) {
        await cargarGastos()
      }
    }
  }

  const totalGastos = gastos.reduce((sum, gasto) => sum + (gasto.monto || 0), 0)
  const gastosPendientes = gastos.filter(g => g.estado === 'pendiente').length
  const gastosPagados = gastos.filter(g => g.estado === 'pagado').length

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando gastos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gastos Comunes</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {can.viewGastos() && !can.createGastos() 
              ? 'Consulta de gastos del condominio (solo lectura)'
              : 'Gestión de gastos del condominio'
            }
          </p>
        </div>
        {can.createGastos() && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium focus-outline"
          >
            + Nuevo Gasto
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Gastos</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalGastos.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Gastos Pendientes</h3>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{gastosPendientes}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Gastos Pagados</h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{gastosPagados}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Concepto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {error && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-red-600 dark:text-red-400">
                    {error}
                  </td>
                </tr>
              )}
              {gastos.length === 0 && !error ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No hay gastos registrados
                  </td>
                </tr>
              ) : (
                gastos.map((gasto) => (
                <tr key={gasto.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {gasto.concepto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${gasto.monto.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(gasto.fecha).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      gasto.estado === 'pagado' 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                        : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                    }`}>
                      {gasto.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {can.editGastos() && (
                      <div className="flex space-x-2">
                        {can.editGastos() && (
                          <button
                            onClick={() => handleEdit(gasto)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          >
                            Editar
                          </button>
                        )}
                        {can.deleteGastos() && (
                          <button
                            onClick={() => handleDelete(gasto.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    )}
                    {!can.editGastos() && (
                      <span className="text-gray-400 dark:text-gray-500 text-xs">Solo lectura</span>
                    )}
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingGasto ? 'Editar Gasto' : 'Nuevo Gasto'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Concepto
                </label>
                <input
                  type="text"
                  required
                  value={formData.concepto}
                  onChange={(e) => setFormData(prev => ({ ...prev, concepto: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monto
                </label>
                <input
                  type="number"
                  required
                  value={formData.monto}
                  onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  value={formData.fecha}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingGasto(null)
                    setFormData({ concepto: '', monto: '', fecha: '', estado: 'pendiente' })
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus-outline"
                >
                  {editingGasto ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}