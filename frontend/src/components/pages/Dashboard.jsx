import React, { useEffect, useState } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// URL base de la API
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.trim().replace(/\/$/, '')
  }
  return import.meta.env.DEV ? '/api/v1' : 'http://localhost:8000/api/v1'
}
const API_BASE_URL = getApiBaseUrl()

export default function Dashboard() {
  const { currentUser, getAuthHeaders } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState([])
  const [chartData, setChartData] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (currentUser) {
      cargarDatos()
    }
  }, [currentUser])

  const cargarDatos = async () => {
    if (!currentUser) return
    
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/stats/${currentUser.id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        }
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setStats(data.stats || [])
      setRecentActivity(data.recent_activity || [])
      
      if (data.chart_data) {
        setChartData({
          labels: data.chart_data.labels,
          datasets: data.chart_data.datasets.map(ds => ({
            ...ds,
            borderWidth: 1
          }))
        })
      }
    } catch (error) {
      console.error('Error al cargar dashboard:', error)
      setError('Error al cargar los datos del dashboard')
      // Usar datos por defecto en caso de error
      setStats(getDefaultStats())
    } finally {
      setIsLoading(false)
    }
  }

  const getDefaultStats = () => {
    if (currentUser.role === 'residente') {
      return [
        { title: 'Mi Saldo', value: '$0', change: 'Cargando...', icon: 'money', color: 'gray' },
        { title: 'Mis Reservas', value: '0', change: 'Cargando...', icon: 'calendar', color: 'gray' },
        { title: 'Multas', value: '0', change: 'Cargando...', icon: 'warning', color: 'gray' },
        { title: 'Gastos Pendientes', value: '$0', change: 'Cargando...', icon: 'money', color: 'gray' }
      ]
    }
    return [
      { title: 'Residentes Activos', value: '0', change: 'Cargando...', icon: 'users', color: 'gray' },
      { title: 'Pagos del Mes', value: '$0', change: 'Cargando...', icon: 'money', color: 'gray' },
      { title: 'Reservas Activas', value: '0', change: 'Cargando...', icon: 'calendar', color: 'gray' },
      { title: 'Morosidad', value: '0%', change: 'Cargando...', icon: 'warning', color: 'gray' }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Resumen Financiero Mensual',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString()
          }
        }
      }
    }
  }

  const getIconComponent = (iconName) => {
    const icons = {
      users: UsersIcon,
      money: MoneyIcon,
      calendar: CalendarIcon,
      warning: WarningIcon,
      bell: BellIcon
    }
    return icons[iconName] || MoneyIcon
  }

  const getStatTooltip = (title) => {
    const tooltips = {
      'Mi Saldo': 'Saldo actual de gastos pendientes menos pagos realizados. Un saldo positivo indica deuda pendiente.',
      'Mis Reservas': 'Número de reservas de espacios comunes que tienes activas actualmente.',
      'Multas': 'Cantidad de multas pendientes aplicadas a tus viviendas por incumplimiento de normas.',
      'Gastos Pendientes': 'Total de gastos comunes y otros cargos que aún no han sido pagados.',
      'Residentes Activos': 'Número total de residentes activos registrados en el condominio.',
      'Pagos del Mes': 'Total de pagos recibidos durante el mes actual.',
      'Reservas Activas': 'Número de reservas de espacios comunes programadas para el futuro.',
      'Morosidad': 'Porcentaje de gastos vencidos no pagados. Un porcentaje alto indica mayor morosidad.'
    }
    return tooltips[title] || 'Información sobre esta métrica'
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando datos del dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <div className="group relative">
            <InfoIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 cursor-help" />
            <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              Resumen general de la actividad del condominio. Los datos se actualizan en tiempo real.
            </div>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Bienvenido, {currentUser.name}. Aquí tienes un resumen de la actividad del condominio.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const IconComponent = typeof stat.icon === 'string' ? getIconComponent(stat.icon) : stat.icon
          const colorClasses = {
            blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
            green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
            purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
            red: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
            orange: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400',
            gray: 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
          }
          const changeColorClass = stat.change.startsWith('+') || stat.change === 'Al día' || stat.change.includes('Al día') || stat.change === 'Activas'
            ? 'text-green-600 dark:text-green-400'
            : stat.change.startsWith('-') || stat.change.includes('Pendiente') || stat.change.includes('Pendientes')
            ? 'text-red-600 dark:text-red-400'
            : 'text-gray-600 dark:text-gray-400'
          
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover-lift">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-1 mb-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                    <div className="group relative">
                      <InfoIcon className="w-3 h-3 text-gray-400 dark:text-gray-500 cursor-help" />
                      <div className="absolute left-0 bottom-full mb-2 w-56 p-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        {getStatTooltip(stat.title)}
                      </div>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className={`text-sm ${changeColorClass}`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${colorClasses[stat.color] || colorClasses.gray}`}>
                  <IconComponent className="w-6 h-6" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Chart */}
        {chartData && (currentUser.role === 'admin' || currentUser.role === 'super_admin' || currentUser.role === 'directiva') && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resumen Financiero</h3>
              <div className="group relative">
                <InfoIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  Gráfico comparativo de ingresos y gastos de los últimos 6 meses.
                </div>
              </div>
            </div>
            <div style={{ height: '300px' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Actividad Reciente</h3>
            <div className="group relative">
              <InfoIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                Últimas acciones realizadas en el sistema: pagos, reservas y otras actividades.
              </div>
            </div>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'payment' ? 'bg-green-100 dark:bg-green-900' 
                    : activity.type === 'reservation' ? 'bg-blue-100 dark:bg-blue-900' 
                    : 'bg-red-100 dark:bg-red-900'
                  }`}>
                    {activity.type === 'payment' ? (
                      <MoneyIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : activity.type === 'reservation' ? (
                      <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <WarningIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.user}</p>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{activity.time}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No hay actividad reciente</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <div className="flex items-center space-x-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Acciones Rápidas</h3>
          <div className="group relative">
            <InfoIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
            <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              Accesos rápidos a las funciones más utilizadas del sistema.
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {currentUser.role !== 'residente' && (
            <>
              <button 
                onClick={() => navigate('/pagos')}
                className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow focus-outline"
              >
                <MoneyIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Registrar Pago</span>
              </button>
              <button 
                onClick={() => navigate('/morosidad')}
                className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow focus-outline"
              >
                <WarningIcon className="w-8 h-8 text-red-600 dark:text-red-400 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Ver Morosidad</span>
              </button>
            </>
          )}
          <button 
            onClick={() => navigate('/reservas')}
            className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow focus-outline"
          >
            <CalendarIcon className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Nueva Reserva</span>
          </button>
          <button 
            onClick={() => navigate('/perfil')}
            className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow focus-outline"
          >
            <BellIcon className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Mi Perfil</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Icon components
function InfoIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  )
}

function MoneyIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function WarningIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  )
}

function BellIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5-5-5h5V3h0z" />
    </svg>
  )
}