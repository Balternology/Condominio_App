from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal

from ....db.deps import get_db
from ....models.models import (
    Usuario, Vivienda, GastoComun, Multa, Reserva, Pago, 
    ResidenteVivienda, EspacioComun, Condominio
)
from ....core.auth import get_current_active_user

router = APIRouter()

def decimal_to_float(value):
    """Convierte Decimal a float"""
    if isinstance(value, Decimal):
        return float(value)
    return value if value is not None else 0.0

@router.get("/stats/{usuario_id}")
async def obtener_estadisticas_dashboard(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    """
    Obtiene estadísticas del dashboard según el rol del usuario.
    
    Args:
        usuario_id: ID del usuario autenticado
        db: Sesión de base de datos
    
    Returns:
        Estadísticas personalizadas según el rol
    """
    try:
        # Validar acceso
        if current_user.id != usuario_id and current_user.rol not in {"Administrador", "Super Admin"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para consultar este dashboard",
            )

        if current_user.id == usuario_id:
            usuario = current_user
        else:
            usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
            if not usuario:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Usuario no encontrado"
                )
        
        rol = usuario.rol
        
        # Mapear rol de BD a rol del frontend
        role_mapping = {
            'Administrador': 'admin',
            'Conserje': 'conserje',
            'Residente': 'residente',
            'Directiva': 'directiva',
            'Super Admin': 'super_admin'
        }
        frontend_role = role_mapping.get(rol, rol.lower())
        
        stats = {}
        
        if frontend_role == 'admin':
            # Estadísticas para Administrador
            stats = await _stats_administrador(db)
        elif frontend_role == 'conserje':
            # Estadísticas para Conserje
            stats = await _stats_conserje(db)
        elif frontend_role == 'residente':
            # Estadísticas para Residente
            stats = await _stats_residente(usuario_id, db)
        else:
            # Estadísticas genéricas
            stats = await _stats_generico(db)
        
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas: {str(e)}"
        )

async def _stats_administrador(db: Session) -> Dict[str, Any]:
    """Estadísticas para Administrador"""
    # Total de residentes activos
    residentes_activos = db.query(Usuario).filter(
        Usuario.rol == 'Residente',
        Usuario.is_active == True
    ).count()
    
    # Total de viviendas
    total_viviendas = db.query(Vivienda).count()
    
    # Gastos comunes del mes actual
    mes_actual = datetime.now().month
    ano_actual = datetime.now().year
    gastos_mes = db.query(GastoComun).filter(
        GastoComun.mes == mes_actual,
        GastoComun.ano == ano_actual
    ).all()
    
    total_gastos = sum(decimal_to_float(g.monto_total) for g in gastos_mes)
    
    # Pagos recibidos este mes
    pagos_mes = db.query(Pago).join(GastoComun).filter(
        GastoComun.mes == mes_actual,
        GastoComun.ano == ano_actual
    ).all()
    gastos_pagados = sum(decimal_to_float(p.monto_pagado) for p in pagos_mes)
    
    # Reservas activas (futuras)
    reservas_activas = db.query(Reserva).filter(
        Reserva.fecha_hora_inicio >= datetime.now()
    ).count()
    
    # Morosidad (gastos vencidos no pagados)
    gastos_vencidos = db.query(GastoComun).filter(
        GastoComun.vencimiento < datetime.now().date(),
        GastoComun.estado == 'pendiente'
    ).count()
    
    total_vencido = db.query(func.sum(GastoComun.monto_total)).filter(
        GastoComun.vencimiento < datetime.now().date(),
        GastoComun.estado == 'pendiente'
    ).scalar() or 0
    
    morosidad_porcentaje = 0
    if total_gastos > 0:
        morosidad_porcentaje = (decimal_to_float(total_vencido) / total_gastos) * 100
    
    return {
        "stats": [
            {
                "title": "Residentes Activos",
                "value": str(residentes_activos),
                "change": f"{total_viviendas} viviendas",
                "icon": "users",
                "color": "blue"
            },
            {
                "title": "Pagos del Mes",
                "value": f"${gastos_pagados:,.0f}",
                "change": f"${total_gastos:,.0f} total",
                "icon": "money",
                "color": "green"
            },
            {
                "title": "Reservas Activas",
                "value": str(reservas_activas),
                "change": "Próximas",
                "icon": "calendar",
                "color": "purple"
            },
            {
                "title": "Morosidad",
                "value": f"{morosidad_porcentaje:.1f}%",
                "change": f"{gastos_vencidos} viviendas",
                "icon": "warning",
                "color": "red"
            }
        ],
        "chart_data": await _chart_data_administrador(db),
        "recent_activity": await _actividad_reciente_admin(db)
    }

