"""
Configuración del entorno de Alembic para migraciones de base de datos.

Este módulo configura Alembic para ejecutar migraciones de SQLAlchemy.
Alembic es la herramienta de migración de base de datos que permite:
- Crear nuevas migraciones (alembic revision)
- Aplicar migraciones (alembic upgrade)
- Revertir migraciones (alembic downgrade)

El archivo se ejecuta automáticamente cuando se usan comandos de Alembic.
"""
import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# Asegurar que el paquete app sea importable desde el directorio backend
# Esto permite importar los modelos de SQLAlchemy desde app.models
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

# Importar configuración y modelos de la aplicación
from app.core.config import settings  # noqa: E402
from app.models import Base  # noqa: E402

# Obtener la configuración de Alembic desde alembic.ini
config = context.config

# Configurar logging si existe un archivo de configuración
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Obtener la URL de la base de datos desde variables de entorno o settings
# Permite sobrescribir la URL para migraciones en diferentes entornos
database_url = os.getenv("ALEMBIC_DATABASE_URL", settings.database_url)
config.set_main_option("sqlalchemy.url", database_url)

# Metadata de SQLAlchemy que contiene todas las definiciones de tablas
# Alembic usa esto para generar migraciones automáticas
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Ejecuta migraciones en modo 'offline' (sin conexión activa a la BD).
    
    Este modo genera SQL que puede ejecutarse manualmente.
    Útil cuando no hay conexión directa a la base de datos.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,  # Genera SQL con valores literales
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Ejecuta migraciones en modo 'online' (con conexión activa a la BD).
    
    Este es el modo normal de ejecución. Se conecta a la base de datos
    y ejecuta las migraciones directamente.
    """
    # Crear engine de SQLAlchemy desde la configuración
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,  # No usar pool de conexiones para migraciones
    )

    # Ejecutar migraciones dentro de una transacción
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


# Ejecutar migraciones según el modo detectado por Alembic
# Alembic detecta automáticamente si está en modo offline u online
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

