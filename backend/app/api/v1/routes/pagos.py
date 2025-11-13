from decimal import Decimal
import logging
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.db.deps import get_db
from app.models.models import (
    GastoComun,
    Multa,
    Pago,
    Reserva,
    ResidenteVivienda,
    Usuario,
    Vivienda,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def _to_float(value: Any) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


@router.get("/residente/{usuario_id}")
async def desglose_residente(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    logger.info("DEBUG Pagos: Iniciando desglose_residente para usuario_id=%s", usuario_id)

    if current_user.id != usuario_id and current_user.rol not in {"Administrador", "Conserje", "Super Admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para consultar esta información",
        )

    try:
        rv_list: List[ResidenteVivienda] = (
            db.query(ResidenteVivienda)
            .filter(ResidenteVivienda.usuario_id == usuario_id)
            .all()
        )
        viv_ids = [int(rv.vivienda_id) for rv in rv_list]

        if not viv_ids:
            logger.warning("DEBUG Pagos: No se encontraron viviendas para usuario_id=%s", usuario_id)
            return {
                "viviendas": [],
                "cargo_fijo_uf": 0.0,
                "gastos_comunes": [],
                "multas": [],
                "reservas": [],
            }

        vivienda = (
            db.query(Vivienda)
            .filter(Vivienda.id.in_(viv_ids))
            .order_by(Vivienda.id.asc())
            .first()
        )
        cargo_fijo_uf = _to_float(vivienda.cargo_fijo_uf if vivienda else 0)

        gastos = db.query(GastoComun).filter(GastoComun.vivienda_id.in_(viv_ids)).all()
        gastos_payload = [
            {
                "id": int(gasto.id),
                "vivienda_id": int(gasto.vivienda_id),
                "mes": int(gasto.mes),
                "ano": int(gasto.ano),
                "monto_total": _to_float(gasto.monto_total),
                "estado": gasto.estado,
                "vencimiento": gasto.vencimiento.isoformat() if gasto.vencimiento else None,
            }
            for gasto in gastos
        ]

        multas = db.query(Multa).filter(Multa.vivienda_id.in_(viv_ids)).all()
        multas_payload = [
            {
                "id": int(multa.id),
                "vivienda_id": int(multa.vivienda_id),
                "monto": _to_float(multa.monto),
                "descripcion": multa.descripcion or "",
                "fecha_aplicada": multa.fecha_aplicada.isoformat() if multa.fecha_aplicada else None,
            }
            for multa in multas
        ]

        reservas = db.query(Reserva).filter(Reserva.usuario_id == usuario_id).all()
        reservas_payload = [
            {
                "id": int(reserva.id),
                "monto_pago": _to_float(reserva.monto_pago),
                "estado_pago": reserva.estado_pago,
                "inicio": reserva.fecha_hora_inicio.isoformat() if reserva.fecha_hora_inicio else None,
                "fin": reserva.fecha_hora_fin.isoformat() if reserva.fecha_hora_fin else None,
            }
            for reserva in reservas
        ]

        response_data = {
            "viviendas": viv_ids,
            "cargo_fijo_uf": cargo_fijo_uf,
            "gastos_comunes": gastos_payload,
            "multas": multas_payload,
            "reservas": reservas_payload,
        }

        logger.info("DEBUG Pagos: Desglose completado para usuario_id=%s", usuario_id)
        return response_data

    except Exception as exc:
        logger.error("ERROR Pagos: Exception en desglose_residente: %s", exc, exc_info=True)
        raise


@router.get("/todos")
async def listar_todos_pagos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    """
    Obtiene todos los pagos registrados en el condominio.
    Solo accesible para administradores y conserjes.
    """
    if current_user.rol not in {"Administrador", "Conserje", "Super Admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para listar todos los pagos",
        )

    try:
        pagos = db.query(Pago).order_by(Pago.fecha_pago.desc()).all()
        resultado = []

        for pago in pagos:
            usuario = db.query(Usuario).filter(Usuario.id == pago.usuario_id).first()
            gasto = db.query(GastoComun).filter(GastoComun.id == pago.gasto_comun_id).first()
            vivienda = None
            if gasto:
                vivienda = db.query(Vivienda).filter(Vivienda.id == gasto.vivienda_id).first()

            resultado.append(
                {
                    "id": pago.id,
                    "usuario_id": pago.usuario_id,
                    "usuario_nombre": usuario.nombre_completo if usuario else "Desconocido",
                    "vivienda": vivienda.numero_vivienda if vivienda else "N/A",
                    "monto_pagado": _to_float(pago.monto_pagado),
                    "fecha_pago": pago.fecha_pago.isoformat() if pago.fecha_pago else None,
                    "metodo_pago": pago.metodo_pago or "webpay",
                    "gasto_mes": gasto.mes if gasto else None,
                    "gasto_ano": gasto.ano if gasto else None,
                    "gasto_estado": gasto.estado if gasto else None,
                }
            )

        return {
            "pagos": resultado,
            "total": len(resultado),
            "total_monto": sum(item["monto_pagado"] for item in resultado),
        }

    except Exception as exc:
        logger.error("ERROR Pagos: Exception en listar_todos_pagos: %s", exc, exc_info=True)
        raise
