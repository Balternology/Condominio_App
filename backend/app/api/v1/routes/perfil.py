from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from ....db.deps import get_db
from ....models.models import Usuario, ResidenteVivienda, Vivienda
from ....core.auth import get_current_active_user

router = APIRouter()

class PerfilUpdate(BaseModel):
    nombre_completo: Optional[str] = None
    email: Optional[EmailStr] = None

class NotificacionesUpdate(BaseModel):
    notificaciones_email: Optional[bool] = None
    notificaciones_push: Optional[bool] = None

@router.get("/{usuario_id}")
async def obtener_perfil(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    """
    Obtiene el perfil del usuario.
    
    Args:
        usuario_id: ID del usuario
        db: Sesión de base de datos
    
    Returns:
        Información del perfil del usuario
    """
    try:
        if current_user.id != usuario_id and current_user.rol not in {"Administrador", "Super Admin"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para ver este perfil",
            )

        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        # Obtener viviendas del usuario
        viviendas = db.query(ResidenteVivienda).filter(
            ResidenteVivienda.usuario_id == usuario_id
        ).all()
        
        viviendas_info = []
        for rv in viviendas:
            vivienda = db.query(Vivienda).filter(Vivienda.id == rv.vivienda_id).first()
            if vivienda:
                viviendas_info.append({
                    "id": vivienda.id,
                    "numero": vivienda.numero_vivienda
                })
        
        return {
            "id": usuario.id,
            "email": usuario.email,
            "nombre_completo": usuario.nombre_completo,
            "rol": usuario.rol,
            "is_active": usuario.is_active,
            "notificaciones_email": usuario.notificaciones_email,
            "notificaciones_push": usuario.notificaciones_push,
            "viviendas": viviendas_info,
            "last_login": usuario.last_login.isoformat() if usuario.last_login else None,
            "created_at": usuario.created_at.isoformat() if usuario.created_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener perfil: {str(e)}"
        )

@router.put("/{usuario_id}")
async def actualizar_perfil(
    usuario_id: int,
    perfil_data: PerfilUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    """
    Actualiza el perfil del usuario.
    
    Args:
        usuario_id: ID del usuario
        perfil_data: Datos a actualizar
        db: Sesión de base de datos
    
    Returns:
        Perfil actualizado
    """
    try:
        if current_user.id != usuario_id and current_user.rol not in {"Administrador", "Super Admin"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para editar este perfil",
            )

        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        # Actualizar campos si se proporcionan
        if perfil_data.nombre_completo is not None:
            usuario.nombre_completo = perfil_data.nombre_completo
        
        if perfil_data.email is not None:
            # Verificar que el email no esté en uso por otro usuario
            email_existente = db.query(Usuario).filter(
                Usuario.email == perfil_data.email,
                Usuario.id != usuario_id
            ).first()
            if email_existente:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El email ya está en uso por otro usuario"
                )
            usuario.email = perfil_data.email
        
        db.commit()
        db.refresh(usuario)
        
        return {
            "id": usuario.id,
            "email": usuario.email,
            "nombre_completo": usuario.nombre_completo,
            "rol": usuario.rol,
            "message": "Perfil actualizado correctamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar perfil: {str(e)}"
        )

@router.put("/{usuario_id}/notificaciones")
async def actualizar_notificaciones(
    usuario_id: int,
    notificaciones_data: NotificacionesUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    """
    Actualiza las preferencias de notificaciones del usuario.
    
    Args:
        usuario_id: ID del usuario
        notificaciones_data: Datos de notificaciones a actualizar
        db: Sesión de base de datos
    
    Returns:
        Preferencias de notificaciones actualizadas
    """
    try:
        if current_user.id != usuario_id and current_user.rol not in {"Administrador", "Super Admin"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para modificar estas preferencias",
            )

        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        # Actualizar campos si se proporcionan
        if notificaciones_data.notificaciones_email is not None:
            usuario.notificaciones_email = notificaciones_data.notificaciones_email
        
        if notificaciones_data.notificaciones_push is not None:
            usuario.notificaciones_push = notificaciones_data.notificaciones_push
        
        db.commit()
        db.refresh(usuario)
        
        return {
            "id": usuario.id,
            "notificaciones_email": usuario.notificaciones_email,
            "notificaciones_push": usuario.notificaciones_push,
            "message": "Preferencias de notificaciones actualizadas correctamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar notificaciones: {str(e)}"
        )

