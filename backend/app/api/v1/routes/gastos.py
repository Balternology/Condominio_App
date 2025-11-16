"""
Rutas para gestión de gastos comunes.

Este módulo proporciona endpoints para:
- Listar gastos comunes de una vivienda específica
- Listar gastos comunes de un usuario (todas sus viviendas)

Los gastos comunes son los gastos mensuales que cada vivienda debe pagar
(mantenimiento, servicios, etc.).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.auth import get_current_active_user
from app.db.deps import get_db
from app.models.models import GastoComun, ResidenteVivienda, Usuario, Vivienda

router = APIRouter()


@router.get("/vivienda/{vivienda_id}")
async def listar_gastos(
    vivienda_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    """
    Obtiene todos los gastos comunes de una vivienda específica.
    
    Permisos:
    - Administradores y conserjes pueden ver cualquier vivienda
    - Residentes solo pueden ver gastos de sus propias viviendas
    
    Args:
        vivienda_id: ID de la vivienda
        db: Sesión de base de datos
        current_user: Usuario autenticado
        
    Returns:
        Lista de gastos comunes ordenados por año y mes (más recientes primero)
        
    Raises:
        HTTPException 403: Si el usuario no tiene permisos
        HTTPException 404: Si la vivienda no existe
    """
    vivienda = db.query(Vivienda).filter(Vivienda.id == vivienda_id).first()
    if not vivienda:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vivienda {vivienda_id} no encontrada",
        )

    if current_user.rol not in {"Administrador", "Conserje", "Super Admin"}:
        es_residente = (
            db.query(ResidenteVivienda)
            .filter(
                ResidenteVivienda.vivienda_id == vivienda_id,
                ResidenteVivienda.usuario_id == current_user.id,
            )
            .first()
        )
        if not es_residente:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para ver los gastos de esta vivienda",
            )

    gastos = (
        db.query(GastoComun)
        .filter(GastoComun.vivienda_id == vivienda_id)
        .order_by(GastoComun.ano.desc(), GastoComun.mes.desc())
        .all()
    )

    return [
        {
            "id": gasto.id,
            "mes": gasto.mes,
            "ano": gasto.ano,
            "monto_total": float(gasto.monto_total),
            "estado": gasto.estado,
            "vencimiento": gasto.vencimiento.isoformat() if gasto.vencimiento else None,
            "created_at": gasto.created_at.isoformat() if gasto.created_at else None,
        }
        for gasto in gastos
    ]


@router.get("/usuario/{usuario_id}")
async def listar_gastos_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    """
    Obtiene todos los gastos comunes de las viviendas del usuario.
    
    Este endpoint agrupa los gastos de todas las viviendas del usuario.
    Útil para residentes que tienen múltiples viviendas.
    
    Permisos:
    - Administradores y conserjes pueden consultar cualquier usuario
    - Residentes solo pueden consultar sus propios gastos
    
    Args:
        usuario_id: ID del usuario
        db: Sesión de base de datos
        current_user: Usuario autenticado
        
    Returns:
        Lista de gastos comunes con información de la vivienda asociada
        
    Raises:
        HTTPException 403: Si el usuario no tiene permisos
    """
    try:
        # Verificar permisos
        if current_user.id != usuario_id and current_user.rol not in {"Administrador", "Conserje", "Super Admin"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para ver los gastos de este usuario",
            )

        # Obtener viviendas del usuario
        viviendas_rel = db.query(ResidenteVivienda).filter(
            ResidenteVivienda.usuario_id == usuario_id
        ).all()
        
        if not viviendas_rel:
            return []

        vivienda_ids = [rv.vivienda_id for rv in viviendas_rel]

        # Obtener todos los gastos de las viviendas del usuario
        gastos = (
            db.query(GastoComun)
            .filter(GastoComun.vivienda_id.in_(vivienda_ids))
            .order_by(GastoComun.ano.desc(), GastoComun.mes.desc())
            .all()
        )

        # Obtener información de viviendas para el contexto
        viviendas_info = {}
        for vivienda in db.query(Vivienda).filter(Vivienda.id.in_(vivienda_ids)).all():
            viviendas_info[vivienda.id] = vivienda.numero_vivienda

        return [
            {
                "id": gasto.id,
                "vivienda_id": gasto.vivienda_id,
                "vivienda_numero": viviendas_info.get(gasto.vivienda_id, "N/A"),
                "mes": gasto.mes,
                "ano": gasto.ano,
                "monto_total": float(gasto.monto_total),
                "estado": gasto.estado,
                "vencimiento": gasto.vencimiento.isoformat() if gasto.vencimiento else None,
                "created_at": gasto.created_at.isoformat() if gasto.created_at else None,
            }
            for gasto in gastos
        ]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener gastos: {str(e)}"
        )
