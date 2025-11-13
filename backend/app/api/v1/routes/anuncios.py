from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List
from datetime import date

from ....db.deps import get_db
from ....core.auth import get_current_active_user
from ....models.models import Anuncio, Usuario, Condominio

router = APIRouter()

@router.get("/condominio/{condominio_id}")
async def obtener_anuncios_activos(
    condominio_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtiene todos los anuncios activos del condominio.
    
    Args:
        condominio_id: ID del condominio
        db: Sesión de base de datos
    
    Returns:
        Lista de anuncios activos
    """
    try:
        hoy = date.today()
        
        # Obtener anuncios activos que no hayan expirado
        anuncios = db.query(Anuncio).filter(
            Anuncio.condominio_id == condominio_id,
            Anuncio.is_active == True,
            or_(
                Anuncio.fecha_expiracion.is_(None),
                Anuncio.fecha_expiracion >= hoy
            )
        ).order_by(
            Anuncio.fecha_publicacion.desc(),
            Anuncio.created_at.desc()
        ).all()
        
        # Obtener información de autores
        autor_ids = list(set([a.autor_id for a in anuncios]))
        autores = {}
        if autor_ids:
            usuarios = db.query(Usuario).filter(Usuario.id.in_(autor_ids)).all()
            for u in usuarios:
                autores[u.id] = u.nombre_completo
        
        anuncios_response = []
        for anuncio in anuncios:
            anuncios_response.append({
                "id": anuncio.id,
                "titulo": anuncio.titulo,
                "contenido": anuncio.contenido,
                "tipo": anuncio.tipo,
                "autor": autores.get(anuncio.autor_id, "Desconocido"),
                "fecha_publicacion": anuncio.fecha_publicacion.isoformat() if anuncio.fecha_publicacion else None,
                "fecha_expiracion": anuncio.fecha_expiracion.isoformat() if anuncio.fecha_expiracion else None,
                "created_at": anuncio.created_at.isoformat() if anuncio.created_at else None
            })
        
        return {
            "anuncios": anuncios_response,
            "total": len(anuncios_response)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener anuncios: {str(e)}"
        )

@router.get("/activos")
async def obtener_anuncios_activos_general(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtiene todos los anuncios activos del primer condominio (para MVP).
    
    Args:
        db: Sesión de base de datos
    
    Returns:
        Lista de anuncios activos
    """
    try:
        # Obtener el primer condominio (MVP)
        condominio = db.query(Condominio).first()
        if not condominio:
            return {
                "anuncios": [],
                "total": 0
            }
        
        return await obtener_anuncios_activos(condominio.id, db)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener anuncios: {str(e)}"
        )

