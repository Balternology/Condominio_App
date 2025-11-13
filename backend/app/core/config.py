"""
Configuración centralizada del sistema.

Este módulo gestiona todas las variables de entorno y configuración del sistema,
incluyendo:
- Configuración de base de datos (MySQL)
- Configuración de seguridad (JWT)
- Configuración de Google Calendar (opcional)

Las variables de entorno se cargan desde un archivo .env en la raíz del proyecto.
"""

import os
from dotenv import load_dotenv
from typing import Optional

# Cargar variables de entorno desde .env (buscar en raíz del proyecto)
# El archivo .env debe estar en la raíz, no en backend/
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
load_dotenv(dotenv_path=env_path)


class Settings:
    """
    Configuración del sistema usando variables de entorno.
    
    Esta clase centraliza toda la configuración del sistema, permitiendo:
    - Valores por defecto para desarrollo local
    - Sobrescritura mediante variables de entorno
    - Configuración flexible para diferentes entornos (dev, prod, docker)
    """

    def __init__(self) -> None:
        # ========================================================================
        # Configuración de Base de Datos (MySQL)
        # ========================================================================
        # Por defecto se conecta a MySQL local en XAMPP
        self.DB_HOST: str = os.getenv("DB_HOST", "127.0.0.1")
        self.DB_PORT: int = int(os.getenv("DB_PORT", 3306))
        self.DB_USER: str = os.getenv("DB_USER", "root")
        self.DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
        self.DB_NAME: str = os.getenv("DB_NAME", "condominio_db")
        self.DB_DRIVER: str = os.getenv("DB_DRIVER", "mysql+pymysql")  # Driver SQLAlchemy para MySQL

        # Permite sobrescribir la URL completa de la base de datos (útil para Docker)
        self._database_url_override: Optional[str] = os.getenv("DATABASE_URL")

        # ========================================================================
        # Configuración de Seguridad / JWT
        # ========================================================================
        # IMPORTANTE: Cambiar JWT_SECRET_KEY en producción
        self.JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "change-this-secret")
        self.JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")  # Algoritmo de firma JWT
        self.JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
            os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 60)  # Tiempo de expiración del token
        )

        # ========================================================================
        # Configuración de Google Calendar (Opcional)
        # ========================================================================
        # Solo necesario si se quiere integrar con Google Calendar para reservas
        self.GOOGLE_CALENDAR_API_KEY: str = os.getenv("GOOGLE_CALENDAR_API_KEY", "")
        self.GOOGLE_CALENDAR_ID_MULTICANCHA: str = os.getenv("GOOGLE_CALENDAR_ID_MULTICANCHA", "")
        self.GOOGLE_CALENDAR_ID_QUINCHO: str = os.getenv("GOOGLE_CALENDAR_ID_QUINCHO", "")
        self.GOOGLE_CALENDAR_ID_SALA_EVENTOS: str = os.getenv("GOOGLE_CALENDAR_ID_SALA_EVENTOS", "")

    @property
    def database_url(self) -> str:
        """Construye la URL de conexión priorizando DATABASE_URL si existe."""
        if self._database_url_override:
            return self._database_url_override

        password_part = f":{self.DB_PASSWORD}" if self.DB_PASSWORD else ""
        return (
            f"{self.DB_DRIVER}://{self.DB_USER}{password_part}@{self.DB_HOST}:{self.DB_PORT}/"
            f"{self.DB_NAME}?charset=utf8mb4"
        )
    
    def test_connection(self) -> bool:
        """Prueba la conexión a la base de datos."""
        try:
            import pymysql
            connection = pymysql.connect(
                host=self.DB_HOST,
                port=self.DB_PORT,
                user=self.DB_USER,
                password=self.DB_PASSWORD,
                database=self.DB_NAME,
                connect_timeout=5
            )
            connection.close()
            return True
        except Exception:
            return False


settings = Settings()

