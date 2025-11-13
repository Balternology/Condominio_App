from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ....db.deps import get_db
from ....models.models import Vivienda, Condominio, Usuario
from ....core.auth import get_current_active_user

router = APIRouter()

@router.get("/")
async def listar_viviendas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    """
    Obtiene la lista de todas las viviendas.
    Accesible para administradores y conserjes.
    
    Returns:
        Lista de viviendas con información básica
    """
    try:
        if current_user.rol not in {"Administrador", "Conserje", "Super Admin"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para listar viviendas",
            )

        viviendas = db.query(Vivienda).order_by(Vivienda.numero_vivienda.asc()).all()
        
        resultado = []
        for vivienda in viviendas:
            condominio = db.query(Condominio).filter(Condominio.id == vivienda.condominio_id).first()
            resultado.append({
                "id": vivienda.id,
                "numero_vivienda": vivienda.numero_vivienda,
                "condominio_id": vivienda.condominio_id,
                "condominio": condominio.nombre if condominio else "N/A"
            })
        
        return {
            "viviendas": resultado,
            "total": len(resultado)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener viviendas: {str(e)}"
        )

