# Presentación Técnica - Sistema de Gestión de Condominio
## Guión para Presentación de 10 Minutos

---

## 🎯 ESTRUCTURA GENERAL (10 minutos)

| Tiempo | Sección | Contenido |
|--------|---------|-----------|
| 0:00-0:30 | **Introducción** | Contexto del proyecto |
| 0:30-1:30 | **FastAPI** | Framework web y API REST |
| 1:30-2:30 | **SQLAlchemy** | ORM y base de datos |
| 2:30-3:30 | **Alembic** | Migraciones de BD |
| 3:30-4:30 | **Docker Compose** | Contenedores y orquestación |
| 4:30-6:00 | **Seguridad (Bcrypt + JWT)** | Autenticación y protección |
| 6:00-7:00 | **Sistema de Login** | Flujo completo |
| 7:00-8:30 | **Integración** | Cómo trabajan juntas |
| 8:30-9:30 | **Demostración** | Código o endpoints |
| 9:30-10:00 | **Conclusiones** | Resumen y preguntas |

---

## 📝 GUION DETALLADO

### 0:00 - 0:30 | INTRODUCCIÓN

**Dice el presentador:**

> "Buenos días/tardes profesor. Hoy presentaremos el sistema de gestión de condominio que desarrollamos como equipo, enfocándonos en las tecnologías backend implementadas. El proyecto es una API REST completa que gestiona condominios, residentes, gastos comunes, reservas de espacios y pagos. Elegimos un stack tecnológico moderno y robusto que incluye 7 tecnologías principales que explicaremos a continuación."

**Puntos clave:**
- ✅ Proyecto: Sistema de gestión de condominio
- ✅ Tipo: API REST backend
- ✅ Stack: 7 tecnologías principales
- ✅ Objetivo: Mostrar implementaciones técnicas

---

### 0:30 - 1:30 | FASTAPI (1 minuto)

**Dice el presentador:**

> "Empecemos con **FastAPI**, el framework web que elegimos para construir la API. FastAPI es moderno, rápido y asíncrono. Lo que más nos gustó es que genera documentación automática - simplemente iniciando el servidor, tenemos Swagger UI disponible en `/docs` donde podemos probar todos los endpoints."

**Muestra (si es posible):**
- Abrir `http://localhost:8000/docs` en navegador
- O mostrar código de `app/main.py`

**Puntos clave a mencionar:**
- ✅ Framework asíncrono de alto rendimiento
- ✅ Validación automática con Pydantic
- ✅ Documentación interactiva (Swagger UI)
- Sistema de inyección de dependencias
- Organización modular con routers

**Código de ejemplo (mostrar si hay tiempo):**
```python
# Ejemplo de endpoint
@router.post("/reservas/")
async def crear_reserva(
    reserva_data: ReservaCreate,  # Validación automática
    db: Session = Depends(get_db),  # Sesión inyectada
    current_user: Usuario = Depends(get_current_active_user)  # Usuario del JWT
):
    # Lógica del endpoint
```

**Transición:**
> "Para interactuar con la base de datos, utilizamos SQLAlchemy..."

---

### 1:30 - 2:30 | SQLALCHEMY (1 minuto)

**Dice el presentador:**

> "**SQLAlchemy** es el ORM que elegimos para trabajar con la base de datos MySQL usando objetos Python en lugar de SQL directo. Esto nos da varias ventajas: primero, protección automática contra SQL injection; segundo, código más legible y mantenible; y tercero, acceso fácil a relaciones entre tablas."

**Muestra (si es posible):**
- Modelo de ejemplo de `app/models/models.py`
- O diagrama de relaciones entre tablas

**Puntos clave a mencionar:**
- ✅ ORM (Object-Relational Mapping)
- ✅ Protección contra SQL injection
- ✅ Modelos Python que representan tablas
- ✅ Pool de conexiones para rendimiento
- ✅ Relaciones entre modelos (foreign keys)

**Código de ejemplo:**
```python
# Modelo Usuario
class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(BigInteger, primary_key=True)
    email = Column(String(254), unique=True)
    # Relaciones
    reservas = relationship("Reserva", back_populates="usuario")
```

