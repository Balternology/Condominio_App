from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List
from decimal import Decimal
from datetime import date, datetime, timedelta

from ....db.deps import get_db
from ....models.models import GastoComun, Vivienda, ResidenteVivienda, Usuario, Pago, Multa
from ....core.auth import get_current_active_user

router = APIRouter()

def decimal_to_float(value):
    """Convierte Decimal a float"""
    if isinstance(value, Decimal):
        return float(value)
    return value if value is not None else 0.0

@router.get("/")
async def obtener_morosidad(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    """
    Obtiene el estado de morosidad del condominio.
    Accesible para administradores, conserjes y directiva.
    
    Returns:
        Lista de viviendas con pagos atrasados
    """
    try:
        if current_user.rol not in {"Administrador", "Conserje", "Directiva", "Super Admin"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para consultar la morosidad",
            )

        hoy = date.today()
        
        # Obtener gastos comunes vencidos y no pagados
        gastos_vencidos = db.query(GastoComun).filter(
            and_(
                GastoComun.vencimiento < hoy,
                GastoComun.estado == 'pendiente'
            )
        ).all()
        
        resultado = []
        viviendas_procesadas = set()
        
        for gasto in gastos_vencidos:
            if gasto.vivienda_id in viviendas_procesadas:
                continue
                
            vivienda = db.query(Vivienda).filter(Vivienda.id == gasto.vivienda_id).first()
            if not vivienda:
                continue
            
            # Obtener residentes de la vivienda
            residentes_rel = db.query(ResidenteVivienda).filter(
                ResidenteVivienda.vivienda_id == gasto.vivienda_id
            ).all()
            
            residentes_info = []
            for rv in residentes_rel:
                residente = db.query(Usuario).filter(Usuario.id == rv.usuario_id).first()
                if residente:
                    residentes_info.append({
                        "id": residente.id,
                        "nombre": residente.nombre_completo,
                        "email": residente.email
                    })
            
            # Calcular total adeudado
            gastos_vivienda = db.query(GastoComun).filter(
                and_(
                    GastoComun.vivienda_id == gasto.vivienda_id,
                    GastoComun.estado == 'pendiente'
                )
            ).all()
            
            multas_vivienda = db.query(Multa).filter(
                Multa.vivienda_id == gasto.vivienda_id
            ).all()
            
            total_gastos = sum(decimal_to_float(g.monto_total) for g in gastos_vivienda)
            total_multas = sum(decimal_to_float(m.monto) for m in multas_vivienda)
            total_adeudado = total_gastos + total_multas
            
            # Calcular días de atraso
            dias_atraso = 0
            if gasto.vencimiento:
                dias_atraso = (hoy - gasto.vencimiento).days
            
            resultado.append({
                "vivienda_id": vivienda.id,
                "numero_vivienda": vivienda.numero_vivienda,
                "residentes": residentes_info,
                "total_adeudado": total_adeudado,
                "gastos_pendientes": len(gastos_vivienda),
                "multas_pendientes": len(multas_vivienda),
                "dias_atraso": dias_atraso,
                "fecha_vencimiento_mas_antigua": gasto.vencimiento.isoformat() if gasto.vencimiento else None
            })
            
            viviendas_procesadas.add(gasto.vivienda_id)
        
        # Ordenar por días de atraso (mayor a menor)
        resultado.sort(key=lambda x: x["dias_atraso"], reverse=True)
        
        total_morosidad = sum(r["total_adeudado"] for r in resultado)
        
        return {
            "viviendas_morosas": resultado,
            "total_viviendas": len(resultado),
            "total_morosidad": total_morosidad
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener morosidad: {str(e)}"
        )

