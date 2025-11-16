# Resumen Técnico - Sistema de Gestión de Condominio

## Tecnologías Implementadas

### FastAPI

FastAPI es el framework web asíncrono utilizado para construir la API REST del sistema. Proporciona validación automática de datos con Pydantic, documentación interactiva en Swagger UI (`/docs`), y un sistema de inyección de dependencias que facilita la gestión de sesiones de base de datos y autenticación. En el proyecto, organiza los endpoints en routers modulares (auth, gastos, reservas, etc.) y protege las rutas mediante dependencias que validan tokens JWT automáticamente. Su naturaleza asíncrona permite manejar múltiples peticiones concurrentes eficientemente, mejorando el rendimiento del sistema.

### Alembic

Alembic es la herramienta de migraciones de base de datos que gestiona los cambios en el esquema de forma versionada y controlada. En el proyecto, la migración inicial (`20241112_000001_initial_schema.py`) crea todas las tablas del sistema (condominios, usuarios, viviendas, gastos, reservas, etc.) con sus constraints, índices y relaciones. Alembic se integra con Docker Compose ejecutándose automáticamente al iniciar el contenedor (`alembic upgrade head`), asegurando que la base de datos esté siempre actualizada. Permite versionar cambios, revertir migraciones si es necesario, y mantener sincronizado el esquema entre diferentes entornos (desarrollo, producción).

### Docker Compose

Docker Compose orquesta los servicios del sistema definiendo dos contenedores principales: MySQL 8.0 para la base de datos y el backend FastAPI. El archivo `docker-compose.yml` configura la red interna de Docker, volúmenes persistentes para los datos, health checks para asegurar que MySQL esté listo antes de iniciar el backend, y variables de entorno para la configuración. Esta solución permite ejecutar todo el stack con un solo comando (`docker-compose up`), garantizando un entorno reproducible y aislado que funciona igual en cualquier máquina, facilitando tanto el desarrollo como el despliegue en producción.

### Login

El sistema de login implementa autenticación mediante email y contraseña, validando las credenciales contra la base de datos usando SQLAlchemy y verificando la contraseña con bcrypt. El flujo completo incluye: validación de datos de entrada con Pydantic, búsqueda del usuario por email, verificación de contraseña hasheada, comprobación de que el usuario esté activo, actualización del último login, y generación de un token JWT que se retorna al cliente. El sistema también incluye un endpoint de registro que crea nuevos usuarios con contraseñas hasheadas y retorna un token inmediatamente. Todos los endpoints protegidos requieren un token JWT válido en el header `Authorization: Bearer <token>`, validado automáticamente por FastAPI mediante dependencias.

### Bcrypt

Bcrypt es el algoritmo de hash utilizado para almacenar contraseñas de forma segura. Cada contraseña se hashea con un salt aleatorio único antes de guardarse en la base de datos, lo que significa que incluso contraseñas idénticas generan hashes diferentes. El algoritmo es intencionalmente lento (cost factor 12 = 4,096 iteraciones, ~300ms por hash) para resistir ataques de fuerza bruta. En el proyecto, `get_password_hash()` se usa durante el registro para hashear contraseñas antes de almacenarlas, y `verify_password()` se usa durante el login para comparar la contraseña ingresada con el hash almacenado. Esta implementación garantiza que las contraseñas nunca se almacenen en texto plano, cumpliendo con las mejores prácticas de seguridad.

### Tokens JWT

Los tokens JWT (JSON Web Tokens) proporcionan autenticación stateless, permitiendo que el cliente demuestre su identidad sin necesidad de sesiones en el servidor. Cada token contiene el ID del usuario (`sub`), fecha de emisión (`iat`) y expiración (`exp`), todo firmado con una clave secreta (`JWT_SECRET_KEY`). Al hacer login, el sistema genera un token JWT que el cliente almacena y envía en el header `Authorization: Bearer <token>` en cada petición. FastAPI valida automáticamente el token, verifica su firma y expiración, extrae el ID del usuario, y lo busca en la base de datos para inyectarlo como dependencia en los endpoints. Los tokens expiran después de un tiempo configurable (por defecto 60 minutos), forzando re-autenticación periódica y mejorando la seguridad del sistema.

### SQLAlchemy

SQLAlchemy es el ORM (Object-Relational Mapping) que permite interactuar con la base de datos MySQL usando objetos Python en lugar de SQL directo. Los modelos definidos en `app/models/models.py` (Usuario, Vivienda, Condominio, Reserva, etc.) representan las tablas de la base de datos con sus columnas, tipos, constraints y relaciones. El engine de SQLAlchemy gestiona un pool de conexiones que reutiliza conexiones existentes, mejorando el rendimiento. Las sesiones se inyectan automáticamente en los endpoints mediante dependencias de FastAPI, y las transacciones se manejan explícitamente con `commit()` y `rollback()`. SQLAlchemy protege automáticamente contra SQL injection, permite acceso fácil a datos relacionados mediante `relationship()`, y se integra perfectamente con Alembic para las migraciones del esquema de base de datos.

---

## Integración del Stack

Estas tecnologías trabajan juntas de forma integrada: **Docker Compose** orquesta los servicios, **Alembic** crea y mantiene el esquema de base de datos, **SQLAlchemy** permite interactuar con MySQL desde Python, **FastAPI** expone la API REST, **Bcrypt** protege las contraseñas, **JWT** autentica las peticiones, y el **sistema de Login** integra todo el flujo de autenticación. El resultado es una aplicación segura, escalable y mantenible que facilita tanto el desarrollo como el despliegue en producción.

