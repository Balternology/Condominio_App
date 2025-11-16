# Información Técnica del Proyecto - Sistema de Gestión de Condominio

## Resumen Ejecutivo

Este documento detalla las implementaciones técnicas principales del sistema de gestión de condominio, explicando de manera clara el propósito y aplicación de cada tecnología utilizada: **FastAPI**, **Alembic**, **Docker Compose**, **Login**, **Bcrypt**, **Tokens JWT** y **SQLAlchemy**.

---

## 1. FastAPI - Framework Web Asíncrono

### ¿Qué es FastAPI?

FastAPI es un framework moderno de Python para construir APIs REST de alto rendimiento. Utiliza Python 3.6+ con type hints y está basado en estándares abiertos (OpenAPI, JSON Schema).

### Arquitectura en el Proyecto

#### 1.1. Estructura Modular con Routers

El proyecto organiza los endpoints en módulos separados:

```python
# backend/app/api/v1/router.py
api_router = APIRouter()  # Router principal

# Rutas públicas (sin autenticación)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Rutas protegidas (con autenticación JWT)
protected_router = APIRouter(dependencies=[Depends(get_current_active_user)])
protected_router.include_router(gastos.router, prefix="/gastos", tags=["gastos"])
protected_router.include_router(reservas.router, prefix="/reservas", tags=["reservas"])
# ... 10 routers más
```

**Ventajas:**
- **Separación de responsabilidades**: Cada módulo maneja su dominio
- **Protección automática**: Todas las rutas protegidas requieren JWT
- **Organización**: Tags agrupan endpoints en Swagger

#### 1.2. Sistema de Inyección de Dependencias

FastAPI inyecta dependencias automáticamente:

```python
# Ejemplo real del proyecto
@router.post("/reservas/")
async def crear_reserva(
    reserva_data: ReservaCreate,  # Validación automática con Pydantic
    db: Session = Depends(get_db),  # Sesión de BD inyectada
    current_user: Usuario = Depends(get_current_active_user)  # Usuario del JWT
):
    # FastAPI automáticamente:
    # 1. Valida reserva_data según ReservaCreate
    # 2. Crea sesión de BD con get_db()
    # 3. Valida JWT y obtiene usuario con get_current_active_user
    # 4. Pasa todo al endpoint
```

**Flujo de dependencias:**
```
Cliente → FastAPI → get_current_active_user → get_current_user → get_db → Endpoint
```

#### 1.3. Validación Automática con Pydantic

```python
# backend/app/schemas/reservas.py
class ReservaCreate(BaseModel):
    espacio: str = Field(..., description="Tipo de espacio: multicancha, quincho, sala_eventos")
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "espacio": "multicancha",
                "fecha_hora_inicio": "2025-10-25T18:00:00",
                "fecha_hora_fin": "2025-10-25T19:00:00"
            }
        }
```

FastAPI valida automáticamente:
- ✅ Tipos de datos
- ✅ Campos requeridos
- ✅ Formatos (email, datetime, etc.)
- ✅ Valores personalizados

Si falla, retorna **422 Unprocessable Entity** con detalles del error.

#### 1.4. Documentación Automática

Al iniciar el servidor, FastAPI genera automáticamente:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

**Características:**
- Lista todos los endpoints
- Muestra parámetros y tipos
- Incluye ejemplos de request/response
- Permite probar endpoints directamente
- Genera esquemas de datos automáticamente

#### 1.5. Middleware CORS

```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,  # Permite cookies y headers de auth
    allow_methods=["*"],  # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"]  # Incluyendo Authorization para JWT
)
```

**Propósito:** Permite que el frontend (React en puerto 3000) haga peticiones al backend (puerto 8000) sin errores de CORS.

#### 1.6. Endpoints Asíncronos

```python
async def crear_reserva(...):  # async permite operaciones concurrentes
    # Mientras espera respuesta de BD, puede atender otras peticiones
    espacio_db = db.query(EspacioComun).filter(...).first()
    # Operaciones I/O no bloquean el servidor
```

**Ventajas:**
- Mejor rendimiento con operaciones I/O
- Soporta muchas conexiones simultáneas
- Compatible con `async/await` de Python

---

## 2. Alembic - Sistema de Migraciones de Base de Datos

### ¿Qué es Alembic?

Alembic es la herramienta de migraciones oficial de SQLAlchemy. Permite versionar cambios en el esquema de base de datos de forma controlada y reversible.

### Funcionamiento Detallado

#### 2.1. Estructura de Archivos