**Transición:**
> "Para gestionar los cambios en el esquema de base de datos, implementamos Alembic..."

---

### 2:30 - 3:30 | ALEMBIC (1 minuto)

**Dice el presentador:**

> "**Alembic** es el sistema de migraciones que implementamos para versionar todos los cambios en la base de datos. La migración inicial crea todas las tablas del sistema: condominios, usuarios, viviendas, gastos, reservas, etc. Lo importante es que Alembic se ejecuta automáticamente al iniciar el contenedor Docker, asegurando que la base de datos esté siempre actualizada."

**Puntos clave a mencionar:**
- ✅ Versionado del esquema de BD
- ✅ Migración inicial crea todas las tablas
- ✅ Reversible (podemos deshacer cambios)
- ✅ Integración automática con Docker
- ✅ Sincronización entre entornos

**Comando de ejemplo:**
```bash
alembic upgrade head  # Aplica migraciones
```

**Transición:**
> "Hablando de Docker, utilizamos Docker Compose para orquestar todo el sistema..."

---

### 3:30 - 4:30 | DOCKER COMPOSE (1 minuto)

**Dice el presentador:**

> "**Docker Compose** nos permite ejecutar todo el stack con un solo comando. Definimos dos servicios: MySQL para la base de datos y el backend FastAPI. Lo importante es que Docker Compose gestiona la red interna, los volúmenes persistentes para los datos, y asegura que MySQL esté listo antes de iniciar el backend mediante health checks."

**Muestra (si es posible):**
- Archivo `docker-compose.yml`
- O comando `docker-compose up`

**Puntos clave a mencionar:**
- ✅ Orquestación de contenedores
- ✅ Dos servicios: MySQL y Backend
- ✅ Volúmenes persistentes (datos no se pierden)
- ✅ Health checks (espera a que MySQL esté listo)
- ✅ Entorno reproducible (funciona igual en cualquier máquina)

**Comando de ejemplo:**
```bash
docker-compose up -d  # Inicia todo el sistema
```

**Transición:**
> "Ahora, la parte más importante: la seguridad. Implementamos dos tecnologías clave..."

---

### 4:30 - 6:00 | SEGURIDAD: BCRYPT + JWT (1.5 minutos)

**Dice el presentador:**

> "Para la seguridad, implementamos dos tecnologías complementarias. Primero, **Bcrypt** para hashear contraseñas. Cada contraseña se hashea con un salt aleatorio único antes de guardarse, y el algoritmo es intencionalmente lento para resistir ataques de fuerza bruta. Las contraseñas nunca se almacenan en texto plano."

**Pausa breve, luego continúa:**

> "Segundo, **tokens JWT** para autenticación. Cuando un usuario hace login, el sistema genera un token JWT que contiene el ID del usuario, fecha de emisión y expiración, todo firmado con una clave secreta. El cliente envía este token en cada petición, y FastAPI lo valida automáticamente. Esto nos permite autenticación stateless, sin necesidad de sesiones en el servidor."

**Puntos clave a mencionar:**
- ✅ **Bcrypt**: Hash seguro de contraseñas, salt aleatorio, resistente a fuerza bruta
- ✅ **JWT**: Tokens firmados, stateless, expiración automática, validación automática

**Código de ejemplo (breve):**
```python
# Bcrypt: Hash de contraseña
hashed = get_password_hash("password123")

# JWT: Generar token
token = create_access_token(subject=usuario.id)
```

**Transición:**
> "Estas tecnologías se integran en el sistema de login..."

---

### 6:00 - 7:00 | SISTEMA DE LOGIN (1 minuto)

**Dice el presentador:**

> "El **sistema de login** que implementamos integra todo lo anterior. El flujo es: el cliente envía email y contraseña; el backend busca el usuario con SQLAlchemy; verifica la contraseña con Bcrypt; si es correcta, genera un token JWT; y lo retorna al cliente. En peticiones posteriores, el cliente envía el token en el header Authorization, FastAPI lo valida automáticamente, y el usuario queda autenticado sin necesidad de consultar la base de datos en cada paso."

