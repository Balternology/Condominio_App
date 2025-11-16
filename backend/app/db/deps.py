"""
Dependencias de FastAPI para gestión de sesiones de base de datos.

Este módulo proporciona la dependencia get_db() que se usa en todos los endpoints
para obtener una sesión de base de datos. FastAPI maneja automáticamente:
- Crear la sesión antes de ejecutar el endpoint
- Cerrar la sesión después de ejecutar el endpoint (incluso si hay errores)
- Manejar errores de conexión y retornar respuestas HTTP apropiadas
"""
from typing import Generator
from sqlalchemy.exc import OperationalError
from fastapi import HTTPException, status
from .session import SessionLocal


def get_db() -> Generator:
    """
    Dependencia de FastAPI que proporciona una sesión de base de datos.
    
    Esta función es un generador que:
    1. Crea una nueva sesión de base de datos
    2. La entrega (yield) al endpoint que la necesita
    3. Cierra la sesión automáticamente cuando el endpoint termina
    
    Uso en endpoints:
        @router.get("/items")
        async def get_items(db: Session = Depends(get_db)):
            items = db.query(Item).all()
            return items
    
    Returns:
        Generator[Session]: Sesión de base de datos SQLAlchemy
        
    Raises:
        HTTPException 503: Si no se puede conectar a la base de datos
        HTTPException 500: Si hay un error inesperado de base de datos
    """
    # Crear una nueva sesión de base de datos
    db = SessionLocal()
    try:
        # Entregar la sesión al endpoint (yield permite que FastAPI la use)
        yield db
    except HTTPException:
        # Si hay una HTTPException, re-lanzarla sin modificar
        # pero asegurarse de cerrar la sesión
        db.close()
        raise
    except OperationalError as e:
        # Error de conexión a la base de datos (MySQL no está corriendo, etc.)
        db.close()
        import traceback
        print(f"OperationalError en get_db: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Error al conectar con la base de datos. Verifica que MySQL esté corriendo y que la base de datos 'condominio_db' exista."
        )
    except Exception as e:
        # Cualquier otro error inesperado de base de datos
        db.close()
        import traceback
        print(f"Error inesperado en get_db: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}"
        )
    finally:
        # Siempre cerrar la sesión, incluso si hubo errores
        db.close()
