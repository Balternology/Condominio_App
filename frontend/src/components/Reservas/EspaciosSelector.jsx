/**
 * Componente: Selector de Espacios
 * Muestra los 3 espacios comunes (Multicancha, Quincho, Sala de Eventos)
 * con toggle selector y SVG icons
 */

import React, { useState } from 'react';
import { FiChevronRight, FiDollarSign } from 'react-icons/fi';
import ReservasService from '../../services/reservasService';

const EspaciosSelector = ({ onSelectEspacio, espacioSeleccionado = null, loading = false }) => {
  const [selected, setSelected] = useState(espacioSeleccionado);

  const espacios = [
    {
      id: 'multicancha',
      nombre: 'Multicancha',
      descripcion: 'Cancha multiusos para fútbol, vóleibol, etc.',
      icono: '⚽',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600',
    },
    {
      id: 'quincho',
      nombre: 'Quincho',
      descripcion: 'Área de asados y reuniones',
      icono: '🍖',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-600',
    },
    {
      id: 'sala_eventos',
      nombre: 'Sala de Eventos',
      descripcion: 'Sala para reuniones y eventos',
      icono: '🎉',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-600',
    },
  ];

  const handleSelect = (espacioId) => {
    if (!loading) {
      setSelected(espacioId);
      if (onSelectEspacio) {
        onSelectEspacio(espacioId);
      }
    }
  };

  const espacioActual = espacios.find((e) => e.id === selected);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Selecciona un Espacio
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Elige el espacio común que deseas reservar
        </p>
      </div>

      {/* Grid de Espacios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {espacios.map((espacio) => (
          <button
            key={espacio.id}
            onClick={() => handleSelect(espacio.id)}
            disabled={loading}
            className={`relative overflow-hidden rounded-lg p-6 transition-all duration-300 transform ${
              selected === espacio.id
                ? `ring-2 ring-offset-2 ring-${espacio.textColor} scale-105 shadow-lg`
                : 'shadow hover:shadow-lg hover:scale-102'
            } ${espacio.bgColor} border-2 ${espacio.borderColor} ${
              loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-opacity-100'
            } dark:bg-gray-800 dark:border-gray-700`}
          >
            {/* Gradient Background */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${espacio.color} opacity-0 ${
                selected === espacio.id ? 'opacity-5' : ''
              } transition-opacity`}
            />

            {/* Content */}
            <div className="relative z-10">
              {/* Icono */}
              <div className={`mb-4 ${espacio.textColor} flex justify-center text-5xl`}>
                {espacio.icono}
              </div>

              {/* Nombre */}
              <h3 className={`text-lg font-bold mb-2 ${espacio.textColor}`}>
                {espacio.nombre}
              </h3>

              {/* Descripción */}
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {espacio.descripcion}
              </p>

              {/* Precio */}
              <div className="flex items-center gap-1 mb-4">
                <FiDollarSign className={`w-4 h-4 ${espacio.textColor}`} />
                <span className={`text-lg font-bold ${espacio.textColor}`}>
                  {ReservasService.constructor.formatearPrecio(
                    ReservasService.constructor.getPrecioEspacio(espacio.id)
                  )}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">/hora</span>
              </div>

              {/* Check Mark */}
              {selected === espacio.id && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                  <div className={`w-5 h-5 rounded-full bg-${espacio.textColor} flex items-center justify-center text-white`}>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Seleccionado
                  </span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Card de Detalle del Espacio Seleccionado */}
      {espacioActual && (
        <div
          className={`border-l-4 rounded-lg p-6 bg-gradient-to-r ${espacioActual.color} bg-opacity-5 border-${espacioActual.textColor} dark:bg-opacity-10 dark:border-gray-700 transition-all duration-300`}
        >
          <div className="flex items-center gap-4">
            <div className={`${espacioActual.textColor} text-5xl`}>
              {espacioActual.icono}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {espacioActual.nombre}
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                {espacioActual.descripcion}
              </p>
              <button
                disabled={loading}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r ${espacioActual.color} hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Ver Disponibilidad
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estado de Carga */}
      {loading && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2">
            <div className="animate-spin">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <span className="text-sm text-blue-700 dark:text-blue-300">Cargando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EspaciosSelector;