```
backend/
├── alembic.ini          # Configuración principal
├── alembic/
│   ├── env.py           # Entorno de ejecución
│   ├── script.py.mako   # Plantilla para nuevas migraciones
│   └── versions/
│       └── 20241112_000001_initial_schema.py  # Migración inicial
```

#### 2.2. Configuración (alembic.ini)

```ini
[alembic]
script_location = alembic
sqlalchemy.url = %%(ALEMBIC_DATABASE_URL)s  # Variable de entorno
```

El `%%(ALEMBIC_DATABASE_URL)s` se reemplaza por la URL de la base de datos desde variables de entorno.

#### 2.3. Entorno de Ejecución (alembic/env.py)

```python
# Importa los modelos para que Alembic conozca el esquema
from app.models import Base
target_metadata = Base.metadata

# Detecta si está en modo offline u online
if context.is_offline_mode():
    run_migrations_offline()  # Genera SQL sin ejecutar
else:
    run_migrations_online()   # Ejecuta directamente en BD
```

#### 2.4. Migración Inicial

La migración `20241112_000001_initial_schema.py` crea todo el esquema:

```python
def upgrade() -> None:
    # Crea tabla condominios
    op.create_table("condominios", ...)
    
    # Crea tabla usuarios con índices
    op.create_table("usuarios", ...)
    op.create_index("idx_usuarios_email", "usuarios", ["email"])
    
    # Crea tabla viviendas con foreign key
    op.create_table("viviendas",
        sa.Column("condominio_id", sa.BigInteger(), 
                  ForeignKey("condominios.id", ondelete="RESTRICT")),
        ...
    )
    
    # ... 8 tablas más
    
    # Inserta datos de prueba
    op.bulk_insert(...)
```

**Características:**
- ✅ Constraints (unique, check)
- ✅ Foreign keys con reglas (CASCADE, RESTRICT)
- ✅ Índices para rendimiento
- ✅ Datos iniciales (seed)

#### 2.5. Comandos de Alembic

```bash
# Crear nueva migración (detecta cambios automáticamente)
alembic revision --autogenerate -m "agregar campo nuevo"

# Aplicar migraciones pendientes
alembic upgrade head

# Revertir última migración
alembic downgrade -1

# Ver historial
alembic history

# Ver migración actual
alembic current
```

#### 2.6. Integración con Docker

```bash
# backend/start.sh
#!/bin/sh
set -e

alembic upgrade head  # Aplica migraciones antes de iniciar

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**En cada inicio del contenedor:**
1. Verifica migraciones pendientes
2. Las aplica automáticamente
3. Inicia el servidor

#### 2.7. Versionado del Esquema

Cada migración tiene:
- `revision`: ID único (timestamp)
- `down_revision`: ID de la migración anterior
- `upgrade()`: Cambios hacia adelante
- `downgrade()`: Reversión

**Ejemplo de historial:**
```
20241112_000001 (head) ← Migración actual
20241115_000002         ← Nueva migración (futura)
```

---

## 3. Docker Compose - Orquestación de Contenedores

### ¿Qué es Docker Compose?

Docker Compose es una herramienta para definir y ejecutar aplicaciones multi-contenedor. Permite orquestar servicios relacionados en un solo archivo YAML.

### Configuración Detallada del Proyecto

#### 3.1. Archivo docker-compose.yml

```yaml
version: "3.9"

services:
  db:  # Servicio de base de datos MySQL
    image: mysql:8.0
    container_name: condominio-db
    restart: always  # Reinicia automáticamente si falla
    environment:
      MYSQL_DATABASE: condominio_db
      MYSQL_ROOT_PASSWORD: condominio
      MYSQL_USER: condominio
      MYSQL_PASSWORD: condominio
    ports:
      - "3306:3306"  # Expone puerto 3306 al host
    volumes:
      - db_data:/var/lib/mysql  # Persistencia de datos
      - ./database/condominio_db.sql:/docker-entrypoint-initdb.d/condominio_db.sql:ro
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
```

**Explicación:**
- `image: mysql:8.0`: Imagen oficial de MySQL 8.0
- `restart: always`: Reinicia automáticamente si falla
- `ports: "3306:3306"`: Mapeo de puertos (host:contenedor)
- `volumes`: Persistencia de datos y scripts de inicialización
- `healthcheck`: Verifica que MySQL esté listo

#### 3.2. Servicio Backend

```yaml
backend:
  build:
    context: ./backend  # Construye desde Dockerfile en ./backend
  container_name: condominio-backend
  restart: unless-stopped
  depends_on:
    db:
      condition: service_healthy  # Espera a que MySQL esté saludable
  environment:
    DB_HOST: db  # Nombre del servicio (DNS interno de Docker)
    DB_PORT: 3306
    DATABASE_URL: mysql+pymysql://condominio:condominio@db:3306/condominio_db
    JWT_SECRET_KEY: super-secret-key-change-me
  ports:
    - "8000:8000"  # Expone API en puerto 8000
  volumes:
    - ./backend/app:/app/app:ro  # Monta código para desarrollo (read-only)
  command: ["./start.sh"]  # Script de inicio
