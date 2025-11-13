"""
Rutas para gestión de reservas de espacios comunes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

from app.core.auth import get_current_active_user
from app.db.deps import get_db
from app.schemas.reservas import (
    ReservaCreate, 
    ReservaResponse, 
    ReservaListResponse,
    EspacioComunResponse,
    DisponibilidadResponse,
    SlotDisponible,
    ErrorResponse
)
from app.models.models import Reserva, EspacioComun, Usuario
from app.services.google_calendar_service import GoogleCalendarManager
from app.core.google_calendar import ESPACIOS_COMUNES

router = APIRouter()

# Intentar inicializar Google Calendar Manager, pero continuar sin él si falla
try:
    calendar_manager = GoogleCalendarManager()
    GOOGLE_CALENDAR_AVAILABLE = True
except Exception as e:
    print(f"Advertencia: Google Calendar no disponible: {str(e)}")
    calendar_manager = None
    GOOGLE_CALENDAR_AVAILABLE = False


def _generar_slots_prueba(fecha_inicio, fecha_fin, duracion_minutos=60):
    """Genera slots de prueba cuando Google Calendar no está disponible"""
    slots = []
    horas = [8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20]
    
    # Generar slots para cada día en el rango
    current_date = fecha_inicio.replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = fecha_fin.replace(hour=0, minute=0, second=0, microsecond=0)
    
    while current_date <= end_date:
        for hora in horas:
            inicio = current_date.replace(hour=hora, minute=0, second=0, microsecond=0)
            fin = inicio + timedelta(minutes=duracion_minutos)
            
            slots.append({
                "inicio": inicio.isoformat(),
                "fin": fin.isoformat(),
                "disponible": True  # En prueba, todos están disponibles
            })
        
        current_date += timedelta(days=1)
    
    return slots

# ============================================================================
# ESPACIOS COMUNES
# ============================================================================

@router.get(
    "/espacios",
    response_model=List[EspacioComunResponse],
    summary="Listar todos los espacios comunes disponibles",
    tags=["Espacios"]
)
async def listar_espacios(
    db: Session = Depends(get_db),
    _current_user: Usuario = Depends(get_current_active_user),
):
    """
    Obtiene la lista de todos los espacios comunes disponibles.
    
    Returns:
        Lista de espacios comunes con su información
    """
    try:
        espacios_db = db.query(EspacioComun).all()
        
        # Si la BD está vacía, retornamos los espacios predefinidos
        if not espacios_db:
            espacios_response = []
            for key, espacio_info in ESPACIOS_COMUNES.items():
                espacios_response.append(
                    EspacioComunResponse(
                        id=hash(key) % 1000,  # ID temporal
                        nombre=espacio_info["nombre"],
                        descripcion=espacio_info["descripcion"],
                        requiere_pago=espacio_info["requiere_pago"],
                        precio=espacio_info.get("precio")
                    )
                )
            return espacios_response
        
        return [
            EspacioComunResponse(
                id=e.id,
                nombre=e.nombre,
                descripcion="",
                requiere_pago=e.requiere_pago,
                precio=0
            )
            for e in espacios_db
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener espacios: {str(e)}"
        )

# ============================================================================
# DISPONIBILIDAD
# ============================================================================

@router.get(
    "/espacios/{espacio}/disponibilidad",
    response_model=DisponibilidadResponse,
    summary="Obtener disponibilidad de un espacio",
    tags=["Disponibilidad"]
)
async def obtener_disponibilidad(
    espacio: str,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    duracion_minutos: int = 60,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    """
    Obtiene los slots disponibles para un espacio en un rango de fechas.
    
    Args:
        espacio: Tipo de espacio (multicancha, quincho, sala_eventos)
        fecha_inicio: Fecha de inicio (default: hoy)
        fecha_fin: Fecha de fin (default: 30 días desde hoy)
        duracion_minutos: Duración deseada en minutos (default: 60)
    
    Returns:
        Lista de slots disponibles
    """
    # Validar que el espacio sea válido
    if espacio.lower() not in ESPACIOS_COMUNES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Espacio '{espacio}' no válido. Use: multicancha, quincho, sala_eventos"
        )
    
    # Valores por defecto y parsing de fechas
    try:
        # Convertir strings a datetime si es necesario
        if fecha_inicio:
            if isinstance(fecha_inicio, str):
                # Parsear como fecha ISO: "2025-10-25" → datetime con hora 00:00:00
                dt = datetime.fromisoformat(fecha_inicio)
                fecha_inicio_dt = dt  # type: ignore
            else:
                fecha_inicio_dt = fecha_inicio  # type: ignore
        else:
            fecha_inicio_dt = datetime.now().replace(hour=0, minute=0, second=0)
        
        if fecha_fin:
            if isinstance(fecha_fin, str):
                # Parsear como fecha ISO y configurar hora final del día
                dt = datetime.fromisoformat(fecha_fin)
                fecha_fin_dt = dt.replace(hour=23, minute=59, second=59)  # type: ignore
            else:
                fecha_fin_dt = fecha_fin  # type: ignore
        else:
            fecha_fin_dt = (fecha_inicio_dt + timedelta(days=30)).replace(hour=23, minute=59, second=59)
        
        fecha_inicio = fecha_inicio_dt  # type: ignore
        fecha_fin = fecha_fin_dt  # type: ignore
    except Exception as date_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al parsear fechas: {str(date_err)}"
        )
    
    try:
        import sys
        print(f"DEBUG: Obteniendo disponibilidad para {espacio}", file=sys.stderr, flush=True)
        
        # Obtener disponibilidad de Google Calendar o generar datos de prueba
        slots = None
        if GOOGLE_CALENDAR_AVAILABLE and calendar_manager:
            try:
                print(f"DEBUG: Intentando usar Google Calendar", file=sys.stderr, flush=True)
                slots = calendar_manager.get_disponibilidad(
                    espacio.lower(),
                    fecha_inicio,
                    fecha_fin,
                    duracion_minutos
                )
                print(f"DEBUG: Google Calendar OK", file=sys.stderr, flush=True)
            except Exception as cal_error:
                print(f"DEBUG: Google Calendar error: {type(cal_error).__name__}", file=sys.stderr, flush=True)
                print(f"DEBUG: Fallback a datos de prueba", file=sys.stderr, flush=True)
                slots = None
        
        # Si Google Calendar fallo o no está disponible, usar datos de prueba
        if slots is None:
            print(f"DEBUG: Usando datos de prueba", file=sys.stderr, flush=True)
            slots = _generar_slots_prueba(fecha_inicio, fecha_fin, duracion_minutos)
            print(f"DEBUG: Se generaron {len(slots)} slots", file=sys.stderr, flush=True)
        
        # Obtener el espacio en la BD para verificar reservas existentes
        espacio_nombre = ESPACIOS_COMUNES.get(espacio, {}).get('nombre', '')
        espacio_db = db.query(EspacioComun).filter(
            EspacioComun.nombre.ilike(f"%{espacio_nombre}%")
        ).first()
        
        print(f"DEBUG: Buscando espacio '{espacio_nombre}', encontrado: {espacio_db.id if espacio_db else 'NO ENCONTRADO'}", file=sys.stderr, flush=True)
        
        # Obtener todas las reservas existentes para este espacio
        reservas_existentes = []
        if espacio_db:
            reservas_existentes = db.query(Reserva).filter(
                Reserva.espacio_comun_id == espacio_db.id,
                Reserva.fecha_hora_inicio < fecha_fin,
                Reserva.fecha_hora_fin > fecha_inicio
            ).all()
            print(f"DEBUG: Encontradas {len(reservas_existentes)} reservas para espacio {espacio_db.id} entre {fecha_inicio} y {fecha_fin}", file=sys.stderr, flush=True)
            for r in reservas_existentes:
                print(f"DEBUG: Reserva ID {r.id}: {r.fecha_hora_inicio} - {r.fecha_hora_fin}", file=sys.stderr, flush=True)
        
        # Marcar slots ocupados
        # Convertir reservas a tuplas de Python SIN timezone para evitar conflictos
        reservas_python = []
        for r in reservas_existentes:
            res_inicio = r.fecha_hora_inicio
            res_fin = r.fecha_hora_fin
            # Remover timezone si existe
            if hasattr(res_inicio, 'tzinfo') and res_inicio.tzinfo is not None:
                res_inicio = res_inicio.replace(tzinfo=None)
            if hasattr(res_fin, 'tzinfo') and res_fin.tzinfo is not None:
                res_fin = res_fin.replace(tzinfo=None)
            reservas_python.append((res_inicio, res_fin))
        
        for slot in slots:
            slot_inicio = datetime.fromisoformat(slot["inicio"])
            slot_fin = datetime.fromisoformat(slot["fin"])
            
            # Remover timezone de los slots también
            if hasattr(slot_inicio, 'tzinfo') and slot_inicio.tzinfo is not None:
                slot_inicio = slot_inicio.replace(tzinfo=None)
            if hasattr(slot_fin, 'tzinfo') and slot_fin.tzinfo is not None:
                slot_fin = slot_fin.replace(tzinfo=None)
            
            # Verificar si este slot se solapa con alguna reserva existente
            tiene_conflicto = False
            for res_inicio, res_fin in reservas_python:
                # Hay solapamiento si NOT (fin <= inicio OR inicio >= fin)
                if not (slot_fin <= res_inicio or slot_inicio >= res_fin):
                    tiene_conflicto = True
                    break
            
            # Marcar como no disponible si hay conflicto
            slot["disponible"] = not tiene_conflicto
        
        # Crear slots disponibles
        slots_disponibles = []
        for s in slots:
            try:
                slot_obj = SlotDisponible(inicio=s["inicio"], fin=s["fin"], disponible=s["disponible"])
                slots_disponibles.append(slot_obj)
            except Exception as slot_err:
                logger.error(f"DEBUG: Error al crear SlotDisponible: {str(slot_err)}, slot: {s}")
                raise
        
        response = DisponibilidadResponse(
            espacio=espacio,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            slots=slots_disponibles
        )
        logger.error(f"DEBUG: Retornando respuesta con {len(slots_disponibles)} slots")
        return response
        
    except ValueError as e:
        logger.error(f"DEBUG: ValueError: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"DEBUG: Exception: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener disponibilidad: {str(e)}"
        )

# ============================================================================
# RESERVAS
# ============================================================================

@router.post(
    "/",
    response_model=ReservaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una nueva reserva",
    tags=["Reservas"]
)
async def crear_reserva(
    reserva_data: ReservaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    """
    Crea una nueva reserva para un espacio común.
    
    Args:
        reserva_data: Datos de la reserva (espacio, fecha/hora)
        db: Sesión de base de datos
        current_user: Usuario autenticado (se usa su ID para la reserva)
    
    Returns:
        Datos de la reserva creada
    """
    import sys
    print(f"DEBUG CREAR: Fecha inicio recibida: {reserva_data.fecha_hora_inicio}", file=sys.stderr, flush=True)
    print(f"DEBUG CREAR: Fecha fin recibida: {reserva_data.fecha_hora_fin}", file=sys.stderr, flush=True)
    
    # Validar que el espacio sea válido
    if reserva_data.espacio.lower() not in ESPACIOS_COMUNES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Espacio '{reserva_data.espacio}' no válido"
        )
    
    # Validar que el usuario exista
    usuario_id = current_user.id
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario {usuario_id} no encontrado"
        )
    
    # Validar fechas
    if reserva_data.fecha_hora_fin <= reserva_data.fecha_hora_inicio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La hora de fin debe ser posterior a la hora de inicio"
        )
    
    # Validar que no haya conflictos con otras reservas
    espacio = reserva_data.espacio.lower()
    
    # Obtener el espacio en la BD - REQUERIDO
    espacio_db = db.query(EspacioComun).filter(
        EspacioComun.nombre.ilike(f"%{ESPACIOS_COMUNES.get(espacio, {}).get('nombre', '')}%")
    ).first()
    
    if not espacio_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Espacio '{espacio}' no encontrado en la base de datos"
        )
    
    # Buscar reservas que se solapen en el mismo espacio
    reserva_conflictiva = db.query(Reserva).filter(
        Reserva.espacio_comun_id == espacio_db.id,
        Reserva.fecha_hora_inicio < reserva_data.fecha_hora_fin,
        Reserva.fecha_hora_fin > reserva_data.fecha_hora_inicio
    ).first()
    
    if reserva_conflictiva:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El espacio ya está reservado en ese horario. Conflicto con reserva ID {reserva_conflictiva.id}"
        )
    
    try:
        # Obtener información del espacio
        espacio_info = ESPACIOS_COMUNES.get(espacio, {})
        espacio_id = espacio_db.id if espacio_db else 1
        monto_pago = espacio_info.get("precio", 0) if espacio_info.get("requiere_pago") else 0
        
        # Crear evento en Google Calendar (si está disponible)
        google_event = {}
        if GOOGLE_CALENDAR_AVAILABLE and calendar_manager:
            try:
                google_event = calendar_manager.crear_evento(
                    espacio,
                    f"Reserva - {espacio_info.get('nombre', espacio)}",
                    f"Reserva del usuario {usuario.nombre_completo} ({usuario.email})",
                    reserva_data.fecha_hora_inicio,
                    reserva_data.fecha_hora_fin,
                    usuario.email
                )
            except Exception as e:
                print(f"Advertencia: No se pudo crear evento en Google Calendar: {str(e)}")
        
        # Crear reserva en la BD
        nueva_reserva = Reserva(
            espacio_comun_id=espacio_id,
            usuario_id=usuario_id,
            fecha_hora_inicio=reserva_data.fecha_hora_inicio,
            fecha_hora_fin=reserva_data.fecha_hora_fin,
            monto_pago=monto_pago,
            estado_pago="pendiente" if monto_pago > 0 else "pagado",
        )
        
        # Guardar ID de Google Event si está disponible
        if "id" in google_event:
            nueva_reserva.google_event_id = google_event["id"]
        
        db.add(nueva_reserva)
        db.commit()
        db.refresh(nueva_reserva)
        
        return ReservaResponse(
            id=nueva_reserva.id,
            espacio_comun_id=nueva_reserva.espacio_comun_id,
            usuario_id=nueva_reserva.usuario_id,
            fecha_hora_inicio=nueva_reserva.fecha_hora_inicio,
            fecha_hora_fin=nueva_reserva.fecha_hora_fin,
            monto_pago=nueva_reserva.monto_pago,
            estado_pago=nueva_reserva.estado_pago,
            created_at=nueva_reserva.created_at,
            google_event_id=getattr(nueva_reserva, 'google_event_id', None)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear reserva: {str(e)}"
        )

@router.get(
    "/usuario/{usuario_id}",
    response_model=List[ReservaListResponse],
    summary="Listar reservas del usuario",
    tags=["Reservas"]
)
async def listar_reservas(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    """
    Obtiene todas las reservas de un usuario.
    
    Args:
        usuario_id: ID del usuario
        db: Sesión de base de datos
        current_user: Usuario autenticado
    
    Returns:
        Lista de reservas del usuario
    """
    try:
        # Verificar permisos: solo puede ver sus propias reservas o ser admin/conserje
        if current_user.id != usuario_id and current_user.rol not in {"Administrador", "Conserje", "Super Admin"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para ver las reservas de este usuario"
            )
        
        # Verificar que el usuario exista
        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Usuario {usuario_id} no encontrado"
            )
        
        # Obtener reservas
        reservas = db.query(Reserva).filter(
            Reserva.usuario_id == usuario_id
        ).order_by(Reserva.fecha_hora_inicio.desc()).all()
        
        resultado = []
        for reserva in reservas:
            espacio_db = db.query(EspacioComun).filter(
                EspacioComun.id == reserva.espacio_comun_id
            ).first()
            
            resultado.append(
                ReservaListResponse(
                    id=reserva.id,
                    espacio=espacio_db.nombre if espacio_db else "Desconocido",
                    fecha_hora_inicio=reserva.fecha_hora_inicio,
                    fecha_hora_fin=reserva.fecha_hora_fin,
                    estado_pago=reserva.estado_pago,
                    monto_pago=float(reserva.monto_pago),
                    usuario_nombre=None
                )
            )
        
        return resultado
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar reservas: {str(e)}"
        )

@router.get(
    "/todas",
    response_model=List[ReservaListResponse],
    summary="Listar todas las reservas",
    tags=["Reservas"]
)
async def listar_todas_reservas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    """
    Obtiene todas las reservas del condominio.
    Solo accesible para administradores y conserjes.
    
    Args:
        db: Sesión de base de datos
        current_user: Usuario autenticado
    
    Returns:
        Lista de todas las reservas
    """
    if current_user.rol not in {"Administrador", "Conserje", "Super Admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver todas las reservas"
        )
    
    try:

        reservas = db.query(Reserva).order_by(Reserva.fecha_hora_inicio.desc()).all()
        
        resultado = []
        for reserva in reservas:
            espacio_db = db.query(EspacioComun).filter(
                EspacioComun.id == reserva.espacio_comun_id
            ).first()
            
            # Obtener información del usuario
            usuario_db = db.query(Usuario).filter(Usuario.id == reserva.usuario_id).first()
            
            reserva_response = ReservaListResponse(
                id=reserva.id,
                espacio=espacio_db.nombre if espacio_db else "Desconocido",
                fecha_hora_inicio=reserva.fecha_hora_inicio,
                fecha_hora_fin=reserva.fecha_hora_fin,
                estado_pago=reserva.estado_pago,
                monto_pago=float(reserva.monto_pago),
                usuario_nombre=usuario_db.nombre_completo if usuario_db else "Desconocido"
            )
            resultado.append(reserva_response)
        
        return resultado
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar reservas: {str(e)}"
        )

@router.delete(
    "/{reserva_id}",
    status_code=status.HTTP_200_OK,
    summary="Cancelar una reserva",
    tags=["Reservas"]
)
async def cancelar_reserva(
    reserva_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    """
    Cancela una reserva existente.
    
    Args:
        reserva_id: ID de la reserva a cancelar
        db: Sesión de base de datos
        current_user: Usuario autenticado
    
    Returns:
        Mensaje de confirmación
    """
    try:
        # Obtener la reserva
        reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
        
        if not reserva:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Reserva {reserva_id} no encontrada"
            )
        
        # Verificar que el usuario sea el propietario de la reserva
        if reserva.usuario_id != current_user.id and current_user.rol not in {"Administrador", "Conserje", "Super Admin"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para cancelar esta reserva"
            )
        
        # Eliminar de Google Calendar si existe el evento
        if hasattr(reserva, 'google_event_id') and reserva.google_event_id and GOOGLE_CALENDAR_AVAILABLE and calendar_manager:
            espacio_db = db.query(EspacioComun).filter(
                EspacioComun.id == reserva.espacio_comun_id
            ).first()
            
            # Encontrar el espacio correcto basado en el nombre
            espacio_key = None
            if espacio_db:
                for key, info in ESPACIOS_COMUNES.items():
                    if info["nombre"].lower() == espacio_db.nombre.lower():
                        espacio_key = key
                        break
            
            if espacio_key:
                try:
                    calendar_manager.eliminar_evento(espacio_key, reserva.google_event_id)
                except Exception as e:
                    # Log del error pero continuamos con la cancelación en la BD
                    print(f"Advertencia: No se pudo eliminar evento de Google Calendar: {str(e)}")
        
        # Eliminar de la BD
        db.delete(reserva)
        db.commit()
        
        return {"message": "Reserva cancelada exitosamente", "reserva_id": reserva_id}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al cancelar reserva: {str(e)}"
        )