**Puntos clave a mencionar:**
- ✅ Flujo completo: email/password → validación → token JWT
- ✅ Integración de SQLAlchemy, Bcrypt y JWT
- ✅ Protección automática de endpoints
- ✅ Endpoint de registro también implementado

**Diagrama mental (mencionar):**
```
Login → SQLAlchemy busca usuario → Bcrypt verifica → JWT genera token → Cliente almacena
Petición → JWT valida → Usuario autenticado
```

**Transición:**
> "Ahora, cómo todas estas tecnologías trabajan juntas..."

---

### 7:00 - 8:30 | INTEGRACIÓN DEL STACK (1.5 minutos)

**Dice el presentador:**

> "La integración que logramos es elegante. Docker Compose orquesta los servicios. Alembic crea el esquema usando los modelos de SQLAlchemy. SQLAlchemy permite que FastAPI interactúe con MySQL. FastAPI expone los endpoints y valida tokens JWT. Bcrypt protege las contraseñas almacenadas por SQLAlchemy. Y el sistema de login integra todo el flujo."

**Muestra (si es posible):**
- Diagrama de integración
- O flujo de una petición completa

**Flujo completo (mencionar):**
```
1. Cliente → POST /api/v1/auth/login
2. FastAPI valida datos (Pydantic)
3. SQLAlchemy busca usuario
4. Bcrypt verifica contraseña
5. JWT genera token
6. Cliente usa token en peticiones
7. FastAPI valida JWT automáticamente
8. Endpoint ejecuta con usuario autenticado
```

**Puntos clave:**
- ✅ Cada tecnología cumple un rol específico
- ✅ Integración fluida entre componentes
- ✅ Seguridad en múltiples capas
- ✅ Escalabilidad y mantenibilidad

**Transición:**
> "Para concluir, déjenme mostrar un ejemplo práctico..."

---

### 8:30 - 9:30 | DEMOSTRACIÓN (1 minuto)

**Opciones (elegir una):**

**Opción A - Código:**
- Mostrar endpoint de login completo
- Explicar cómo integramos las dependencias

**Opción B - Swagger UI:**
- Abrir `/docs` en navegador
- Mostrar documentación automática
- Probar un endpoint (si hay tiempo)

**Opción C - Docker:**
- Mostrar `docker-compose.yml`
- Explicar servicios y configuración que definimos

**Opción D - Flujo de autenticación:**
- Mostrar código de `auth.py`
- Explicar flujo paso a paso que implementamos

**Ejemplo de código a mostrar:**
```python
@router.post("/login")
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    # 1. SQLAlchemy busca usuario
    usuario = db.query(Usuario).filter(Usuario.email == payload.email).first()
    
    # 2. Bcrypt verifica contraseña
    if not verify_password(payload.password, usuario.password_hash):
        raise HTTPException(401, "Credenciales inválidas")
    
    # 3. JWT genera token
    return _build_token_response(usuario)
```

**Transición:**
> "En resumen..."

---

### 9:30 - 10:00 | CONCLUSIONES (30 segundos)

**Dice el presentador:**

> "En conclusión, como equipo implementamos un stack tecnológico moderno y robusto. FastAPI proporciona la API REST con validación y documentación automática. SQLAlchemy gestiona la base de datos de forma segura. Alembic versiona los cambios del esquema. Docker Compose orquesta todo el sistema. Bcrypt y JWT garantizan la seguridad. Y el sistema de login integra todo el flujo de autenticación. El resultado es una aplicación segura, escalable y mantenible. ¿Hay alguna pregunta?"

**Puntos finales:**
- ✅ Stack completo y funcional
- ✅ Seguridad implementada correctamente
- ✅ Código organizado y mantenible
- ✅ Listo para preguntas

---

## 🎤 TIPS PARA LA PRESENTACIÓN

### Antes de empezar:
- ✅ Verificar que el servidor esté corriendo (si van a mostrar Swagger)
- ✅ Tener el código abierto en el IDE
- ✅ Tener `docker-compose.yml` visible
- ✅ Preparar diagrama mental del flujo

### Durante la presentación:
- ✅ Mantener contacto visual con el profesor
- ✅ Hablar claro y pausado
- ✅ No leer directamente el guión
- ✅ Usar ejemplos concretos del proyecto
- ✅ Mencionar ventajas técnicas de cada elección que hicimos