```

**Características:**
- `depends_on`: Orden de inicio
- `condition: service_healthy`: Espera healthcheck
- `volumes`: Monta código para desarrollo
- Variables de entorno para configuración

#### 3.3. Red Interna de Docker

Los servicios se comunican por nombre:
- `db` → `condominio-db`
- `backend` → `condominio-backend`

**DNS interno:**
```python
# En el código Python
DB_HOST = "db"  # Docker resuelve automáticamente a la IP del contenedor
```

#### 3.4. Volúmenes Persistentes

```yaml
volumes:
  db_data:  # Volumen nombrado (persistente)
    # Docker gestiona este volumen
    # Los datos sobreviven a reinicios del contenedor
```

**Ubicación:**
- Linux: `/var/lib/docker/volumes/condominio_app_db_data`
- Windows: `\\wsl$\docker-desktop-data\data\docker\volumes`

#### 3.5. Comandos Útiles

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (¡CUIDADO! Borra datos)
docker-compose down -v

# Reconstruir imágenes
docker-compose build --no-cache

# Ejecutar comando en contenedor
docker-compose exec backend alembic upgrade head
```

#### 3.6. Ventajas de Docker Compose

1. **Reproducibilidad**: Mismo entorno en cualquier máquina
2. **Aislamiento**: Servicios independientes
3. **Escalabilidad**: Fácil agregar más servicios
4. **Desarrollo**: Cambios en código sin reconstruir imagen
5. **Producción**: Mismo archivo para despliegue

---

## 4. Login - Sistema de Autenticación

### Arquitectura del Sistema de Login

#### 4.1. Flujo Completo

```
1. Cliente envía credenciales
   POST /api/v1/auth/login
   {
     "email": "usuario@example.com",
     "password": "password123"
   }
   
2. Backend valida credenciales
   ├─ Busca usuario en BD por email
   ├─ Verifica contraseña con bcrypt
   ├─ Verifica que usuario esté activo
   └─ Genera token JWT
   
3. Backend retorna token
   {
     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "token_type": "bearer",
     "expires_in": 3600,
     "user": {
       "id": 1,
       "email": "usuario@example.com",
       "nombre_completo": "Juan Pérez",
       "rol": "residente"
     }
   }
   
4. Cliente almacena token
   localStorage.setItem('token', response.access_token)
   
5. Cliente usa token en peticiones
   GET /api/v1/reservas/
   Headers: {
     "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
```

#### 4.2. Endpoint de Login

```python
# backend/app/api/v1/routes/auth.py
@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    return _authenticate_user(payload.email, payload.password, db)
```

**Validación automática:**
- `LoginRequest` valida email y longitud de contraseña
- FastAPI retorna 422 si no cumple

#### 4.3. Función de Autenticación

```python
def _authenticate_user(email: str, password: str, db: Session) -> TokenResponse:
    # 1. Buscar usuario
    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    
    # 2. Verificar existencia
    if not usuario or not usuario.password_hash:
        raise HTTPException(401, "Credenciales inválidas")
    
    # 3. Verificar estado activo
    if not usuario.is_active:
        raise HTTPException(403, "Usuario inactivo")
    
    # 4. Verificar contraseña (bcrypt)
    if not verify_password(password, usuario.password_hash):
        raise HTTPException(401, "Credenciales inválidas")
    
    # 5. Actualizar último login
    usuario.last_login = datetime.utcnow()
    db.commit()
    
    # 6. Generar y retornar token JWT
    return _build_token_response(usuario)
```

**Seguridad:**
- No expone si el email existe
- Mensajes genéricos para evitar enumeración
- Actualiza `last_login` solo si autenticación exitosa

#### 4.4. Endpoint de Registro

