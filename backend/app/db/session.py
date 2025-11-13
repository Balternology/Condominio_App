from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError, DisconnectionError
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

database_url = settings.database_url
engine_kwargs = {
    "echo": False,
}

driver = database_url.split("://", 1)[0].lower()

if driver.startswith("sqlite"):
    engine_kwargs.update({"connect_args": {"check_same_thread": False}})
else:
    engine_kwargs.update(
        {
            "pool_pre_ping": True,
            "pool_recycle": 3600,
            "pool_size": 5,
            "max_overflow": 10,
        }
    )

    if driver.startswith("mysql"):
        engine_kwargs["connect_args"] = {
            "connect_timeout": 10,
            "charset": "utf8mb4",
            "autocommit": False,
            "init_command": "SET sql_mode='STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'",
        }

# Configurar el engine con opciones dependiendo del motor
engine = create_engine(database_url, **engine_kwargs)

# Event listener para manejar desconexiones
@event.listens_for(engine, "connect")
def set_mysql_mode(dbapi_conn, connection_record):
    """Configura el modo MySQL al conectar."""
    try:
        with dbapi_conn.cursor() as cursor:
            cursor.execute("SET sql_mode='STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'")
            cursor.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci")
    except Exception as e:
        logger.warning(f"Error al configurar MySQL: {e}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
