import React, { useEffect, useMemo, useState } from 'react'
import { fetchCurrentUf, formatClp, formatNumberUf } from '../../services/ufService'
import { fetchPagosDesglose } from '../../services/pagosService'
import { useAuth } from '../../context/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import PagosConserje from './PagosConserje'

function InfoIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default function Pagos() {
  const { currentUser } = useAuth()
  const { can } = usePermissions()
  const [uf, setUf] = useState({ valueClp: null, date: null })
  const [loading, setLoading] = useState(false)
  const [ufError, setUfError] = useState('')
  const [pagosError, setPagosError] = useState('')
  const [desglose, setDesglose] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        setLoading(true)
  setUfError('')
        const data = await fetchCurrentUf(controller.signal)
        setUf(data)
      } catch (e) {
        // Ignorar aborts del fetch
        if (e?.name === 'AbortError') return
        console.error(e)
  setUfError(e.message || 'Error al cargar UF')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!currentUser) return
    const controller = new AbortController()
    async function loadDesglose() {
      try {
        setPagosError('')
        const usuarioId = currentUser.id
        const data = await fetchPagosDesglose(usuarioId, controller.signal)
        setDesglose(data)
      } catch (e) {
        if (e?.name === 'AbortError') return
        console.error(e)
        setPagosError(e.message || 'Error al cargar desglose')
      }
    }
    loadDesglose()
    return () => controller.abort()
  }, [currentUser])

  const cargoFijoUf = desglose?.cargo_fijo_uf ?? 7.6
  const totalClp = useMemo(() => {
    if (!uf.valueClp || !Number.isFinite(Number(cargoFijoUf))) return null
    return uf.valueClp * Number(cargoFijoUf)
  }, [uf.valueClp, cargoFijoUf])

  // Si es conserje o admin, mostrar vista de todos los pagos
  if (can.viewAllPagos() && currentUser && currentUser.role !== 'residente') {
    return <PagosConserje />
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pagos</h1>
          <div className="group relative">
            <InfoIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 cursor-help" />
            <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              Consulta tu cargo fijo mensual, gastos comunes, multas y reservas pendientes de pago.
            </div>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          {can.viewAllPagos() 
            ? 'Gestión y consulta de pagos del condominio'
            : 'Consulta tus pagos y estado de cuenta'
          }
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tarjeta principal: Cargo fijo (a la izquierda, ocupa 2 columnas) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Cargo fijo mensual (UF)</h3>
            <div className="group relative">
              <InfoIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                El cargo fijo es un monto mensual fijo expresado en UF que se cobra a todas las viviendas.
              </div>
            </div>
          </div>
          {/* Nota removida por solicitud del usuario */}

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">Monto en UF</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{formatNumberUf(cargoFijoUf)} UF</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">Equivalente en CLP</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{totalClp ? formatClp(totalClp) : '—'}</div>
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">El valor en CLP se calcula usando la UF del día consultada en la CMF.</p>

          {pagosError && (
            <div className="mt-2 text-xs text-red-600">{pagosError}</div>
          )}

          {/* Desglose básico */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center space-x-1 mb-2">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400">Gastos comunes</h4>
                <div className="group relative">
                  <InfoIcon className="w-3 h-3 text-gray-400 dark:text-gray-500 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 w-56 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    Gastos mensuales del condominio: mantenimiento, servicios comunes, etc.
                  </div>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                {(desglose?.gastos_comunes ?? []).map(g => (
                  <li key={`g-${g.id}`} className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">{g.mes}/{g.ano} · {g.estado}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatClp(g.monto_total)}</span>
                  </li>
                ))}
                {desglose && desglose.gastos_comunes?.length === 0 && (
                  <li className="text-gray-500 dark:text-gray-400">Sin registros</li>
                )}
              </ul>
            </div>
            <div>
              <div className="flex items-center space-x-1 mb-2">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400">Multas</h4>
                <div className="group relative">
                  <InfoIcon className="w-3 h-3 text-gray-400 dark:text-gray-500 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 w-56 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    Multas aplicadas por incumplimiento de normas del condominio.
                  </div>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                {(desglose?.multas ?? []).map(m => (
                  <li key={`m-${m.id}`} className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">{m.descripcion}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatClp(m.monto)}</span>
                  </li>
                ))}
                {desglose && desglose.multas?.length === 0 && (
                  <li className="text-gray-500 dark:text-gray-400">Sin registros</li>
                )}
              </ul>
            </div>
            <div>
              <div className="flex items-center space-x-1 mb-2">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400">Reservas</h4>
                <div className="group relative">
                  <InfoIcon className="w-3 h-3 text-gray-400 dark:text-gray-500 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 w-56 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    Pagos pendientes por reservas de espacios comunes que requieren pago.
                  </div>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                {(desglose?.reservas ?? []).map(r => (
                  <li key={`r-${r.id}`} className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">{r.estado_pago}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatClp(r.monto_pago)}</span>
                  </li>
                ))}
                {desglose && desglose.reservas?.length === 0 && (
                  <li className="text-gray-500 dark:text-gray-400">Sin registros</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Tarjeta UF del día (más pequeña, a la derecha) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 dark:bg-blue-900 w-8 h-8 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v10m8-5a8 8 0 11-16 0 8 8 0 0116 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">UF del día</h3>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {loading ? 'Cargando…' : (uf.valueClp ? formatClp(uf.valueClp) : '—')}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setLoading(true)
                setUfError('')
                fetchCurrentUf().then(setUf).catch(e => setUfError(e.message)).finally(() => setLoading(false))
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
            >
              Actualizar
            </button>
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400">{uf.date ? `Fecha: ${uf.date}` : ''}</div>
          {ufError && <div className="mt-2 text-xs text-red-600">{ufError}</div>}
        </div>
      </div>
    </div>
  )
}