```python
@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    # Verificar que email no exista
    existing = db.query(Usuario).filter(Usuario.email == payload.email).first()
    if existing:
        raise HTTPException(400, "El email ya está registrado")
    
    # Hash de contraseña con bcrypt
    hashed_password = get_password_hash(payload.password)
    
    # Crear usuario
    nuevo_usuario = Usuario(
        email=payload.email,
        password_hash=hashed_password,  # NUNCA texto plano
        nombre_completo=payload.nombre_completo,
        rol=payload.rol or "Residente",  # Default
        is_active=True,
        notificaciones_email=True,
        notificaciones_push=True
    )
    
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    
    # Retornar token inmediatamente (login automático)
    return _build_token_response(nuevo_usuario)
```

#### 4.5. Protección de Endpoints

```python
# backend/app/core/auth.py
def get_current_user(
    token: str = Depends(oauth2_scheme),  # Extrae token del header
    db: Session = Depends(get_db)
) -> Usuario:
    # 1. Decodifica token JWT
    subject = get_token_subject(token)  # Obtiene ID del usuario
    
    # 2. Busca usuario en BD
    user = db.query(Usuario).filter(Usuario.id == int(subject)).first()
    
    if user is None:
        raise HTTPException(401, "No se pudo validar las credenciales")
    
    return user

def get_current_active_user(
    current_user: Usuario = Depends(get_current_user)
) -> Usuario:
    # Verifica adicional que usuario esté activo
    if not current_user.is_active:
        raise HTTPException(403, "Usuario inactivo")
    return current_user
```

**Uso en endpoints:**
```python
@router.get("/reservas/")
async def listar_reservas(
    current_user: Usuario = Depends(get_current_active_user)
):
    # Solo usuarios autenticados y activos pueden acceder
    # current_user ya está disponible con todos sus datos
    return {"reservas": ...}
```

#### 4.6. Manejo de Errores

```python
# Errores posibles y respuestas HTTP
401 Unauthorized: Token inválido, expirado o no proporcionado
403 Forbidden: Usuario inactivo o sin permisos
422 Unprocessable Entity: Datos de entrada inválidos
500 Internal Server Error: Error del servidor
```

---

## 5. Bcrypt - Hash de Contraseñas

### ¿Qué es Bcrypt?

Bcrypt es un algoritmo de hash diseñado específicamente para contraseñas. Es lento intencionalmente para resistir ataques de fuerza bruta.

### Implementación Detallada

#### 5.1. Generación de Hash

```python
# backend/app/core/security.py
def get_password_hash(password: str) -> str:
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()  # Genera salt aleatorio (único cada vez)
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")
```

**Proceso:**
1. Convierte contraseña a bytes
2. Genera salt aleatorio
3. Combina contraseña + salt
4. Aplica algoritmo bcrypt (cost factor por defecto: 12)
5. Retorna hash como string

**Ejemplo:**
```python
hash1 = get_password_hash("password123")
# Resultado: $2b$12$QsXhxkm5xF0rnzO63VHanehDVzkPQgi4gfARKAvFpGfd3dgCwh2Ry

hash2 = get_password_hash("password123")
# Resultado: $2b$12$DiferenteSaltAleatorioGeneradoCadaVez...
# ¡Diferente hash! Pero ambos verifican la misma contraseña
```

**Estructura del hash:**
```
$2b$12$QsXhxkm5xF0rnzO63VHanehDVzkPQgi4gfARKAvFpGfd3dgCwh2Ry
│  │  │                                    │
│  │  │                                    └─ Hash (31 caracteres)
│  │  └─ Salt (22 caracteres)
│  └─ Cost factor (12 = 2^12 iteraciones)
└─ Versión del algoritmo (2b)
```

#### 5.2. Verificación de Contraseña

```python
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except ValueError:
        return False  # Hash corrupto o formato inválido
```

**Proceso:**
1. Extrae salt del hash almacenado
2. Aplica bcrypt a la contraseña con ese salt
3. Compara resultado con el hash almacenado
4. Retorna `True` si coinciden

**Seguridad:**
- Comparación constante en tiempo (evita timing attacks)
- Manejo de errores sin exponer información

#### 5.3. Uso en Registro

```python
# backend/app/api/v1/routes/auth.py
@router.post("/register")
async def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    # Hash ANTES de guardar
    hashed_password = get_password_hash(payload.password)
    
    nuevo_usuario = Usuario(
        email=payload.email,
        password_hash=hashed_password,  # Solo hash, nunca texto plano
        ...
    )
    db.add(nuevo_usuario)
    db.commit()
```

