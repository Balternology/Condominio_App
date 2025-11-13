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


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    nombre_completo: str = Field(max_length=200)
    rol: str | None = Field(default=None, max_length=30)


class TokenUser(BaseModel):
    id: int
    email: EmailStr
    nombre_completo: str
    rol: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: TokenUser


ROLE_FRONTEND_MAP = {
    "Administrador": "admin",
    "Conserje": "conserje",
    "Residente": "residente",
    "Directiva": "directiva",
    "Super Admin": "super_admin",
}


def _map_role(role: str) -> str:
    return ROLE_FRONTEND_MAP.get(role, role.lower())


def _build_token_response(usuario: Usuario) -> TokenResponse:
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
    """
    return _authenticate_user(payload.email, payload.password, db)


@router.post(
    "/token",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
async def login_with_form(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """
    Endpoint compatible con OAuth2PasswordBearer (form-data).
    """
    return _authenticate_user(form_data.username, form_data.password, db)


@router.get("/me", response_model=TokenUser)
async def me(current_user: Usuario = Depends(get_current_active_user)) -> TokenUser:
    return TokenUser(
        id=current_user.id,
        email=current_user.email,
        nombre_completo=current_user.nombre_completo,
        rol=_map_role(current_user.rol),
    )
