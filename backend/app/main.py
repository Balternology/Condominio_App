"""
Aplicación principal FastAPI del Sistema de Gestión de Condominio.

Este módulo configura la aplicación FastAPI, incluyendo:
- Configuración de CORS para desarrollo local
- Endpoints de salud y raíz
- Integración de todos los routers de la API

Documentación automática disponible en:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1.router import api_router

# Configuración de la aplicación FastAPI con metadatos para documentación
app = FastAPI(
    title="Sistema de Gestión de Condominio API",
    description="API REST para la gestión de condominios con autenticación JWT",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",  # ReDoc
    openapi_url="/openapi.json"  # Esquema OpenAPI
)

# Configuración de CORS para permitir peticiones desde el frontend
# En producción, restringir allow_origins a los dominios permitidos
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,  # Permite enviar cookies y headers de autenticación
    allow_methods=["*"],  # Permite todos los métodos HTTP (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"]  # Permite todos los headers (incluyendo Authorization)
)

@app.get("/healthz")
async def healthz():
    """
    Endpoint de salud para verificar el estado del servidor y la conexión a la base de datos.
    
    Útil para:
    - Monitoreo de salud del servicio
    - Verificación de conectividad con la base de datos
    - Diagnóstico de problemas de conexión
    
    Returns:
        dict: Estado del servicio y conexión a la base de datos
    """
    from .core.config import settings
    from .db.session import engine
    from sqlalchemy import text
    
    db_status = "unknown"
    try:
        # Intentar conectar a la base de datos ejecutando una query simple
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {str(e)[:50]}"
    
    return {
        "status": "ok",
        "service": "Condominio API",
        "database": db_status,
        "db_config": {
            "host": settings.DB_HOST,
            "port": settings.DB_PORT,
            "database": settings.DB_NAME
        }
    }

@app.get("/")
async def root():
    """
    Endpoint raíz con información básica de la API.
    
    Returns:
        dict: Información de la API y enlaces a documentación
    """
    return {
        "message": "Sistema de Gestión de Condominio API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/healthz"
    }

# Incluir todos los routers de la API bajo el prefijo /api/v1
# Esto agrupa todos los endpoints bajo una ruta común
app.include_router(api_router, prefix="/api/v1")
