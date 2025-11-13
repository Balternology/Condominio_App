import React, { useState, useEffect, useMemo } from 'react';
import ReservasService from '../../services/reservasService';
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiClock, 
  FiCheck, 
  FiAlertTriangle, 
  FiLoader, 
  FiInbox,
  FiRefreshCw
} from 'react-icons/fi';

/**
 * Componente para seleccionar un slot de disponibilidad.
 * Muestra los horarios disponibles agrupados por fecha en una grilla responsive.
 *
 * @param {object} props
 * @param {string} props.espacio - ID del espacio ("multicancha", "quincho", etc.)
 * @param {function} props.onSelectSlot - Callback(slot) cuando se selecciona un horario
 * @param {function} props.onBack - Callback() para volver al paso anterior
 */
const CalendarioDisponibilidad = ({ espacio, onSelectSlot, onBack }) => {
  // Alias para acceder a métodos estáticos
  const ReservasServiceStatic = ReservasService.constructor;

  // --- Estados ---
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);
  const [reloadTrigger, setReloadTrigger] = useState(0); // Trigger para recargar

  // Obtener la información estática del espacio (nombre, icono, color)
  const infoEspacio = ReservasServiceStatic.getInfoEspacio(espacio);

  // --- Funciones ---

  /**
   * Carga la disponibilidad desde la API para el espacio seleccionado.
   * Asumimos que el servicio sin fechas trae los próximos días disponibles.
   */
  const cargarDisponibilidad = async () => {
    setLoading(true);
    setError(null);
    setSlotSeleccionado(null); // Resetea selección al recargar

    try {
      // Llamamos al servicio (asumiendo que maneja fechas default si se pasa null)
      const response = await ReservasService.obtenerDisponibilidad(espacio, null, null, null);
      
      if (response.success && response.data.slots) {
        setSlots(response.data.slots);
      } else {
        throw new Error('No se pudo obtener la disponibilidad desde la API.');
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el clic en un slot de horario.
   * @param {object} slot - El slot crudo de la API (inicio, fin)
   */
  const handleSelectSlot = (slot) => {
    // Construye el objeto de slot completo según especificación
    const fullSlotData = {
      espacio: espacio,
      inicio: slot.inicio,
      fin: slot.fin,
      duracion: ReservasServiceStatic.calcularDuracion(slot.inicio, slot.fin),
    };
    
    setSlotSeleccionado(fullSlotData);

    // Llama al callback del padre inmediatamente
    if (onSelectSlot) {
      onSelectSlot(fullSlotData);
    }
  };

  /**
   * Maneja el clic en el botón "Volver".
   */
  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  // --- Efectos ---

  // Cargar disponibilidad al montar el componente o si el 'espacio' cambia
  useEffect(() => {
    if (espacio) {
      cargarDisponibilidad();
    }
  }, [espacio, reloadTrigger]);

  // --- Memoización ---

  /**
   * Agrupa los slots por fecha (ej: "2025-10-25") para renderizarlos
   * en secciones separadas. Se recalcula solo si 'slots' cambia.
   */
  const slotsAgrupados = useMemo(() => {
    if (!slots || slots.length === 0) return {};
    
    const grupos = {};
    slots.forEach(slot => {
      // Incluir todos los slots (disponibles e indisponibles)
      
      // Extrae la parte de la fecha (YYYY-MM-DD)
      const fechaKey = slot.inicio.split('T')[0];
      
      if (!grupos[fechaKey]) {
        grupos[fechaKey] = [];
      }
      grupos[fechaKey].push(slot);
    });
    return grupos;
  }, [slots]);

  // --- Sub-componentes de Renderizado ---

  // 1. Estado de Carga (Loading)
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500 dark:text-slate-400">
      <FiLoader className="animate-spin text-4xl mb-4 text-blue-500" />
      <p className="text-lg font-medium">Cargando disponibilidad...</p>
      <p className="text-sm">Buscando horarios para {infoEspacio.nombre}.</p>
    </div>
  );

  // 2. Estado de Error
  const renderError = () => (
    <div 
      className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4" 
      role="alert"
    >
      <div className="flex items-center">
        <FiAlertTriangle className="mr-3 text-2xl" />
        <div>
          <p className="font-bold">Error de Carga</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
      <button
        onClick={cargarDisponibilidad}
        className="w-full sm:w-auto flex-shrink-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md text-sm transition-colors"
      >
        Reintentar
      </button>
    </div>
  );

  // 3. Estado Vacío (Sin Slots)
  const renderNoSlots = () => (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
      <FiInbox className="text-5xl mb-4" />
      <p className="text-lg font-medium">No hay horarios disponibles</p>
      <p className="text-sm text-center">No se encontraron slots para {infoEspacio.nombre} en las próximas fechas.</p>
    </div>
  );

  // 4. Renderizado de la Grilla de Slots
  const renderSlotsGrid = () => {
    // Obtenemos las fechas (keys) y las ordenamos
    const fechas = Object.keys(slotsAgrupados).sort();
    
    if (fechas.length === 0) {
      return renderNoSlots();
    }

    return (
      <div className="space-y-6">
        {fechas.map(fecha => {
          // Formateamos el título de la fecha (ej: "sábado, 25 de octubre de 2025")
          const fechaFormateada = new Date(fecha + 'T00:00:00').toLocaleDateString('es-CL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC' // Importante para evitar desfase de día
          });

          return (
            <section key={fecha}>
              {/* Título de la Fecha */}
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-200 dark:border-slate-700 flex items-center capitalize">
                <FiCalendar className="mr-2 text-blue-500" />
                {fechaFormateada}
              </h3>
              
              {/* Grilla Responsive de Horarios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {slotsAgrupados[fecha].map(slot => {
                  const isSelected = slotSeleccionado?.inicio === slot.inicio;
                  const isDisabled = !slot.disponible;
                  const inicioHora = ReservasServiceStatic.formatearHora(slot.inicio);
                  const finHora = ReservasServiceStatic.formatearHora(slot.fin);

                  return (
                    <button
                      key={slot.inicio}
                      onClick={() => !isDisabled && handleSelectSlot(slot)}
                      disabled={isDisabled}
                      type="button"
                      className={`
                        p-3 rounded-lg border transition-all duration-200
                        flex items-center justify-between text-left w-full
                        focus:outline-none
                        ${isDisabled
                          ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-600 border-blue-700 text-white ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-blue-500 shadow-lg'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-blue-400 dark:hover:border-blue-600 focus:ring-2 focus:ring-blue-500'
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <FiClock className={`mr-2 ${isDisabled ? 'text-red-500' : isSelected ? 'text-white' : 'text-green-500'}`} />
                        <span className="font-semibold text-sm">{inicioHora} - {finHora}</span>
                      </div>
                      {isSelected && (
                        <FiCheck className="text-xl text-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    );
  };

  // 5. Tarjeta de Confirmación de Selección
  const renderConfirmacionSeleccion = () => {
    if (!slotSeleccionado) return null;

    // Usamos los servicios de formateo
    const fechaFormateada = ReservasServiceStatic.formatearFecha(slotSeleccionado.inicio).split(',')[0];
    const horaInicio = ReservasServiceStatic.formatearHora(slotSeleccionado.inicio);
    const horaFin = ReservasServiceStatic.formatearHora(slotSeleccionado.fin);

    return (
      <div className="mt-6 p-4 bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg shadow-md transition-all">
        <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">Horario Seleccionado</h4>
        <p className="text-base font-medium text-slate-800 dark:text-slate-100">
          {infoEspacio.nombre}: {fechaFormateada}
        </p>
        <p className="text-base text-slate-700 dark:text-slate-200">
          <span className="font-medium">{horaInicio} - {horaFin}</span> ({slotSeleccionado.duracion} min)
        </p>
      </div>
    );
  };

  // --- Renderizado Principal ---
  return (
    <div className="w-full max-w-5xl mx-auto p-2 sm:p-4">
      {/* Header con botón 'Volver' y Título */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleBack}
          type="button"
          className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <FiArrowLeft className="mr-1 sm:mr-2" />
          Volver
        </button>
        <div className={`text-right flex items-center gap-3 px-4 py-2 rounded-lg ${infoEspacio.color} text-white shadow-md`}>
          <span className="text-2xl hidden sm:block">{infoEspacio.icono}</span>
          <div className="text-left">
            <span className="text-xs font-light block -mb-1">Espacio</span>
            <h2 className="text-lg sm:text-xl font-bold">
              {infoEspacio.nombre}
            </h2>
          </div>
        </div>
        <button
          onClick={() => setReloadTrigger(prev => prev + 1)}
          disabled={loading}
          type="button"
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
          title="Recargar disponibilidad"
        >
          <FiRefreshCw className={`${loading ? 'animate-spin' : ''}`} size={18} />
        </button>
      </div>
      
      <p className="text-base text-slate-600 dark:text-slate-300 mb-6 text-center">
        Selecciona un horario disponible para tu reserva.
      </p>

      {/* Contenedor Principal (Loading/Error/Grid) */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm min-h-[200px]">
        {loading && renderLoading()}
        {!loading && error && renderError()}
        {!loading && !error && renderSlotsGrid()}
      </div>
      
      {/* Caja de Confirmación (aparece al seleccionar) */}
      {!loading && !error && renderConfirmacionSeleccion()}
    </div>
  );
};

export default CalendarioDisponibilidad;