async def _stats_conserje(db: Session) -> Dict[str, Any]:
    """Estadísticas para Conserje"""
    # Pagos registrados hoy
    hoy = datetime.now().date()
    pagos_hoy = db.query(Pago).filter(
        func.date(Pago.fecha_pago) == hoy
    ).count()
    
    total_pagos_hoy = db.query(func.sum(Pago.monto_pagado)).filter(
        func.date(Pago.fecha_pago) == hoy
    ).scalar() or 0
    
    # Reservas de hoy
    reservas_hoy = db.query(Reserva).filter(
        func.date(Reserva.fecha_hora_inicio) == hoy
    ).count()
    
    # Multas pendientes
    multas_pendientes = db.query(Multa).count()
    
    # Residentes totales
    residentes_total = db.query(Usuario).filter(
        Usuario.rol == 'Residente',
        Usuario.is_active == True
    ).count()
    
    return {
        "stats": [
            {
                "title": "Pagos Hoy",
                "value": f"${decimal_to_float(total_pagos_hoy):,.0f}",
                "change": f"{pagos_hoy} registrados",
                "icon": "money",
                "color": "green"
            },
            {
                "title": "Reservas Hoy",
                "value": str(reservas_hoy),
                "change": "Para hoy",
                "icon": "calendar",
                "color": "purple"
            },
            {
                "title": "Residentes",
                "value": str(residentes_total),
                "change": "Activos",
                "icon": "users",
                "color": "blue"
            },
            {
                "title": "Multas",
                "value": str(multas_pendientes),
                "change": "Pendientes",
                "icon": "warning",
                "color": "red"
            }
        ],
        "recent_activity": await _actividad_reciente_conserje(db)
    }

async def _stats_residente(usuario_id: int, db: Session) -> Dict[str, Any]:
    """Estadísticas para Residente"""
    # Obtener viviendas del residente
    viviendas = db.query(ResidenteVivienda).filter(
        ResidenteVivienda.usuario_id == usuario_id
    ).all()
    vivienda_ids = [v.vivienda_id for v in viviendas]
    
    if not vivienda_ids:
        return {
            "stats": [
                {"title": "Mi Saldo", "value": "$0", "change": "Sin vivienda", "icon": "money", "color": "gray"},
                {"title": "Mis Reservas", "value": "0", "change": "Sin reservas", "icon": "calendar", "color": "gray"},
                {"title": "Multas", "value": "0", "change": "Al día", "icon": "warning", "color": "green"},
                {"title": "Gastos Pendientes", "value": "$0", "change": "Al día", "icon": "money", "color": "green"}
            ],
            "recent_activity": []
        }
    
    # Gastos comunes pendientes
    gastos_pendientes = db.query(GastoComun).filter(
        GastoComun.vivienda_id.in_(vivienda_ids),
        GastoComun.estado == 'pendiente'
    ).all()
    
    total_pendiente = sum(decimal_to_float(g.monto_total) for g in gastos_pendientes)
    
    # Pagos realizados este mes
    mes_actual = datetime.now().month
    ano_actual = datetime.now().year
    pagos_mes = db.query(Pago).join(GastoComun).filter(
        Pago.usuario_id == usuario_id,
        GastoComun.mes == mes_actual,
        GastoComun.ano == ano_actual
    ).all()
    total_pagado_mes = sum(decimal_to_float(p.monto_pagado) for p in pagos_mes)
    
    # Saldo (gastos pendientes - pagos realizados)
    saldo = total_pendiente - total_pagado_mes
    
    # Mis reservas activas
    reservas_activas = db.query(Reserva).filter(
        Reserva.usuario_id == usuario_id,
        Reserva.fecha_hora_inicio >= datetime.now()
    ).count()
    
    # Multas pendientes
    multas_pendientes = db.query(Multa).filter(
        Multa.vivienda_id.in_(vivienda_ids)
    ).count()
    
    return {
        "stats": [
            {
                "title": "Mi Saldo",
                "value": f"${saldo:,.0f}",
                "change": "Pendiente" if saldo > 0 else "Al día",
                "icon": "money",
                "color": "green" if saldo <= 0 else "red"
            },
            {
                "title": "Mis Reservas",
                "value": str(reservas_activas),
                "change": "Activas",
                "icon": "calendar",
                "color": "purple"
            },
            {
                "title": "Multas",
                "value": str(multas_pendientes),
                "change": "Pendientes" if multas_pendientes > 0 else "Al día",
                "icon": "warning",
                "color": "green" if multas_pendientes == 0 else "red"
            },
            {
                "title": "Gastos Pendientes",
                "value": f"${total_pendiente:,.0f}",
                "change": f"{len(gastos_pendientes)} facturas",
                "icon": "money",
                "color": "orange"
            }
        ],
        "recent_activity": await _actividad_reciente_residente(usuario_id, db)
    }