**Regla de oro:** La contraseña en texto plano **NUNCA** se guarda en BD.

#### 5.4. Uso en Login

```python
def _authenticate_user(email: str, password: str, db: Session):
    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    
    # Verificar contraseña con hash almacenado
    if not verify_password(password, usuario.password_hash):
        raise HTTPException(401, "Credenciales inválidas")
    
    # Si llega aquí, contraseña es correcta
    return _build_token_response(usuario)
```

#### 5.5. Cost Factor

El cost factor controla la cantidad de trabajo:

```python
# Cost factor 12 (por defecto en bcrypt)
# = 2^12 = 4,096 iteraciones
# Tiempo aproximado: ~300ms por hash

# Cost factor 14
# = 2^14 = 16,384 iteraciones
# Tiempo aproximado: ~1.2s por hash (más seguro, más lento)
```

**Balance:**
- Más alto = más seguro pero más lento
- Más bajo = más rápido pero menos seguro
- 12 es un buen balance para la mayoría de aplicaciones

#### 5.6. Ventajas de Bcrypt

1. **Resistente a fuerza bruta**: Lento intencionalmente
2. **Salt único**: Cada hash es diferente
3. **Adaptable**: Cost factor ajustable
4. **Probado**: Ampliamente usado en la industria
5. **Protección contra timing attacks**: Comparación constante

**Comparación con otros métodos:**
```
MD5:     Instantáneo (inseguro, no usar)
SHA256:  Instantáneo (no diseñado para contraseñas)
bcrypt:  ~300ms (diseñado para contraseñas) ✅
Argon2:  ~500ms (más moderno, también bueno)
```

---

## 6. Tokens JWT (JSON Web Tokens)

### ¿Qué es JWT?

JWT es un estándar abierto (RFC 7519) para tokens de autenticación. Permite autenticación stateless (sin sesiones en servidor).

### Estructura de un JWT

Un JWT tiene 3 partes separadas por puntos:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE2MTYyNDI2MjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
│─────────────────────────────────────────────────────────────────││───────────────────────────────────────────────────────────────────││──────────────────────────────────────────────────────────────│
                    HEADER                                              PAYLOAD                                                      SIGNATURE
```

#### 6.1. Header (Metadatos)

```json
{
  "alg": "HS256",  // Algoritmo de firma
  "typ": "JWT"     // Tipo de token
}
```

Codificado en Base64URL.

#### 6.2. Payload (Claims)

```json
{
  "sub": "1",                    // Subject: ID del usuario
  "iat": 1616239022,            // Issued at: timestamp de creación
  "exp": 1616242622             // Expiration: timestamp de expiración
}
```

**Claims estándar:**
- `sub` (subject): ID del usuario
- `iat` (issued at): Cuándo se emitió
- `exp` (expiration): Cuándo expira

#### 6.3. Signature (Firma)

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET_KEY
)
```

**Garantiza:**
- Que el token no fue modificado
- Que fue emitido por el servidor (conoce la clave secreta)

### Implementación en el Proyecto

#### 6.4. Creación de Tokens

```python
# backend/app/core/security.py
def create_access_token(
    subject: Union[str, int],  # ID del usuario
    expires_delta: Optional[timedelta] = None,
    additional_claims: Optional[Dict[str, Any]] = None
) -> str:
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    now = datetime.now(timezone.utc)
    expire = now + expires_delta
    
    # Construir payload
    to_encode = {
        "sub": str(subject),  # ID del usuario
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp())
    }
    
    # Agregar claims adicionales si existen
    if additional_claims:
        to_encode.update(additional_claims)
    
    # Codificar y firmar
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,  # Clave secreta
        algorithm=settings.JWT_ALGORITHM  # HS256
    )
    return encoded_jwt
```

**Ejemplo de uso:**
```python
# Al hacer login
token = create_access_token(subject=usuario.id)  # subject = 1
# Resultado: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 6.5. Decodificación y Validación

```python
def decode_access_token(token: str) -> Dict[str, Any]:
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,  # Debe coincidir con la de creación
        algorithms=[settings.JWT_ALGORITHM]  # Solo acepta HS256
    )
    # Si el token es inválido, expirado o la firma no coincide,
    # lanza JWTError automáticamente
