"""
Dependencias de autenticación para FastAPI.

Este módulo proporciona dependencias FastAPI para:
- Extraer y validar tokens JWT de las peticiones
- Obtener el usuario actual desde la base de datos
- Verificar que el usuario esté activo

Todas las rutas protegidas deben usar estas dependencias para asegurar
que solo usuarios autenticados y activos puedan acceder.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_token_subject, InvalidTokenError
from app.db.deps import get_db
from app.models.models import Usuario

# Esquema OAuth2 para extraer el token del header Authorization: Bearer <token>
# Compatible con el estándar OAuth2 Password Bearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Usuario:
    """
    Dependencia FastAPI que obtiene el usuario actual a partir del token JWT.
    
    Esta función:
    1. Extrae el token del header Authorization
    2. Valida y decodifica el token JWT
    3. Obtiene el ID del usuario del claim "sub"
    4. Busca el usuario en la base de datos
    5. Retorna el objeto Usuario
    
    Args:
        token: Token JWT extraído automáticamente del header Authorization
        db: Sesión de base de datos inyectada por FastAPI
        
    Returns:
        Usuario: Objeto Usuario de la base de datos
        
    Raises:
        HTTPException 401: Si el token es inválido, expirado o el usuario no existe
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    try:
        # Extraer el ID del usuario del token JWT
        subject = get_token_subject(token)
    except InvalidTokenError as exc:
        raise credentials_exception from exc

    try:
        # Buscar el usuario en la base de datos usando el ID del token
        user = db.query(Usuario).filter(Usuario.id == int(subject)).first()
    except (ValueError, TypeError, JWTError):
        raise credentials_exception

    if user is None:
        raise credentials_exception

    return user


def get_current_active_user(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """
    Dependencia FastAPI que verifica que el usuario esté activo.
    
    Esta función se usa como dependencia adicional después de get_current_user
    para asegurar que el usuario no solo esté autenticado, sino también activo.
    
    Args:
        current_user: Usuario obtenido de get_current_user
        
    Returns:
        Usuario: Usuario activo
        
    Raises:
        HTTPException 403: Si el usuario está inactivo
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo",
        )
    return current_user

