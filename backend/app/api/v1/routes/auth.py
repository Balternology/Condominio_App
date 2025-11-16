"""
Rutas de autenticación y registro de usuarios.

Este módulo proporciona endpoints para:
- Registro de nuevos usuarios
- Login con email y contraseña
- Obtención del perfil del usuario autenticado
- Generación de tokens JWT para autenticación

Todas las contraseñas se almacenan como hash bcrypt, nunca en texto plano.
Los tokens JWT se usan para autenticación en todas las peticiones protegidas.
"""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.deps import get_db
from app.models.models import Usuario

router = APIRouter()


# ========================================================================
# MODELOS PYDANTIC PARA VALIDACIÓN DE DATOS
# ========================================================================

class LoginRequest(BaseModel):
    """Modelo para solicitud de login con email y contraseña"""
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class RegisterRequest(BaseModel):
    """Modelo para registro de nuevo usuario"""
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    nombre_completo: str = Field(max_length=200)
    rol: str | None = Field(default=None, max_length=30)  # Si no se especifica, será "Residente"


class TokenUser(BaseModel):
    """Modelo para información del usuario en la respuesta del token"""
    id: int
    email: EmailStr
    nombre_completo: str
    rol: str  # Rol mapeado para el frontend


class TokenResponse(BaseModel):
    """Modelo para respuesta de autenticación con token JWT"""
    access_token: str  # Token JWT para usar en headers Authorization
    token_type: str = "bearer"  # Tipo de token (OAuth2 estándar)
    expires_in: int  # Tiempo de expiración en segundos
    user: TokenUser  # Información del usuario autenticado


# Mapeo de roles de base de datos a roles del frontend
ROLE_FRONTEND_MAP = {
    "Administrador": "admin",
    "Conserje": "conserje",
    "Residente": "residente",
    "Directiva": "directiva",
    "Super Admin": "super_admin",
}


def _map_role(role: str) -> str:
    """
    Mapea el rol de la base de datos al formato usado en el frontend.
    
    Args:
        role: Rol de la base de datos
        
    Returns:
        Rol mapeado para el frontend
    """
    return ROLE_FRONTEND_MAP.get(role, role.lower())


def _build_token_response(usuario: Usuario) -> TokenResponse:
    """
    Construye la respuesta con token JWT y datos del usuario.
    
    Args:
        usuario: Objeto Usuario de la base de datos
        
    Returns:
        TokenResponse con token JWT y datos del usuario
    """
    expires_delta = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(subject=usuario.id, expires_delta=expires_delta)
    return TokenResponse(
        access_token=access_token,
        expires_in=int(expires_delta.total_seconds()),
        user=TokenUser(
            id=usuario.id,
            email=usuario.email,
            nombre_completo=usuario.nombre_completo,
            rol=_map_role(usuario.rol),
        ),
    )


def _authenticate_user(email: str, password: str, db: Session) -> TokenResponse:
    """
    Autentica un usuario con email y contraseña.
    
    Verifica:
    1. Que el usuario exista
    2. Que la contraseña sea correcta
    3. Que el usuario esté activo
    
    Args:
        email: Email del usuario
        password: Contraseña en texto plano
        db: Sesión de base de datos
        
    Returns:
        TokenResponse con token JWT y datos del usuario
        
    Raises:
        HTTPException 401: Si las credenciales son inválidas
        HTTPException 403: Si el usuario está inactivo
        HTTPException 503: Si hay error de conexión a la base de datos
    """
    try:
        usuario = db.query(Usuario).filter(Usuario.email == email).first()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Error al conectar con la base de datos. Verifica que el servicio esté disponible.",
        ) from exc

    if not usuario or not usuario.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )

    if not usuario.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo",
        )

    if not verify_password(password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )

    try:
        usuario.last_login = datetime.utcnow()
        db.add(usuario)
        db.commit()
    except Exception:
        db.rollback()

    return _build_token_response(usuario)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    Registra un nuevo usuario en el sistema y entrega un token JWT.
    
    El usuario se crea con:
    - Contraseña hasheada con bcrypt
    - Rol "Residente" por defecto (si no se especifica)
    - Estado activo
    - Notificaciones habilitadas por defecto
    
    Args:
        payload: Datos del nuevo usuario
        db: Sesión de base de datos
        
    Returns:
        TokenResponse con token JWT y datos del usuario creado
        
    Raises:
        HTTPException 400: Si el email ya está registrado o hay error de validación
    """
    existing = db.query(Usuario).filter(Usuario.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado",
        )

    hashed_password = get_password_hash(payload.password)
    nuevo_usuario = Usuario(
        email=payload.email,
        password_hash=hashed_password,
        nombre_completo=payload.nombre_completo,
        rol=payload.rol or "Residente",
        is_active=True,
        notificaciones_email=True,
        notificaciones_push=True,
    )

    try:
        db.add(nuevo_usuario)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo crear el usuario. Verifique los datos.",
        ) from exc

    db.refresh(nuevo_usuario)
    return _build_token_response(nuevo_usuario)


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Autentica un usuario con email y contraseña (JSON) y devuelve un token JWT.
    
    Este endpoint acepta datos JSON en el body de la petición.
    Para compatibilidad con OAuth2 (form-data), usar /token.
    
    Args:
        payload: Email y contraseña del usuario
        db: Sesión de base de datos
        
    Returns:
        TokenResponse con token JWT y datos del usuario
        
    Raises:
        HTTPException 401: Si las credenciales son inválidas
        HTTPException 403: Si el usuario está inactivo
    """
    return _authenticate_user(payload.email, payload.password, db)


@router.post(
    "/token",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,  # No aparece en la documentación Swagger
)
async def login_with_form(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """
    Endpoint compatible con OAuth2PasswordBearer (form-data).
    
    Este endpoint acepta datos en formato form-data (application/x-www-form-urlencoded),
    que es el estándar OAuth2. Útil para herramientas como Swagger UI.
    
    Args:
        form_data: Datos del formulario OAuth2 (username=email, password=contraseña)
        db: Sesión de base de datos
        
    Returns:
        TokenResponse con token JWT y datos del usuario
        
    Note:
        Este endpoint no aparece en la documentación Swagger (include_in_schema=False)
        porque el frontend usa /login con JSON.
    """
    return _authenticate_user(form_data.username, form_data.password, db)


@router.get("/me", response_model=TokenUser)
async def me(current_user: Usuario = Depends(get_current_active_user)) -> TokenUser:
    """
    Obtiene la información del usuario autenticado.
    
    Este endpoint requiere un token JWT válido en el header Authorization.
    Útil para verificar que el token sigue siendo válido y obtener datos actualizados.
    
    Args:
        current_user: Usuario autenticado (inyectado automáticamente por FastAPI)
        
    Returns:
        TokenUser con datos del usuario autenticado
        
    Raises:
        HTTPException 401: Si el token es inválido o expirado
        HTTPException 403: Si el usuario está inactivo
    """
    return TokenUser(
        id=current_user.id,
        email=current_user.email,
        nombre_completo=current_user.nombre_completo,
        rol=_map_role(current_user.rol),
    )
