from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal

from ....db.deps import get_db
from ....models.models import Usuario, ResidenteVivienda, Vivienda, Condominio
from ....core.auth import get_current_active_user

router = APIRouter()

def decimal_to_float(value):
    """Convierte Decimal a float"""
    if isinstance(value, Decimal):
        return float(value)
    return value if value is not None else 0.0

@router.get("/")
async def listar_residentes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    """
    Obtiene la lista de todos los residentes activos con información básica.
    Accesible para administradores y conserjes.
    
    Returns:
        Lista de residentes con información básica
    """
    try:
        if current_user.rol not in {"Administrador", "Conserje", "Super Admin"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para listar residentes",
            )

        # Obtener todos los residentes activos
        residentes = db.query(Usuario).filter(
            Usuario.rol == 'Residente',
            Usuario.is_active == True
        ).all()
        
        resultado = []
        for residente in residentes:
            # Obtener viviendas del residente
            viviendas_rel = db.query(ResidenteVivienda).filter(
                ResidenteVivienda.usuario_id == residente.id
            ).all()
            
            viviendas_info = []
            for rv in viviendas_rel:
                vivienda = db.query(Vivienda).filter(Vivienda.id == rv.vivienda_id).first()
                if vivienda:
                    condominio = db.query(Condominio).filter(Condominio.id == vivienda.condominio_id).first()
                    viviendas_info.append({
                        "id": vivienda.id,
                        "numero": vivienda.numero_vivienda,
                        "condominio": condominio.nombre if condominio else "N/A"
                    })
            
            resultado.append({
                "id": residente.id,
                "nombre_completo": residente.nombre_completo,
                "email": residente.email,
                "viviendas": viviendas_info,
                "last_login": residente.last_login.isoformat() if residente.last_login else None,
                "created_at": residente.created_at.isoformat() if residente.created_at else None
            })
        
        return {
            "residentes": resultado,
            "total": len(resultado)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener residentes: {str(e)}"
        )

