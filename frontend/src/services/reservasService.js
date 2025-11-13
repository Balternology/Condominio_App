/**
 * Servicio para consumir la API de Reservas
 * Incluye métodos para espacios, disponibilidad y reservas
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class ReservasService {
  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/reservas`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar token de autenticación si existe
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Obtiene la lista de espacios comunes disponibles
   * @returns {Promise<Array>} Lista de espacios
   */
  async obtenerEspacios() {
    try {
      const response = await this.client.get('/espacios');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Error al obtener espacios',
        status: error.response?.status,
      };
    }
  }

  /**
   * Obtiene la disponibilidad de un espacio en un rango de fechas
   * @param {string} espacio - Tipo de espacio (multicancha, quincho, sala_eventos)
   * @param {Date} fechaInicio - Fecha de inicio (default: hoy)
   * @param {Date} fechaFin - Fecha de fin (default: 30 días desde hoy)
   * @param {number} duracionMinutos - Duración en minutos (default: 60)
   * @returns {Promise<Object>} Disponibilidad con slots
   */
  async obtenerDisponibilidad(espacio, fechaInicio = null, fechaFin = null, duracionMinutos = 60) {
    try {
      const params = {
        duracion_minutos: duracionMinutos,
      };

      if (fechaInicio) {
        params.fecha_inicio = fechaInicio.toISOString();
      }
      if (fechaFin) {
        params.fecha_fin = fechaFin.toISOString();
      }

      const response = await this.client.get(`/espacios/${espacio}/disponibilidad`, { params });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Error al obtener disponibilidad',
        status: error.response?.status,
      };
    }
  }

  /**
   * Crea una nueva reserva
   * @param {string} espacio - Tipo de espacio
   * @param {Date} fechaHoraInicio - Fecha y hora de inicio
   * @param {Date} fechaHoraFin - Fecha y hora de fin
   * @returns {Promise<Object>} Datos de la reserva creada
   * @note El usuario se obtiene automáticamente del token JWT
   */
  async crearReserva(espacio, fechaHoraInicio, fechaHoraFin) {
    try {
      // Convertir a strings ISO sin zona horaria (tratarlos como hora local del usuario)
      const formatearLocalISO = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };

      const data = {
        espacio,
        fecha_hora_inicio: formatearLocalISO(fechaHoraInicio),
        fecha_hora_fin: formatearLocalISO(fechaHoraFin),
      };

      const response = await this.client.post('/', data);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Error al crear reserva',
        status: error.response?.status,
      };
    }
  }

  /**
   * Obtiene las reservas de un usuario
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<Array>} Lista de reservas del usuario
   */
  async obtenerReservasUsuario(usuarioId) {
    try {
      const response = await this.client.get(`/usuario/${usuarioId}`);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Error al obtener reservas',
        status: error.response?.status,
      };
    }
  }

  /**
   * Cancela una reserva existente
   * @param {number} reservaId - ID de la reserva a cancelar
   * @param {number} usuarioId - ID del usuario propietario
   * @returns {Promise<Object>} Mensaje de confirmación
   */
  async cancelarReserva(reservaId) {
    try {
      const response = await this.client.delete(`/${reservaId}`);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Error al cancelar reserva',
        status: error.response?.status,
      };
    }
  }

  /**
   * Obtiene información formateada de un espacio
   * @param {string} espacio - Tipo de espacio
   * @returns {Object} Información del espacio
   */
  static getInfoEspacio(espacio) {
    const espacios = {
      multicancha: {
        nombre: 'Multicancha',
        descripcion: 'Cancha multiusos para fútbol, vóleibol, etc.',
        icono: '⚽',
        color: 'bg-blue-500',
      },
      quincho: {
        nombre: 'Quincho',
        descripcion: 'Área de asados y reuniones',
        icono: '🍖',
        color: 'bg-orange-500',
      },
      sala_eventos: {
        nombre: 'Sala de Eventos',
        descripcion: 'Sala para reuniones y eventos',
        icono: '🎉',
        color: 'bg-purple-500',
      },
    };

    return espacios[espacio.toLowerCase()] || null;
  }

  /**
   * Formatea una fecha para mostrar en la UI
   * @param {Date|string} fecha - Fecha a formatear
   * @returns {string} Fecha formateada
   */
  static formatearFecha(fecha) {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    const opciones = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('es-CL', opciones);
  }

  /**
   * Formatea un horario (solo hora)
   * @param {Date|string} fecha - Fecha a formatear
   * @returns {string} Hora formateada (ej: 18:00)
   */
  static formatearHora(fecha) {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Calcula la duración en minutos entre dos fechas
   * @param {Date|string} inicio - Fecha de inicio
   * @param {Date|string} fin - Fecha de fin
   * @returns {number} Duración en minutos
   */
  static calcularDuracion(inicio, fin) {
    const fechaInicio = typeof inicio === 'string' ? new Date(inicio) : inicio;
    const fechaFin = typeof fin === 'string' ? new Date(fin) : fin;
    return Math.round((fechaFin - fechaInicio) / (1000 * 60));
  }

  /**
   * Obtiene los dias de la semana
   * @returns {Array} Array con nombres de días
   */
  static getDiasDelaSemana() {
    return ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  }

  /**
   * Obtiene el precio de un espacio
   * @param {string} espacio - ID del espacio
   * @returns {number} Precio del espacio en CLP
   */
  static getPrecioEspacio(espacio) {
    const precios = {
      multicancha: 50000,
      quincho: 75000,
      sala_eventos: 100000
    };
    return precios[espacio.toLowerCase()] || 0;
  }

  /**
   * Formatea un precio en CLP
   * @param {number} precio - Precio a formatear
   * @returns {string} Precio formateado
   */
  static formatearPrecio(precio) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(precio);
  }

  /**
   * Verifica si una fecha es hoy
   * @param {Date} fecha - Fecha a verificar
   * @returns {boolean} True si es hoy
   */
  static esHoy(fecha) {
    const hoy = new Date();
    const fechaComparar = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return (
      hoy.getDate() === fechaComparar.getDate() &&
      hoy.getMonth() === fechaComparar.getMonth() &&
      hoy.getFullYear() === fechaComparar.getFullYear()
    );
  }

  /**
   * Obtiene slots de ejemplo (para desarrollo sin Google Calendar)
   * @param {Date} fecha - Fecha para generar slots
   * @returns {Array} Array de slots disponibles
   */
  static getSlotsDePrueba(fecha) {
    const slots = [];
    const horas = [8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20];

    horas.forEach((hora) => {
      const inicio = new Date(fecha);
      inicio.setHours(hora, 0, 0, 0);

      const fin = new Date(inicio);
      fin.setHours(hora + 1, 0, 0, 0);

      slots.push({
        inicio: inicio.toISOString(),
        fin: fin.toISOString(),
        disponible: Math.random() > 0.3, // 70% de slots disponibles
      });
    });

    return slots;
  }
}

export default new ReservasService();