```

**Validaciones automáticas:**
- ✅ Firma válida
- ✅ No expirado (`exp`)
- ✅ Algoritmo correcto
- ✅ Formato válido

#### 6.6. Extracción del Usuario

```python
# backend/app/core/auth.py
def get_current_user(
    token: str = Depends(oauth2_scheme),  # Extrae de header Authorization
    db: Session = Depends(get_db)
) -> Usuario:
    # 1. Decodifica token (valida firma y expiración)
    subject = get_token_subject(token)  # Obtiene "sub" (ID usuario)
    
    # 2. Busca usuario en BD
    user = db.query(Usuario).filter(Usuario.id == int(subject)).first()
    
    if user is None:
        raise HTTPException(401, "No se pudo validar las credenciales")
    
    return user
```

**Flujo:**
```
Header: Authorization: Bearer <token>
  ↓
oauth2_scheme extrae token
  ↓
get_token_subject decodifica y valida
  ↓
Obtiene "sub" (ID usuario = 1)
  ↓
Busca usuario con ID 1 en BD
  ↓
Retorna objeto Usuario completo
```

#### 6.7. Configuración

```python
# backend/app/core/config.py
class Settings:
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "change-this-secret")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 60)
    )
```

**Variables de entorno:**
```bash
JWT_SECRET_KEY=super-secret-key-change-me-in-production
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=120  # 2 horas
```

**⚠️ IMPORTANTE:** Cambiar `JWT_SECRET_KEY` en producción.

#### 6.8. Uso en el Frontend

```javascript
// Al hacer login
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
const { access_token } = await response.json();

// Guardar token
localStorage.setItem('token', access_token);

