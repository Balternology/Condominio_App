# Sistema de Gestión de Condominio

Sistema completo de gestión de condominios desarrollado con **FastAPI** (backend) y **React + Vite** (frontend), con base de datos **MySQL** y autenticación **JWT**.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Autenticación y Permisos](#-autenticación-y-permisos)
- [API Endpoints](#-api-endpoints)
- [Base de Datos](#-base-de-datos)
- [Desarrollo](#-desarrollo)
- [Docker](#-docker)
- [Troubleshooting](#-troubleshooting)

## ✨ Características

- ✅ **Backend FastAPI** con documentación automática (Swagger/Redoc)
- ✅ **Autenticación JWT** con bcrypt para encriptación de contraseñas
- ✅ **Sistema de registro y login** obligatorio
- ✅ **Modelo de datos relacional** con SQLAlchemy
- ✅ **Migraciones con Alembic** para gestión de esquema
- ✅ **Dockerización completa** (backend + MySQL)
- ✅ **Frontend React** con integración completa
- ✅ **Sistema de permisos por roles** (Residente, Conserje, Directiva, Administrador, Super Admin)
- ✅ **Gestión de gastos comunes, pagos, multas, reservas y anuncios**
- ✅ **Dashboard con estadísticas en tiempo real**
- ✅ **Integración opcional con Google Calendar** para reservas

## 🔧 Requisitos

### Para Desarrollo Local

- **Python 3.11+**
- **Node.js 18+** y npm
- **MySQL 8.0+** (o XAMPP con MySQL)
- **Git**

### Para Docker

- **Docker** y **Docker Compose**

## 🚀 Instalación

### Opción 1: Docker Compose (Recomendado)

1. **Clonar el repositorio:**
```bash
git clone <repo-url>
cd sistema_de_gestion_condominio
```

2. **Configurar variables de entorno:**
Crear archivo `.env` en la raíz del proyecto:
```env
# Base de Datos
DB_HOST=db
DB_PORT=3306
DB_USER=condominio_user
DB_PASSWORD=condominio_pass
DB_NAME=condominio_db

# JWT
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=120

# Google Calendar (Opcional)
GOOGLE_CALENDAR_API_KEY=
GOOGLE_CALENDAR_ID_MULTICANCHA=
GOOGLE_CALENDAR_ID_QUINCHO=
GOOGLE_CALENDAR_ID_SALA_EVENTOS=
```

3. **Iniciar los servicios:**
```bash
docker-compose up -d
```

4. **Verificar que todo esté funcionando:**
- Backend: http://localhost:8000
- Documentación Swagger: http://localhost:8000/docs
- Documentación ReDoc: http://localhost:8000/redoc
- Frontend: http://localhost:3000 (si está configurado)

### Opción 2: Desarrollo Local

#### Backend

1. **Crear entorno virtual:**
```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate
```

2. **Instalar dependencias:**
```bash
pip install -r requirements.txt
```

3. **Configurar variables de entorno:**
Crear archivo `.env` en la raíz del proyecto (no en backend/):
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=condominio_db
JWT_SECRET_KEY=your-secret-key-here
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=120
```

4. **Configurar base de datos:**
- Asegúrate de que MySQL esté corriendo
- Importa el script SQL: `database/condominio_db.sql`

5. **Ejecutar migraciones:**
```bash
cd backend
alembic upgrade head
```

6. **Iniciar el servidor:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

1. **Instalar dependencias:**
```bash
cd frontend
npm install
```

2. **Configurar variables de entorno (opcional):**
Crear archivo `.env.local` en `frontend/`:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

3. **Iniciar el servidor de desarrollo:**
```bash
npm run dev
```

El frontend estará disponible en: http://localhost:3000

## ⚙️ Configuración

### Variables de Entorno

#### Backend (.env en la raíz)

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `DB_HOST` | Host de MySQL | `127.0.0.1` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | (vacío) |
| `DB_NAME` | Nombre de la base de datos | `condominio_db` |
| `JWT_SECRET_KEY` | Clave secreta para JWT | `change-this-secret` |
| `JWT_ALGORITHM` | Algoritmo JWT | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Expiración del token (minutos) | `60` |

#### Frontend (.env.local en frontend/)

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `VITE_API_URL` | URL base de la API | `http://localhost:8000/api/v1` |

## 📖 Uso

### Acceso al Sistema

1. **Abrir el frontend:** http://localhost:3000
2. **Registrarse o iniciar sesión:**
   - Si es la primera vez, usar el endpoint de registro
   - O usar un usuario existente de la base de datos

### Usuarios de Prueba

La base de datos incluye usuarios de ejemplo (ver `database/condominio_db.sql`):

- **Residente:** `residente@example.com` / `password123`
- **Administrador:** `admin@example.com` / `password123`
- **Conserje:** `conserje@example.com` / `password123`

### Funcionalidades Principales

- **Dashboard:** Estadísticas personalizadas según el rol
- **Gastos Comunes:** Gestión de gastos del condominio
- **Pagos:** Consulta y gestión de pagos
- **Multas:** Gestión de multas a residentes
- **Reservas:** Reserva de espacios comunes (multicancha, quincho, sala de eventos)
- **Anuncios:** Publicación y visualización de anuncios
- **Residentes:** Listado y gestión de residentes (solo admin/conserje)
- **Morosidad:** Visualización de morosidad (admin/conserje/directiva)
- **Perfil:** Gestión del perfil personal

## 📁 Estructura del Proyecto

```
sistema_de_gestion_condominio/
├── backend/                    # Backend FastAPI
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── router.py          # Router principal de la API
│   │   │       └── routes/            # Endpoints por módulo
│   │   │           ├── auth.py         # Autenticación (login, registro)
│   │   │           ├── dashboard.py    # Estadísticas del dashboard
│   │   │           ├── gastos.py      # Gastos comunes
│   │   │           ├── pagos.py       # Pagos
│   │   │           ├── multas.py      # Multas
│   │   │           ├── reservas.py    # Reservas de espacios
│   │   │           ├── anuncios.py    # Anuncios
│   │   │           ├── residentes.py   # Residentes
│   │   │           ├── morosidad.py    # Morosidad
│   │   │           ├── perfil.py       # Perfil de usuario
│   │   │           └── viviendas.py    # Viviendas
│   │   ├── core/
│   │   │   ├── config.py              # Configuración y variables de entorno
│   │   │   ├── auth.py                # Dependencias de autenticación JWT
│   │   │   ├── security.py            # Funciones de seguridad (bcrypt, JWT)
│   │   │   └── google_calendar.py     # Configuración Google Calendar
│   │   ├── db/
│   │   │   ├── session.py             # Configuración SQLAlchemy
│   │   │   └── deps.py                # Dependencias de base de datos
│   │   ├── models/
│   │   │   └── models.py              # Modelos SQLAlchemy
│   │   ├── schemas/
│   │   │   └── reservas.py            # Schemas Pydantic para reservas
│   │   ├── services/
│   │   │   └── google_calendar_service.py  # Servicio Google Calendar
│   │   └── main.py                    # Aplicación FastAPI principal
│   ├── alembic/                       # Migraciones de base de datos
│   │   ├── env.py
│   │   └── versions/
│   ├── alembic.ini                     # Configuración Alembic
│   ├── Dockerfile                      # Dockerfile del backend
│   ├── start.sh                        # Script de inicio (Docker)
│   ├── start-backend-internal.bat     # Script de inicio (Windows local)
│   └── requirements.txt                # Dependencias Python
│
├── frontend/                    # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── pages/                 # Páginas principales
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Gastos.jsx
│   │   │   │   ├── Pagos.jsx
│   │   │   │   ├── Multas.jsx
│   │   │   │   ├── Reservas.jsx
│   │   │   │   ├── Anuncios.jsx
│   │   │   │   ├── Residentes.jsx
│   │   │   │   ├── Morosidad.jsx
│   │   │   │   ├── Perfil.jsx
│   │   │   │   └── ...
│   │   │   ├── Reservas/               # Componentes de reservas
│   │   │   ├── LoginScreen.jsx
│   │   │   ├── MainApp.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── ToastContainer.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx         # Contexto de autenticación
│   │   │   └── ThemeContext.jsx        # Contexto de tema (dark/light)
│   │   ├── hooks/
│   │   │   └── usePermissions.js       # Hook de permisos por rol
│   │   ├── services/
│   │   │   ├── api.js                  # Cliente API centralizado
│   │   │   ├── pagosService.js         # Servicio de pagos
│   │   │   ├── reservasService.js      # Servicio de reservas
│   │   │   └── ufService.js            # Servicio UF (CMF)
│   │   ├── App.jsx                     # Componente raíz
│   │   ├── main.jsx                    # Punto de entrada
│   │   └── index.css                   # Estilos globales
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── start-frontend-internal.bat    # Script de inicio (Windows)
│
├── database/
│   └── condominio_db.sql              # Script SQL inicial con datos de ejemplo
│
├── docker-compose.yml                 # Configuración Docker Compose
├── start.bat                          # Script de inicio completo (Windows)
├── start-backend.bat                  # Script solo backend (Windows)
├── .gitignore
└── README.md                          # Este archivo
```

## 🔐 Autenticación y Permisos

### Autenticación JWT

El sistema utiliza **JWT (JSON Web Tokens)** para autenticación:

1. **Registro:** `POST /api/v1/auth/register`
   ```json
   {
     "email": "usuario@example.com",
     "password": "password123",
     "nombre_completo": "Juan Pérez",
     "rol": "Residente"
   }
   ```

2. **Login:** `POST /api/v1/auth/login`
   ```json
   {
     "email": "usuario@example.com",
     "password": "password123"
   }
   ```

3. **Respuesta:** Incluye un token JWT que debe enviarse en el header:
   ```
   Authorization: Bearer <token>
   ```

### Roles y Permisos

| Rol | Descripción | Accesos Principales |
|-----|-------------|---------------------|
| **Residente** | Usuario final | Dashboard propio, Pagos propios, Multas propias, Reservas propias, Anuncios (lectura), Perfil |
| **Conserje** | Personal de mantenimiento | Dashboard, Pagos (todos), Reservas (todas), Novedades (CRUD), Residentes (lectura), Multas (ver todas, crear), Morosidad (ver), Perfil |
| **Directiva** | Miembros del comité | Dashboard, Gastos (lectura), Multas (ver todas), Anuncios (CRUD), Reportes, Morosidad (ver), Perfil |
| **Administrador** | Administrador operativo | Dashboard, Gastos (CRUD), Pagos (todos), Residentes (CRUD), Multas (CRUD), Morosidad (ver/gestionar), Reservas (todas), Anuncios (CRUD), Reportes, Perfil |
| **Super Admin** | Administrador del sistema | Dashboard, Condominios (CRUD), Usuarios (CRUD), Reportes, Perfil |

### Matriz de Permisos Detallada

| Módulo | Residente | Conserje | Directiva | Admin | Super Admin |
|--------|-----------|----------|-----------|-------|-------------|
| Dashboard | Ver (propio) | Ver (básico) | Ver (todo) | Ver (todo) | Ver (todo) |
| Gastos | Ver (propios) | - | Ver (todo) | CRUD | CRUD |
| Pagos | Ver (propios) | Ver (todos) | - | Ver (todos) | Ver (todos) |
| Multas | Ver (propias) | Ver/Crear (todas) | Ver (todas) | CRUD | CRUD |
| Reservas | CRUD (propias) | Ver/Gestionar (todas) | - | Ver/Gestionar (todas) | Ver/Gestionar (todas) |
| Anuncios | Ver | - | CRUD | CRUD | CRUD |
| Residentes | - | Ver | - | CRUD | CRUD |
| Morosidad | - | Ver | Ver | Ver/Gestionar | Ver |
| Novedades | - | CRUD | - | - | - |
| Reportes | - | - | Ver | Ver | Ver |
| Condominios | - | - | - | - | CRUD |
| Usuarios | - | - | - | - | CRUD |
| Perfil | Editar (propio) | Editar (propio) | Editar (propio) | Editar (propio) | Editar (propio) |

## 🔌 API Endpoints

### Autenticación

- `POST /api/v1/auth/register` - Registrar nuevo usuario
- `POST /api/v1/auth/login` - Iniciar sesión
- `POST /api/v1/auth/token` - Obtener token (OAuth2 compatible)
- `GET /api/v1/auth/me` - Obtener usuario actual

### Dashboard

- `GET /api/v1/dashboard/stats/{usuario_id}` - Estadísticas del dashboard

### Gastos Comunes

- `GET /api/v1/gastos/vivienda/{vivienda_id}` - Listar gastos de una vivienda
- `GET /api/v1/gastos/usuario/{usuario_id}` - Listar gastos de un usuario

### Pagos

- `GET /api/v1/pagos/residente/{usuario_id}` - Desglose de pagos del residente
- `GET /api/v1/pagos/todos` - Listar todos los pagos (admin/conserje)

### Multas

- `GET /api/v1/multas/residente/{usuario_id}` - Multas del residente
- `GET /api/v1/multas/todas` - Todas las multas (admin/conserje/directiva)
- `POST /api/v1/multas/` - Crear multa (admin/conserje)

### Reservas

- `GET /api/v1/reservas/espacios` - Listar espacios comunes
- `GET /api/v1/reservas/espacios/{espacio}/disponibilidad` - Disponibilidad de un espacio
- `POST /api/v1/reservas/` - Crear reserva
- `GET /api/v1/reservas/usuario/{usuario_id}` - Reservas del usuario
- `GET /api/v1/reservas/todas` - Todas las reservas (admin/conserje)
- `DELETE /api/v1/reservas/{reserva_id}` - Cancelar reserva

### Anuncios

- `GET /api/v1/anuncios/activos` - Listar anuncios activos
- `GET /api/v1/anuncios/condominio/{condominio_id}` - Anuncios de un condominio

### Residentes

- `GET /api/v1/residentes/` - Listar residentes (admin/conserje)

### Morosidad

- `GET /api/v1/morosidad/` - Estado de morosidad (admin/conserje/directiva)

### Perfil

- `GET /api/v1/perfil/{usuario_id}` - Obtener perfil
- `PUT /api/v1/perfil/{usuario_id}` - Actualizar perfil
- `PUT /api/v1/perfil/{usuario_id}/notificaciones` - Actualizar notificaciones

### Viviendas

- `GET /api/v1/viviendas/` - Listar viviendas (admin/conserje)

**Nota:** Todos los endpoints (excepto `/auth/register` y `/auth/login`) requieren autenticación JWT.

## 🗄️ Base de Datos

### Esquema Principal

- **condominios** - Información de condominios
- **viviendas** - Viviendas del condominio
- **usuarios** - Usuarios del sistema
- **residentes_viviendas** - Relación residente-vivienda
- **gastos_comunes** - Gastos comunes por vivienda
- **pagos** - Pagos realizados
- **multas** - Multas aplicadas
- **espacios_comunes** - Espacios comunes disponibles
- **reservas** - Reservas de espacios comunes
- **anuncios** - Anuncios del condominio

### Inicialización

La base de datos se inicializa automáticamente con `database/condominio_db.sql` cuando se usa Docker Compose, o manualmente importando el script en MySQL.

### Migraciones

El proyecto usa **Alembic** para gestionar migraciones:

```bash
# Crear nueva migración
cd backend
alembic revision --autogenerate -m "descripción del cambio"

# Aplicar migraciones
alembic upgrade head

# Revertir última migración
alembic downgrade -1

# Ver historial
alembic history
```

## 💻 Desarrollo

### Scripts de Inicio (Windows)

- **`start.bat`** - Inicia backend y frontend juntos
- **`start-backend.bat`** - Solo backend
- **`backend/start-backend-internal.bat`** - Backend (interno)
- **`frontend/start-frontend-internal.bat`** - Frontend (interno)

### Estructura de Código

#### Backend

- **FastAPI** con estructura modular
- **SQLAlchemy** para ORM
- **Pydantic** para validación de datos
- **Alembic** para migraciones
- **python-jose** para JWT
- **bcrypt** para hash de contraseñas

#### Frontend

- **React 18+** con hooks
- **Vite** como bundler
- **React Router** para navegación
- **Tailwind CSS** para estilos
- **Axios** para peticiones HTTP
- **Context API** para estado global

### Agregar Nuevo Endpoint

1. **Crear ruta en `backend/app/api/v1/routes/`**
2. **Registrar en `backend/app/api/v1/router.py`**
3. **Crear componente en `frontend/src/components/pages/`**
4. **Agregar ruta en `frontend/src/components/MainApp.jsx`**
5. **Actualizar permisos en `frontend/src/hooks/usePermissions.js`**
6. **Actualizar Sidebar y ProtectedRoute**

## 🐳 Docker

### Docker Compose

El archivo `docker-compose.yml` incluye:

- **Backend:** Servicio FastAPI en puerto 8000
- **MySQL:** Base de datos en puerto 3306

### Comandos Útiles

```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f backend
docker-compose logs -f db

# Detener servicios
docker-compose down

# Reconstruir imágenes
docker-compose build --no-cache

# Acceder al contenedor del backend
docker-compose exec backend bash

# Ejecutar migraciones en Docker
docker-compose exec backend alembic upgrade head
```

## 🔧 Troubleshooting

### Error: "No se puede conectar a la base de datos"

**Solución:**
1. Verificar que MySQL esté corriendo
2. Verificar credenciales en `.env`
3. Verificar que la base de datos `condominio_db` exista
4. Si usas Docker, verificar que el contenedor `db` esté corriendo

### Error: "ModuleNotFoundError: No module named 'jose'"

**Solución:**
```bash
cd backend
pip install -r requirements.txt
```

### Error: "401 Unauthorized" en el frontend

**Solución:**
1. Verificar que el token JWT esté siendo enviado en los headers
2. Verificar que el token no haya expirado
3. Hacer login nuevamente

### Error: "CORS policy" en el navegador

**Solución:**
- El backend ya tiene CORS configurado para `localhost:3000` y `localhost:3001`
- Si usas otro puerto, agregarlo en `backend/app/main.py`

### El frontend no carga datos

**Solución:**
1. Verificar que el backend esté corriendo en `http://localhost:8000`
2. Verificar la variable `VITE_API_URL` en el frontend
3. Revisar la consola del navegador para errores
4. Verificar que el token JWT sea válido

## 📚 Documentación Adicional

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI JSON:** http://localhost:8000/openapi.json

## 🔒 Seguridad

### Recomendaciones

1. **Cambiar `JWT_SECRET_KEY`** en producción
2. **Usar HTTPS** en producción
3. **Validar todas las entradas** del usuario
4. **Implementar rate limiting** para prevenir abuso
5. **Hacer backups regulares** de la base de datos
6. **Mantener dependencias actualizadas**

## 📝 Licencia

Este proyecto es de uso interno.

## 👥 Contribución

Para contribuir al proyecto:

1. Crear una rama desde `main`
2. Realizar los cambios
3. Probar localmente
4. Crear un Pull Request

## 📞 Soporte

Para problemas o preguntas:
- Revisar la documentación en `/docs` (si existe)
- Revisar los logs del servidor
- Consultar la documentación de Swagger en `/docs`

---

**Desarrollado con ❤️ para la gestión eficiente de condominios**
