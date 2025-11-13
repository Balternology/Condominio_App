"""
Funciones de seguridad para el sistema.

Este módulo proporciona funciones para:
- Hash y verificación de contraseñas usando bcrypt
- Creación y decodificación de tokens JWT
- Manejo de errores de tokens inválidos

Todas las contraseñas se almacenan como hash bcrypt, nunca en texto plano.
Los tokens JWT se usan para autenticación en todas las peticiones protegidas.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union

import bcrypt
from jose import JWTError, jwt

from .config import settings


def get_password_hash(password: str) -> str:
    """
    Genera un hash bcrypt para la contraseña proporcionada.
    
    Args:
        password: Contraseña en texto plano
        
    Returns:
        str: Hash bcrypt de la contraseña (almacenable en la base de datos)
        
    Nota:
        Cada vez que se llama, genera un hash diferente (sal aleatorio),
        pero verify_password puede verificar correctamente cualquier hash generado.
    """
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()  # Genera un salt aleatorio
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica una contraseña en texto plano contra un hash almacenado.
    
    Args:
        plain_password: Contraseña en texto plano a verificar
        hashed_password: Hash bcrypt almacenado en la base de datos
        
    Returns:
        bool: True si la contraseña coincide, False en caso contrario
        
    Nota:
        Esta función es segura contra timing attacks y maneja errores de formato.
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except ValueError:
        # Si el hash está corrupto o con formato inválido, retornar False
        return False


def create_access_token(
    subject: Union[str, int],
    expires_delta: Optional[timedelta] = None,
    additional_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Crea un token JWT firmado con los settings del proyecto.
    
    Args:
        subject: ID del usuario (se almacena en el claim "sub")
        expires_delta: Tiempo de expiración del token (por defecto desde settings)
        additional_claims: Claims adicionales a incluir en el token
        
    Returns:
        str: Token JWT codificado como string
        
    Nota:
        El token incluye:
        - "sub": ID del usuario (subject)
        - "iat": Fecha de emisión (issued at)
        - "exp": Fecha de expiración (expiration)
    """
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    now = datetime.now(timezone.utc)
    expire = now + expires_delta

    # Construir el payload del token JWT
    to_encode: Dict[str, Any] = {
        "sub": str(subject),  # Subject: ID del usuario
        "iat": int(now.timestamp()),  # Issued at: momento de creación
        "exp": int(expire.timestamp()),  # Expiration: momento de expiración
    }

    # Agregar claims adicionales si se proporcionan
    if additional_claims:
        to_encode.update(additional_claims)

    # Codificar y firmar el token con la clave secreta
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodifica un token JWT y retorna sus claims.
    
    Args:
        token: Token JWT codificado como string
        
    Returns:
        dict: Claims del token (sub, iat, exp, etc.)
        
    Raises:
        JWTError: Si el token es inválido, expirado o no puede ser decodificado
    """
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )


class InvalidTokenError(Exception):
    """
    Excepción personalizada para tokens inválidos.
    
    Se lanza cuando un token no puede ser procesado correctamente,
    ya sea por expiración, formato inválido o falta de claims requeridos.
    """

    def __init__(self, message: str = "Token inválido"):
        super().__init__(message)
        self.message = message


def get_token_subject(token: str) -> str:
    """
    Obtiene el subject (ID de usuario) del token o lanza InvalidTokenError.
    
    Args:
        token: Token JWT codificado
        
    Returns:
        str: ID del usuario extraído del claim "sub"
        
    Raises:
        InvalidTokenError: Si el token es inválido, expirado o no tiene subject
    """
    try:
        payload = decode_access_token(token)
        subject = payload.get("sub")
        if subject is None:
            raise InvalidTokenError("Token sin subject")
        return str(subject)
    except JWTError as exc:
        raise InvalidTokenError("Token inválido o expirado") from exc