async def _stats_generico(db: Session) -> Dict[str, Any]:
    """Estadísticas genéricas"""
    return {
        "stats": [
            {"title": "Dashboard", "value": "0", "change": "Sin datos", "icon": "dashboard", "color": "gray"}
        ],
        "recent_activity": []
    }

async def _chart_data_administrador(db: Session) -> Dict[str, Any]:
    """Datos para gráfico de administrador"""
    # Últimos 6 meses
    meses = []
    ingresos = []
    gastos = []
    
    for i in range(5, -1, -1):
        fecha = datetime.now() - timedelta(days=30 * i)
        mes = fecha.month
        ano = fecha.year
        
        meses.append(fecha.strftime('%b'))
        
        # Gastos comunes del mes
        gastos_mes = db.query(func.sum(GastoComun.monto_total)).filter(
            GastoComun.mes == mes,
            GastoComun.ano == ano
        ).scalar() or 0
        
        # Pagos recibidos del mes
        pagos_mes = db.query(func.sum(Pago.monto_pagado)).join(GastoComun).filter(
            GastoComun.mes == mes,
            GastoComun.ano == ano
        ).scalar() or 0
        
        ingresos.append(decimal_to_float(pagos_mes))
        gastos.append(decimal_to_float(gastos_mes))
    
    return {
        "labels": meses,
        "datasets": [
            {
                "label": "Ingresos",
                "data": ingresos,
                "backgroundColor": "rgba(59, 130, 246, 0.8)",
                "borderColor": "rgba(59, 130, 246, 1)"
            },
            {
                "label": "Gastos",
                "data": gastos,
                "backgroundColor": "rgba(239, 68, 68, 0.8)",
                "borderColor": "rgba(239, 68, 68, 1)"
            }
        ]
    }

async def _actividad_reciente_admin(db: Session) -> list:
    """Actividad reciente para administrador"""
    actividades = []
    
    # Últimos pagos
    pagos = db.query(Pago).join(Usuario).join(GastoComun).order_by(
        Pago.fecha_pago.desc()
    ).limit(5).all()
    
    for pago in pagos:
        usuario = db.query(Usuario).filter(Usuario.id == pago.usuario_id).first()
        vivienda = db.query(Vivienda).join(GastoComun).filter(
            GastoComun.id == pago.gasto_comun_id
        ).first()
        
        tiempo = _calcular_tiempo_relativo(pago.fecha_pago)
        actividades.append({
            "action": "Pago registrado",
            "user": f"{usuario.nombre_completo} - {vivienda.numero_vivienda if vivienda else 'N/A'}",
            "time": tiempo,
            "type": "payment",
            "timestamp": pago.fecha_pago.timestamp() if pago.fecha_pago else 0
        })
    
    # Últimas reservas
    reservas = db.query(Reserva).join(Usuario).order_by(
        Reserva.created_at.desc()
    ).limit(3).all()
    
    for reserva in reservas:
        usuario = db.query(Usuario).filter(Usuario.id == reserva.usuario_id).first()
        espacio = db.query(EspacioComun).filter(
            EspacioComun.id == reserva.espacio_comun_id
        ).first()
        
        tiempo = _calcular_tiempo_relativo(reserva.created_at)
        actividades.append({
            "action": f"Reserva de {espacio.nombre if espacio else 'espacio'}",
            "user": f"{usuario.nombre_completo}",
            "time": tiempo,
            "type": "reservation",
            "timestamp": reserva.created_at.timestamp() if reserva.created_at else 0
        })
    
    # Ordenar por timestamp (más reciente primero)
    actividades.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
    # Remover timestamp antes de retornar
    for act in actividades:
        act.pop("timestamp", None)
    return actividades[:5]

