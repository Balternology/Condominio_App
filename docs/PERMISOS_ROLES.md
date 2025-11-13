# Permisos y Responsabilidades por Rol

Este documento define los permisos y responsabilidades de cada rol en el sistema de gestión de condominio.

## Roles del Sistema

### 1. Residente
**Descripción:** Usuario final que vive en el condominio.

**Vistas Permitidas:**
- Dashboard (solo sus datos)
- Pagos (solo sus pagos)
- Multas (solo sus multas)
- Reservas (crear y gestionar sus reservas)
- Anuncios (solo lectura)
- Perfil (solo su perfil)

**Acciones Permitidas:**
- Ver su información personal y de su vivienda
- Ver sus pagos y estado de cuenta
- Ver sus multas
- Crear, ver y cancelar sus propias reservas
- Ver anuncios del condominio
- Actualizar su perfil personal
- Configurar sus preferencias de notificaciones

**Restricciones:**
- No puede ver información de otros residentes
- No puede gestionar gastos comunes
- No puede crear o editar multas
- No puede crear o editar anuncios
- No puede acceder a reportes administrativos

---

### 2. Administrador
**Descripción:** Administrador del condominio con acceso a gestión operativa.

**Vistas Permitidas:**
- Dashboard (estadísticas generales)
- Gastos Comunes (gestión completa)
- Residentes (gestión completa)
- Multas (crear, editar, ver todas)
- Morosidad (ver y gestionar)
- Reservas (ver todas, gestionar)
- Anuncios (crear, editar, publicar)
- Reportes (generar y ver)
- Perfil

**Acciones Permitidas:**
- Ver todas las estadísticas del condominio
- Crear, editar y eliminar gastos comunes
- Gestionar información de residentes
- Crear, editar y eliminar multas
- Ver y gestionar morosidad
- Ver todas las reservas y gestionar conflictos
- Crear, editar y publicar anuncios
- Generar reportes financieros y administrativos
- Actualizar su perfil

**Restricciones:**
- No puede gestionar condominios (múltiples)
- No puede crear o eliminar usuarios del sistema
- No puede modificar configuraciones globales del sistema

---

### 3. Conserje
**Descripción:** Personal de mantenimiento y atención al residente.

**Vistas Permitidas:**
- Dashboard (estadísticas básicas)
- Pagos (ver estado de pagos de residentes)
- Reservas (ver todas, gestionar disponibilidad)
- Libro Novedades (crear y gestionar)
- Residentes (ver información básica)
- Multas (ver todas, registrar nuevas)
- Morosidad (ver estado)
- Perfil

**Acciones Permitidas:**
- Ver estadísticas básicas del condominio
- Ver estado de pagos de residentes (solo lectura)
- Ver todas las reservas y gestionar disponibilidad
- Crear y gestionar entradas en el libro de novedades
- Ver información básica de residentes
- Registrar nuevas multas (no puede editar/eliminar)
- Ver estado de morosidad
- Actualizar su perfil

**Restricciones:**
- No puede gestionar gastos comunes
- No puede crear o editar anuncios
- No puede generar reportes
- No puede editar o eliminar multas existentes
- No puede modificar información financiera

---

### 4. Directiva
**Descripción:** Miembros de la directiva del condominio (comité de administración).

**Vistas Permitidas:**
- Dashboard (estadísticas generales)
- Gastos Comunes (solo lectura y aprobación)
- Multas (ver todas, aprobar)
- Anuncios (crear y publicar)
- Reportes (ver reportes financieros)
- Perfil

**Acciones Permitidas:**
- Ver estadísticas generales del condominio
- Ver gastos comunes (solo lectura, puede aprobar)
- Ver todas las multas
- Crear y publicar anuncios oficiales
- Ver reportes financieros y administrativos
- Actualizar su perfil

**Restricciones:**
- No puede crear o editar gastos comunes directamente
- No puede gestionar residentes
- No puede gestionar reservas
- No puede crear multas
- No puede acceder a libro de novedades
- No puede gestionar pagos directamente

---

### 5. Super Admin
**Descripción:** Administrador del sistema con acceso completo.

**Vistas Permitidas:**
- Dashboard (todas las estadísticas)
- Condominios (gestión completa)
- Usuarios (gestión completa)
- Reportes (todos los reportes)
- Perfil

**Acciones Permitidas:**
- Ver todas las estadísticas del sistema
- Crear, editar y eliminar condominios
- Crear, editar y eliminar usuarios
- Asignar roles a usuarios
- Ver todos los reportes del sistema
- Acceder a configuraciones globales
- Actualizar su perfil

**Restricciones:**
- No debe realizar operaciones diarias (debe delegar a Administrador)
- Acceso principalmente para configuración y mantenimiento del sistema

---

## Matriz de Permisos

| Módulo | Residente | Administrador | Conserje | Directiva | Super Admin |
|--------|-----------|--------------|----------|-----------|-------------|
| **Dashboard** | Ver (propio) | Ver (todo) | Ver (básico) | Ver (todo) | Ver (todo) |
| **Gastos Comunes** | ❌ | ✅ CRUD | ❌ | 👁️ Ver | ❌ |
| **Pagos** | Ver (propio) | Ver (todo) | Ver (todo) | ❌ | ❌ |
| **Multas** | Ver (propias) | ✅ CRUD | ➕ Crear | 👁️ Ver | ❌ |
| **Reservas** | ✅ CRUD (propias) | ✅ Ver/Gestionar | ✅ Ver/Gestionar | ❌ | ❌ |
| **Anuncios** | 👁️ Ver | ✅ CRUD | ❌ | ✅ CRUD | ❌ |
| **Residentes** | ❌ | ✅ CRUD | 👁️ Ver | ❌ | ❌ |
| **Morosidad** | ❌ | ✅ Ver/Gestionar | 👁️ Ver | ❌ | ❌ |
| **Libro Novedades** | ❌ | ❌ | ✅ CRUD | ❌ | ❌ |
| **Reportes** | ❌ | ✅ Ver | ❌ | ✅ Ver | ✅ Ver |
| **Condominios** | ❌ | ❌ | ❌ | ❌ | ✅ CRUD |
| **Usuarios** | ❌ | ❌ | ❌ | ❌ | ✅ CRUD |
| **Perfil** | ✅ Editar (propio) | ✅ Editar (propio) | ✅ Editar (propio) | ✅ Editar (propio) | ✅ Editar (propio) |

**Leyenda:**
- ✅ = Acceso completo (CRUD: Create, Read, Update, Delete)
- 👁️ = Solo lectura
- ➕ = Solo crear
- ❌ = Sin acceso

---

## Notas de Implementación

1. **Validación en Backend:** Todos los endpoints deben validar el rol del usuario antes de permitir acciones.
2. **Validación en Frontend:** Las vistas deben ocultar botones y acciones no permitidas según el rol.
3. **Mensajes de Error:** Cuando un usuario intente realizar una acción no permitida, mostrar mensaje claro.
4. **Auditoría:** Registrar todas las acciones importantes (crear, editar, eliminar) con el usuario que las realizó.

