import { useAuth } from '../context/AuthContext'

/**
 * Hook para verificar permisos del usuario actual
 * Basado en el documento PERMISOS_ROLES.md
 */
export function usePermissions() {
  const { currentUser } = useAuth()

  const can = {
    // Gastos Comunes
    // Backend: Admin, Conserje, Super Admin pueden ver gastos de viviendas específicas
    // Residentes pueden ver sus propios gastos
    viewGastos: () => ['admin', 'directiva', 'conserje', 'super_admin', 'residente'].includes(currentUser?.role),
    createGastos: () => ['admin', 'super_admin'].includes(currentUser?.role),
    editGastos: () => ['admin', 'super_admin'].includes(currentUser?.role),
    deleteGastos: () => ['admin', 'super_admin'].includes(currentUser?.role),

    // Pagos
    // Backend: Todos pueden ver sus pagos, Admin/Conserje/Super Admin pueden ver todos
    viewPagos: () => true, // Todos pueden ver sus pagos
    viewAllPagos: () => ['admin', 'conserje', 'super_admin'].includes(currentUser?.role),
    processPagos: () => ['admin', 'super_admin'].includes(currentUser?.role),

    // Multas
    // Backend: Todos pueden ver sus multas, Admin/Conserje/Directiva/Super Admin pueden ver todas
    viewMultas: () => true, // Todos pueden ver sus multas
    viewAllMultas: () => ['admin', 'conserje', 'directiva', 'super_admin'].includes(currentUser?.role),
    createMultas: () => ['admin', 'conserje', 'super_admin'].includes(currentUser?.role),
    editMultas: () => ['admin', 'super_admin'].includes(currentUser?.role),
    deleteMultas: () => ['admin', 'super_admin'].includes(currentUser?.role),

    // Reservas
    // Backend: Todos pueden ver/crear sus reservas, Admin/Conserje/Super Admin pueden ver todas
    viewReservas: () => true, // Todos pueden ver sus reservas
    viewAllReservas: () => ['admin', 'conserje', 'super_admin'].includes(currentUser?.role),
    createReservas: () => true, // Todos pueden crear reservas
    cancelReservas: () => true, // Todos pueden cancelar sus reservas
    manageReservas: () => ['admin', 'conserje', 'super_admin'].includes(currentUser?.role),

    // Anuncios
    viewAnuncios: () => true, // Todos pueden ver anuncios
    createAnuncios: () => ['admin', 'directiva'].includes(currentUser?.role),
    editAnuncios: () => ['admin', 'directiva'].includes(currentUser?.role),
    deleteAnuncios: () => ['admin', 'directiva'].includes(currentUser?.role),

    // Residentes
    // Backend: Admin, Conserje, Super Admin pueden listar residentes
    viewResidentes: () => ['admin', 'conserje', 'super_admin'].includes(currentUser?.role),
    createResidentes: () => ['admin', 'super_admin'].includes(currentUser?.role),
    editResidentes: () => ['admin', 'super_admin'].includes(currentUser?.role),
    deleteResidentes: () => ['admin', 'super_admin'].includes(currentUser?.role),

    // Morosidad
    // Backend: Admin, Conserje, Directiva, Super Admin pueden ver morosidad
    viewMorosidad: () => ['admin', 'conserje', 'directiva', 'super_admin'].includes(currentUser?.role),
    manageMorosidad: () => ['admin', 'super_admin'].includes(currentUser?.role),

    // Libro Novedades
    viewNovedades: () => currentUser?.role === 'conserje',
    createNovedades: () => currentUser?.role === 'conserje',
    editNovedades: () => currentUser?.role === 'conserje',
    deleteNovedades: () => currentUser?.role === 'conserje',

    // Reportes
    viewReportes: () => ['admin', 'directiva', 'super_admin'].includes(currentUser?.role),
    generateReportes: () => ['admin', 'directiva', 'super_admin'].includes(currentUser?.role),

    // Condominios
    viewCondominios: () => currentUser?.role === 'super_admin',
    createCondominios: () => currentUser?.role === 'super_admin',
    editCondominios: () => currentUser?.role === 'super_admin',
    deleteCondominios: () => currentUser?.role === 'super_admin',

    // Usuarios
    viewUsuarios: () => currentUser?.role === 'super_admin',
    createUsuarios: () => currentUser?.role === 'super_admin',
    editUsuarios: () => currentUser?.role === 'super_admin',
    deleteUsuarios: () => currentUser?.role === 'super_admin',
  }

  return { can, role: currentUser?.role }
}

