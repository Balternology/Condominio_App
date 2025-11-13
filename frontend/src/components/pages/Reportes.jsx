import React from 'react'
import { usePermissions } from '../../hooks/usePermissions'

export default function Reportes() {
  const { can } = usePermissions()
  
  if (!can.viewReportes()) {
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Genera y consulta reportes financieros y administrativos
            </p>
          </div>
          {can.generateReportes() && (
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium focus-outline">
              Generar Reporte
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Módulo de Reportes</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Esta sección estará disponible próximamente. Aquí podrás generar reportes financieros y administrativos.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium focus-outline">
            Próximamente
          </button>
        </div>
      </div>
    </div>
  )
}