### Si les preguntan:
- ✅ **"¿Por qué FastAPI y no Flask/Django?"** → Elegimos FastAPI por ser asíncrono, validación automática, documentación integrada
- ✅ **"¿Por qué JWT y no sesiones?"** → Optamos por JWT porque es stateless, escalable, funciona en múltiples servidores
- ✅ **"¿Por qué Bcrypt y no SHA256?"** → Seleccionamos Bcrypt porque está diseñado para contraseñas, es lento intencionalmente, resistente a fuerza bruta
- ✅ **"¿Por qué Docker Compose?"** → Lo elegimos por reproducibilidad, aislamiento, fácil despliegue
- ✅ **"¿Cómo manejan la seguridad?"** → Implementamos Bcrypt para contraseñas, JWT firmado, validación en cada petición, HTTPS en producción

---

## 📊 DIAGRAMA DE INTEGRACIÓN (Para mostrar si hay tiempo)

```
┌─────────────────────────────────────────────────────────┐
│                    DOCKER COMPOSE                       │
│  ┌──────────────┐              ┌──────────────┐        │
│  │     MySQL    │              │   Backend    │        │
│  │   (Puerto    │◄─────────────│  FastAPI     │        │
│  │    3306)     │              │  (Puerto 8000)│        │
│  └──────────────┘              └──────────────┘        │
└─────────────────────────────────────────────────────────┘
                          │
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
    ┌────────┐      ┌──────────┐      ┌──────────┐
    │Alembic │      │SQLAlchemy│      │  FastAPI │
    │(Migra) │─────▶│  (ORM)   │◄─────│  (API)   │
    └────────┘      └──────────┘      └──────────┘
                          │                 │
                          │                 │
                    ┌─────┴─────┐    ┌──────┴──────┐
                    │           │    │             │
                    ▼           ▼    ▼             ▼
                ┌───────┐  ┌────────┐  ┌──────────┐
                │Bcrypt │  │  JWT   │  │  Login   │
                │(Hash) │  │(Tokens)│  │(Flujo)   │
                └───────┘  └────────┘  └──────────┘
```

---

## 🎯 MENSAJES CLAVE (Repetir si es necesario)

1. **"Stack moderno y robusto"** - Tecnologías actuales y probadas
2. **"Seguridad en múltiples capas"** - Bcrypt + JWT + validaciones
3. **"Código organizado y mantenible"** - Modular, documentado, con buenas prácticas
4. **"Listo para producción"** - Docker, migraciones, manejo de errores
5. **"Integración fluida"** - Todas las tecnologías trabajan juntas

---

## ✅ CHECKLIST PRE-PRESENTACIÓN

- [ ] Servidor corriendo (`docker-compose up` o `uvicorn`)
- [ ] Swagger UI accesible en `http://localhost:8000/docs`
- [ ] Código abierto en IDE
- [ ] `docker-compose.yml` visible
- [ ] Archivos clave identificados:
  - [ ] `app/main.py` (FastAPI)
  - [ ] `app/models/models.py` (SQLAlchemy)
  - [ ] `alembic/versions/...` (Alembic)
  - [ ] `app/core/security.py` (Bcrypt + JWT)
  - [ ] `app/api/v1/routes/auth.py` (Login)
- [ ] Tiempo cronometrado (máximo 10 minutos)
- [ ] Preparado para preguntas técnicas

---

## 📝 NOTAS ADICIONALES

### Si se quedan cortos de tiempo:
- Enfocarse en: FastAPI, Seguridad (Bcrypt+JWT), y Login
- Mencionar brevemente: SQLAlchemy, Alembic, Docker Compose
- Mostrar integración rápida

### Si les sobra tiempo:
- Mostrar más código de ejemplos
- Explicar relaciones entre tablas
- Detallar configuración de Docker
- Mostrar migraciones específicas

### Si hay problemas técnicos:
- Tener screenshots de Swagger UI como backup
- Tener diagramas dibujados previamente
- Explicar conceptualmente sin mostrar código

---

**¡Éxito en su presentación! 🚀**