async def _actividad_reciente_conserje(db: Session) -> list:
    """Actividad reciente para conserje"""
    return await _actividad_reciente_admin(db)

async def _actividad_reciente_residente(usuario_id: int, db: Session) -> list:
    """Actividad reciente para residente"""
    actividades = []
    
    # Mis pagos
    pagos = db.query(Pago).filter(
        Pago.usuario_id == usuario_id
    ).order_by(Pago.fecha_pago.desc()).limit(3).all()
    
    for pago in pagos:
        tiempo = _calcular_tiempo_relativo(pago.fecha_pago)
        actividades.append({
            "action": "Pago realizado",
            "user": f"${decimal_to_float(pago.monto_pagado):,.0f}",
            "time": tiempo,
            "type": "payment",
            "timestamp": pago.fecha_pago.timestamp() if pago.fecha_pago else 0
        })
    
    # Mis reservas
    reservas = db.query(Reserva).filter(
        Reserva.usuario_id == usuario_id
    ).order_by(Reserva.created_at.desc()).limit(2).all()
    
    for reserva in reservas:
        espacio = db.query(EspacioComun).filter(
            EspacioComun.id == reserva.espacio_comun_id
        ).first()
        
        tiempo = _calcular_tiempo_relativo(reserva.created_at)
        actividades.append({
            "action": f"Reserva de {espacio.nombre if espacio else 'espacio'}",
            "user": reserva.fecha_hora_inicio.strftime('%d/%m/%Y %H:%M') if reserva.fecha_hora_inicio else 'N/A',
            "time": tiempo,
            "type": "reservation",
            "timestamp": reserva.created_at.timestamp() if reserva.created_at else 0
        })
    
    # Ordenar por timestamp (más reciente primero)
    actividades.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
    # Remover timestamp antes de retornar
    for act in actividades:
        act.pop("timestamp", None)
    return actividades[:5]

def _calcular_tiempo_relativo(fecha: datetime) -> str:
    """Calcula tiempo relativo (hace X horas, hace X días)"""
    ahora = datetime.now()
    
    # Remover timezone si existe para comparar
    if fecha.tzinfo:
        fecha = fecha.replace(tzinfo=None)
    if ahora.tzinfo:
        ahora = ahora.replace(tzinfo=None)
    
    diferencia = ahora - fecha
    
    if diferencia.days > 0:
        return f"Hace {diferencia.days} día{'s' if diferencia.days > 1 else ''}"
    elif diferencia.seconds >= 3600:
        horas = diferencia.seconds // 3600
        return f"Hace {horas} hora{'s' if horas > 1 else ''}"
    elif diferencia.seconds >= 60:
        minutos = diferencia.seconds // 60
        return f"Hace {minutos} minuto{'s' if minutos > 1 else ''}"
    else:
        return "Hace unos momentos"

def _tiempo_a_segundos(tiempo_str: str) -> int:
    """Convierte string de tiempo relativo a segundos para ordenar (menor = más reciente)"""
    ahora = datetime.now()
    try:
        if "día" in tiempo_str:
            dias = int(tiempo_str.split()[1])
            return (ahora - timedelta(days=dias)).timestamp()
        elif "hora" in tiempo_str:
            horas = int(tiempo_str.split()[1])
            return (ahora - timedelta(hours=horas)).timestamp()
        elif "minuto" in tiempo_str:
            minutos = int(tiempo_str.split()[1])
            return (ahora - timedelta(minutes=minutos)).timestamp()
        else:
            return ahora.timestamp()
    except:
        return ahora.timestamp()