// Usar en peticiones
fetch('/api/v1/reservas/', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

#### 6.9. Ventajas de JWT

1. **Stateless**: No requiere sesiones en servidor
2. **Escalable**: Cualquier servidor puede validar
3. **Portable**: Funciona en múltiples dominios
4. **Estándar**: Ampliamente soportado
5. **Incluye expiración**: Tokens temporales

**Limitaciones:**
- No se puede revocar fácilmente (hasta que expire)
- Tamaño mayor que session IDs
- Contenido visible (aunque firmado)

---

## 7. SQLAlchemy - ORM (Object-Relational Mapping)

### ¿Qué es SQLAlchemy?

SQLAlchemy es un ORM (Object-Relational Mapping) que permite interactuar con bases de datos usando objetos Python en lugar de SQL directo.

### Arquitectura en el Proyecto

#### 7.1. Configuración del Engine

```python
# backend/app/db/session.py
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

# URL de conexión
database_url = "mysql+pymysql://usuario:password@host:puerto/database"

# Crear engine (pool de conexiones)
engine = create_engine(
    database_url,
    pool_pre_ping=True,      # Verifica conexiones antes de usarlas
    pool_size=5,              # 5 conexiones en el pool
    pool_recycle=3600,        # Recicla conexiones cada hora
    max_overflow=10,           # Permite hasta 10 conexiones adicionales
    echo=False                 # No mostrar SQL en logs
)

# Crear sessionmaker (factory de sesiones)
SessionLocal = sessionmaker(
    autocommit=False,  # No auto-commit (transacciones explícitas)
    autoflush=False,   # No auto-flush (control manual)
    bind=engine
)
```

**Pool de conexiones:**
- Reutiliza conexiones
- Evita crear/cerrar conexiones constantemente
- Mejora rendimiento

#### 7.2. Modelos (Definición de Tablas)

```python
# backend/app/models/models.py
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import Column, BigInteger, String, ForeignKey

Base = declarative_base()  # Base para todos los modelos

class Usuario(Base):
    __tablename__ = "usuarios"  # Nombre de la tabla en BD
    
    # Columnas
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    email = Column(String(254), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    nombre_completo = Column(String(200), nullable=False)
    rol = Column(String(30), nullable=False, server_default="Residente")
    is_active = Column(Boolean, nullable=False, server_default="true")
    
    # Timestamps automáticos
    created_at = Column(DateTime(timezone=True), 
                       server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True),
                       server_default=func.now(),
                       onupdate=func.now(),  # Se actualiza automáticamente
                       nullable=False)
    
    # Relaciones (no son columnas, son propiedades Python)
    viviendas = relationship("ResidenteVivienda", back_populates="usuario")
    reservas = relationship("Reserva", back_populates="usuario")
    pagos = relationship("Pago", back_populates="usuario")
```

**Características:**
- `server_default`: Valor por defecto en BD
- `onupdate`: Actualización automática
- `relationship`: Acceso a objetos relacionados

#### 7.3. Relaciones entre Modelos

```python
# Modelo Vivienda
class Vivienda(Base):
    __tablename__ = "viviendas"
    
    id = Column(BigInteger, primary_key=True)
    condominio_id = Column(
        BigInteger,
        ForeignKey("condominios.id", ondelete="RESTRICT"),  # Foreign key
        nullable=False
    )
    
    # Relación: una vivienda pertenece a un condominio
    condominio = relationship("Condominio", back_populates="viviendas")
    
    # Relación: una vivienda tiene muchos gastos
    gastos = relationship("GastoComun", back_populates="vivienda")

# Modelo Condominio
class Condominio(Base):
    __tablename__ = "condominios"
    
    id = Column(BigInteger, primary_key=True)
    
    # Relación: un condominio tiene muchas viviendas
    viviendas = relationship("Vivienda", back_populates="condominio")
```

**Tipos de relaciones:**
- **Uno a muchos**: `Condominio` → `Vivienda`
- **Muchos a muchos**: `Usuario` ↔ `Vivienda` (tabla intermedia)
- **Uno a uno**: Menos común

#### 7.4. Uso de Sesiones

```python
# backend/app/db/deps.py
def get_db() -> Generator:
    """
    Dependencia de FastAPI que proporciona sesión de BD.
    Es un generador que:
    1. Crea sesión
    2. La entrega (yield)
    3. Cierra sesión automáticamente
    """
    db = SessionLocal()  # Crea nueva sesión
    try:
        yield db  # Entrega al endpoint
    finally:
        db.close()  # Siempre cierra, incluso si hay error
```

**Uso en endpoints:**
```python
@router.get("/usuarios")
async def listar_usuarios(db: Session = Depends(get_db)):
    # db es una sesión de SQLAlchemy
    usuarios = db.query(Usuario).all()  # SELECT * FROM usuarios
    return usuarios
```

#### 7.5. Queries Comunes

```python
# SELECT simple
usuarios = db.query(Usuario).all()  # Todos los usuarios

# SELECT con filtro
usuario = db.query(Usuario).filter(Usuario.email == "test@example.com").first()

# SELECT con múltiples filtros
gastos = db.query(GastoComun).filter(
    GastoComun.vivienda_id == 1,
    GastoComun.estado == "pendiente"
).all()

# SELECT con ordenamiento
reservas = db.query(Reserva).order_by(
    Reserva.fecha_hora_inicio.desc()
).all()

# SELECT con límite
ultimos_pagos = db.query(Pago).order_by(
    Pago.fecha_pago.desc()
).limit(10).all()

# JOIN implícito (usando relaciones)
vivienda = db.query(Vivienda).filter(Vivienda.id == 1).first()
gastos = vivienda.gastos  # Acceso directo a gastos relacionados

# JOIN explícito
resultados = db.query(Usuario, Vivienda).join(
    ResidenteVivienda
).filter(
    Usuario.id == ResidenteVivienda.usuario_id
).all()
```

#### 7.6. Transacciones

```python
# Crear nuevo registro
nuevo_usuario = Usuario(
    email="nuevo@example.com",
    password_hash=hashed_password,
    nombre_completo="Juan Pérez"
)
db.add(nuevo_usuario)  # Agrega a la sesión (no guarda aún)
db.commit()            # Guarda en BD (transacción)
db.refresh(nuevo_usuario)  # Recarga desde BD (obtiene ID generado)

# Actualizar registro
usuario = db.query(Usuario).filter(Usuario.id == 1).first()
usuario.nombre_completo = "Juan Pérez Actualizado"
db.commit()  # Guarda cambios

# Eliminar registro
usuario = db.query(Usuario).filter(Usuario.id == 1).first()
db.delete(usuario)
db.commit()

# Rollback en caso de error
try:
    nuevo_usuario = Usuario(...)
    db.add(nuevo_usuario)
    db.commit()
except Exception as e:
    db.rollback()  # Revierte cambios
    raise HTTPException(500, "Error al crear usuario")
```

#### 7.7. Configuración Específica para MySQL

```python
# backend/app/db/session.py
if driver.startswith("mysql"):
    engine_kwargs["connect_args"] = {
        "connect_timeout": 10,
        "charset": "utf8mb4",  # Soporta emojis y caracteres especiales
        "autocommit": False,
        "init_command": "SET sql_mode='STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'"
    }

# Event listener para cada nueva conexión
@event.listens_for(engine, "connect")
def set_mysql_mode(dbapi_conn, connection_record):
    """Configura MySQL al conectar"""
    with dbapi_conn.cursor() as cursor:
        cursor.execute("SET sql_mode='STRICT_TRANS_TABLES,...'")
        cursor.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci")
```

**Configuraciones:**
- `utf8mb4`: Soporte completo de Unicode
- `STRICT_TRANS_TABLES`: Modo estricto de MySQL
- `NO_ZERO_DATE`: Previene fechas inválidas

#### 7.8. Ventajas de SQLAlchemy

1. **Abstracción**: Código Python en lugar de SQL
2. **Seguridad**: Protección contra SQL injection
3. **Portabilidad**: Mismo código para diferentes BDs
4. **Relaciones**: Acceso fácil a datos relacionados
5. **Migraciones**: Integración con Alembic
6. **Type hints**: Mejor IDE support y validación

**Comparación:**
```python
# SQL directo (vulnerable a injection)
cursor.execute(f"SELECT * FROM usuarios WHERE email = '{email}'")

# SQLAlchemy (seguro)
db.query(Usuario).filter(Usuario.email == email).first()
# SQLAlchemy escapa automáticamente, previniendo injection
```

---

## Integración Completa del Stack

### Flujo de una Petición Completa

```
1. Cliente hace petición
   POST /api/v1/auth/login
   {
     "email": "usuario@example.com",
     "password": "password123"
   }

2. FastAPI recibe petición
   ├─ Valida formato con Pydantic (LoginRequest)
   ├─ Inyecta dependencia get_db()
   └─ Ejecuta endpoint login()

3. Endpoint procesa
   ├─ SQLAlchemy busca usuario: db.query(Usuario).filter(...)
   ├─ Bcrypt verifica contraseña: verify_password(...)
   └─ JWT genera token: create_access_token(usuario.id)

4. Respuesta al cliente
   {
     "access_token": "eyJ...",
     "user": {...}
   }

5. Cliente usa token
   GET /api/v1/reservas/
   Header: Authorization: Bearer eyJ...

6. FastAPI valida token
   ├─ get_current_user extrae y valida JWT
   ├─ SQLAlchemy busca usuario: db.query(Usuario).filter(id=...)
   └─ Pasa usuario al endpoint

7. Endpoint ejecuta lógica
   ├─ SQLAlchemy consulta reservas
   └─ Retorna datos al cliente
```

### Dependencias entre Tecnologías

```
Docker Compose
    ├─ Orquesta MySQL (base de datos)
    └─ Orquesta Backend (aplicación)
            │
            ├─ Alembic
            │   └─ Crea esquema en MySQL usando SQLAlchemy
            │
            ├─ SQLAlchemy
            │   ├─ Define modelos (tablas)
            │   └─ Interactúa con MySQL
            │
            ├─ FastAPI
            │   ├─ Expone endpoints REST
            │   ├─ Usa SQLAlchemy (sesiones)
            │   └─ Usa JWT (autenticación)
            │
            ├─ Bcrypt
            │   └─ Hash de contraseñas (almacenadas por SQLAlchemy)
            │
            └─ JWT
                └─ Tokens de autenticación (validados por FastAPI)
```

### Resumen de Tecnologías

| Tecnología | Propósito | Archivos Principales |
|------------|-----------|---------------------|
| **FastAPI** | Framework web para API REST | `app/main.py`, `app/api/v1/router.py` |
| **Alembic** | Migraciones de base de datos | `alembic.ini`, `alembic/versions/` |
| **Docker Compose** | Orquestación de contenedores | `docker-compose.yml` |
| **Login** | Sistema de autenticación | `app/api/v1/routes/auth.py` |
| **Bcrypt** | Hash de contraseñas | `app/core/security.py` |
| **JWT** | Tokens de autenticación | `app/core/security.py`, `app/core/auth.py` |
| **SQLAlchemy** | ORM para base de datos | `app/models/models.py`, `app/db/session.py` |

---

## Conclusión

Este stack tecnológico proporciona una base sólida, segura y escalable para el sistema de gestión de condominio. Cada tecnología cumple un rol específico y se integra perfectamente con las demás, formando un sistema completo y funcional que facilita el desarrollo, mantenimiento y despliegue de la aplicación.

**Características principales:**
- ✅ **Seguridad**: Bcrypt + JWT + validaciones
- ✅ **Escalabilidad**: FastAPI asíncrono + pool de conexiones
- ✅ **Mantenibilidad**: Código organizado y documentado
- ✅ **Reproducibilidad**: Docker Compose
- ✅ **Versionado**: Alembic para esquema de BD
- ✅ **Productividad**: Documentación automática + validación automática

