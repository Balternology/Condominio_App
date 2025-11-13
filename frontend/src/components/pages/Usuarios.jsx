import React from 'react'
import { usePermissions } from '../../hooks/usePermissions'

export default function Usuarios() {
  const { can } = usePermissions()
  
  if (!can.viewUsuarios()) {
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
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuarios</h1>
            <p className="text-gray-600 dark:text-gray-300">Gestión de usuarios del sistema</p>
          </div>
          {can.createUsuarios() && (
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium focus-outline">
              + Nuevo Usuario
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="bg-indigo-100 dark:bg-indigo-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Módulo de Usuarios</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Esta sección estará disponible próximamente. Aquí podrás gestionar los usuarios del sistema.
          </p>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium focus-outline">
            Próximamente
          </button>
        </div>
      </div>
    </div>
  )
}