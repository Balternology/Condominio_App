from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
from pydantic import BaseModel
from datetime import date

from ....db.deps import get_db
from ....models.models import Multa, Vivienda, ResidenteVivienda, Usuario
from ....core.auth import get_current_active_user

router = APIRouter()

class MultaCreate(BaseModel):
    vivienda_id: int
    monto: float
    descripcion: str
    fecha_aplicada: date

def decimal_to_float(value):
    """Convierte Decimal a float"""
    if isinstance(value, Decimal):
        return float(value)
    return value if value is not None else 0.0

@router.get("/residente/{usuario_id}")
async def obtener_multas_residente(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    """
    Obtiene todas las multas de las viviendas del residente.
    
    Args:
        usuario_id: ID del usuario autenticado
        db: Sesión de base de datos
    
    Returns:
        Lista de multas del residente
    """
    try:
        if current_user.id != usuario_id and current_user.rol not in {"Administrador", "Conserje", "Super Admin"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para ver las multas de este usuario",
            )

        # Obtener viviendas del residente
        viviendas = db.query(ResidenteVivienda).filter(
            ResidenteVivienda.usuario_id == usuario_id
        ).all()
        
        if not viviendas:
            return {
                "multas": [],
                "total": 0,
                "total_pendiente": 0
            }
        
        vivienda_ids = [v.vivienda_id for v in viviendas]
        
        # Obtener multas de las viviendas del residente
        multas = db.query(Multa).filter(
            Multa.vivienda_id.in_(vivienda_ids)
        ).order_by(Multa.fecha_aplicada.desc()).all()
        
        # Obtener información de viviendas
        viviendas_dict = {}
        viviendas_db = db.query(Vivienda).filter(
            Vivienda.id.in_(vivienda_ids)
        ).all()
        for v in viviendas_db:
            viviendas_dict[v.id] = v.numero_vivienda
        
        multas_response = []
        total = 0
        for multa in multas:
            monto = decimal_to_float(multa.monto)
            total += monto
            multas_response.append({
                "id": multa.id,
                "vivienda_id": multa.vivienda_id,
                "vivienda": viviendas_dict.get(multa.vivienda_id, "N/A"),
                "monto": monto,
                "descripcion": multa.descripcion or "Sin descripción",
                "fecha_aplicada": multa.fecha_aplicada.isoformat() if multa.fecha_aplicada else None,
                "created_at": multa.created_at.isoformat() if multa.created_at else None
            })
        
        return {
            "multas": multas_response,
            "total": total,
            "total_pendiente": total  # Todas las multas están pendientes por ahora
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener multas: {str(e)}"
        )

@router.get("/todas")
async def obtener_todas_multas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    """
    Obtiene todas las multas del condominio.
    Solo accesible para administradores, conserjes y directiva.
    
    Args:
        db: Sesión de base de datos
    
    Returns:
        Lista de todas las multas
    """
    try:
        if current_user.rol not in {"Administrador", "Conserje", "Directiva", "Super Admin"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para listar todas las multas",
            )

        # Obtener todas las multas
        multas = db.query(Multa).order_by(Multa.fecha_aplicada.desc()).all()
        
        # Obtener información de viviendas
        vivienda_ids = list(set([m.vivienda_id for m in multas]))
        viviendas_dict = {}
        if vivienda_ids:
            viviendas_db = db.query(Vivienda).filter(
                Vivienda.id.in_(vivienda_ids)
            ).all()
            for v in viviendas_db:
                viviendas_dict[v.id] = v.numero_vivienda
        
        multas_response = []
        total = 0
        for multa in multas:
            monto = decimal_to_float(multa.monto)
            total += monto
            multas_response.append({
                "id": multa.id,
                "vivienda_id": multa.vivienda_id,
                "vivienda": viviendas_dict.get(multa.vivienda_id, "N/A"),
                "monto": monto,
                "descripcion": multa.descripcion or "Sin descripción",
                "fecha_aplicada": multa.fecha_aplicada.isoformat() if multa.fecha_aplicada else None,
                "created_at": multa.created_at.isoformat() if multa.created_at else None
            })
        
        return {
            "multas": multas_response,
            "total": total,
            "total_pendiente": total
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener multas: {str(e)}"
        )

@router.post("/")
async def crear_multa(
    multa_data: MultaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    """
    Crea una nueva multa.
    Solo accesible para administradores y conserjes.
    
    Args:
        multa_data: Datos de la multa a crear
        db: Sesión de base de datos
    
    Returns:
        Multa creada
    """
    try:
        if current_user.rol not in {"Administrador", "Conserje", "Super Admin"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para crear multas",
            )

        # Verificar que la vivienda existe
        vivienda = db.query(Vivienda).filter(Vivienda.id == multa_data.vivienda_id).first()
        if not vivienda:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vivienda {multa_data.vivienda_id} no encontrada"
            )
        
        # Crear la multa
        nueva_multa = Multa(
            vivienda_id=multa_data.vivienda_id,
            monto=multa_data.monto,
            descripcion=multa_data.descripcion,
            fecha_aplicada=multa_data.fecha_aplicada
        )
        
        db.add(nueva_multa)
        db.commit()
        db.refresh(nueva_multa)
        
        return {
            "id": nueva_multa.id,
            "vivienda_id": nueva_multa.vivienda_id,
            "vivienda": vivienda.numero_vivienda,
            "monto": decimal_to_float(nueva_multa.monto),
            "descripcion": nueva_multa.descripcion,
            "fecha_aplicada": nueva_multa.fecha_aplicada.isoformat() if nueva_multa.fecha_aplicada else None,
            "created_at": nueva_multa.created_at.isoformat() if nueva_multa.created_at else None,
            "message": "Multa creada correctamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear multa: {str(e)}"
        )

