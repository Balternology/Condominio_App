"""
Configuración de la sesión de base de datos con SQLAlchemy.

Este módulo crea y configura:
- El engine de SQLAlchemy para conectarse a la base de datos
- El sessionmaker para crear sesiones de base de datos
- Configuraciones específicas para MySQL (charset, sql_mode, etc.)

Todas las operaciones de base de datos en la aplicación usan SessionLocal
para crear sesiones que se inyectan mediante dependencias de FastAPI.
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError, DisconnectionError
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

# Obtener la URL de conexión desde la configuración
database_url = settings.database_url

# Configuración base del engine
engine_kwargs = {
    "echo": False,  # No mostrar SQL en logs (cambiar a True para debugging)
}

# Detectar el driver de base de datos (mysql, sqlite, postgresql, etc.)
driver = database_url.split("://", 1)[0].lower()

# Configuraciones específicas según el tipo de base de datos
if driver.startswith("sqlite"):
    # SQLite requiere configuración especial para threading
    engine_kwargs.update({"connect_args": {"check_same_thread": False}})
else:
    # Configuración para bases de datos con pool de conexiones (MySQL, PostgreSQL)
    engine_kwargs.update(
        {
            "pool_pre_ping": True,  # Verificar conexiones antes de usarlas
            "pool_recycle": 3600,  # Reciclar conexiones cada hora
            "pool_size": 5,  # Tamaño del pool de conexiones
            "max_overflow": 10,  # Conexiones adicionales permitidas
        }
    )

    # Configuraciones específicas para MySQL
    if driver.startswith("mysql"):
        engine_kwargs["connect_args"] = {
            "connect_timeout": 10,  # Timeout de conexión en segundos
            "charset": "utf8mb4",  # Charset para soportar emojis y caracteres especiales
            "autocommit": False,  # Usar transacciones explícitas
            "init_command": "SET sql_mode='STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'",
        }

# Crear el engine de SQLAlchemy con todas las configuraciones
engine = create_engine(database_url, **engine_kwargs)

# Event listener que se ejecuta cada vez que se establece una nueva conexión
# Configura MySQL con el modo estricto y charset utf8mb4
@event.listens_for(engine, "connect")
def set_mysql_mode(dbapi_conn, connection_record):
    """
    Configura el modo MySQL y charset al establecer una nueva conexión.
    
    Esto asegura que todas las conexiones usen:
    - Modo SQL estricto (previene datos inválidos)
    - Charset utf8mb4 (soporta emojis y caracteres especiales)
    """
    try:
        with dbapi_conn.cursor() as cursor:
            # Configurar modo SQL estricto
            cursor.execute("SET sql_mode='STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'")
            # Configurar charset utf8mb4
            cursor.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci")
    except Exception as e:
        logger.warning(f"Error al configurar MySQL: {e}")

# Crear el sessionmaker que se usará para crear sesiones de base de datos
# autocommit=False: Requiere commits explícitos
# autoflush=False: No hace flush automático antes de queries
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
