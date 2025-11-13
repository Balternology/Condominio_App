import React, { useState } from 'react'
import { usePermissions } from '../../hooks/usePermissions'
import { FiBook, FiPlus, FiEdit, FiTrash2, FiCalendar, FiUser } from 'react-icons/fi'

function InfoIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default function Novedades() {
  const { can } = usePermissions()
  const [novedades, setNovedades] = useState([
    {
      id: 1,
      fecha: '2024-01-15',
      hora: '14:30',
      tipo: 'Mantenimiento',
      descripcion: 'Se realizó mantenimiento preventivo en los ascensores. Todo funcionando correctamente.',
      autor: 'Juan Pérez',
      ubicacion: 'Edificio A'
    },
    {
      id: 2,
      fecha: '2024-01-14',
      hora: '09:00',
      tipo: 'Limpieza',
      descripcion: 'Limpieza profunda de áreas comunes completada. Se solicita mantener el orden.',
      autor: 'Juan Pérez',
      ubicacion: 'Áreas Comunes'
    }
  ])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().slice(0, 5),
    tipo: 'General',
    descripcion: '',
    ubicacion: ''
  })

  const tiposNovedades = ['General', 'Mantenimiento', 'Limpieza', 'Seguridad', 'Otro']

  const handleSubmit = (e) => {
    e.preventDefault()
    const nuevaNovedad = {
      id: Date.now(),
      ...formData,
      autor: 'Conserje Actual' // En producción vendría del contexto
    }
    setNovedades([nuevaNovedad, ...novedades])
    setShowModal(false)
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().slice(0, 5),
      tipo: 'General',
      descripcion: '',
      ubicacion: ''
    })
  }

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta novedad?')) {
      setNovedades(novedades.filter(n => n.id !== id))
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTipoColor = (tipo) => {
    const colors = {
      'General': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      'Mantenimiento': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      'Limpieza': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      'Seguridad': 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      'Otro': 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
    return colors[tipo] || colors.General
  }

  if (!can.viewNovedades()) {
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

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Libro de Novedades</h1>
              <div className="group relative">
                <InfoIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  Registra las novedades diarias del condominio: mantenimientos, limpiezas, incidencias, etc.
                </div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Registro diario de actividades y novedades del condominio
            </p>
          </div>
          {can.createNovedades() && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium focus-outline flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              Nueva Novedad
            </button>
          )}
        </div>
      </div>

      {/* Lista de Novedades */}
      <div className="space-y-4">
        {novedades.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="inline-block p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
              <FiBook className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay novedades registradas
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Comienza a registrar las novedades del condominio
            </p>
            {can.createNovedades() && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium focus-outline"
              >
                Registrar Primera Novedad
              </button>
            )}
          </div>
        ) : (
          novedades.map((novedad) => (
            <div
              key={novedad.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTipoColor(novedad.tipo)}`}>
                      {novedad.tipo}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <FiCalendar className="w-4 h-4" />
                      <span>{formatDate(novedad.fecha)}</span>
                      <span className="mx-1">•</span>
                      <span>{novedad.hora}</span>
                    </div>
                    {novedad.ubicacion && (
                      <>
                        <span className="mx-1">•</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{novedad.ubicacion}</span>
                      </>
                    )}
                  </div>
                  <p className="text-gray-900 dark:text-white mb-3">
                    {novedad.descripcion}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <FiUser className="w-4 h-4" />
                    <span>Registrado por: {novedad.autor}</span>
                  </div>
                </div>
                {can.editNovedades() && (
                  <div className="flex gap-2 ml-4">
                    <button
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    {can.deleteNovedades() && (
                      <button
                        onClick={() => handleDelete(novedad.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para Nueva Novedad */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Nueva Novedad
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                    Hora
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.hora}
                    onChange={(e) => setFormData(prev => ({ ...prev, hora: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo
                  </label>
                  <select
                    required
                    value={formData.tipo}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {tiposNovedades.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ubicación (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData(prev => ({ ...prev, ubicacion: e.target.value }))}
                    placeholder="Ej: Edificio A, Áreas Comunes"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Describe la novedad o actividad realizada..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setFormData({
                      fecha: new Date().toISOString().split('T')[0],
                      hora: new Date().toTimeString().slice(0, 5),
                      tipo: 'General',
                      descripcion: '',
                      ubicacion: ''
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
                  Registrar Novedad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

