from typing import Generator
from sqlalchemy.exc import OperationalError
from fastapi import HTTPException, status
from .session import SessionLocal


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    except HTTPException:
        # Re-lanzar HTTPException sin modificar
        db.close()
        raise
    except OperationalError as e:
        db.close()
        import traceback
        print(f"OperationalError en get_db: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Error al conectar con la base de datos. Verifica que MySQL esté corriendo y que la base de datos 'condominio_db' exista."
        )
    except Exception as e:
        db.close()
        import traceback
        print(f"Error inesperado en get_db: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}"
        )
    finally:
        db.close()
