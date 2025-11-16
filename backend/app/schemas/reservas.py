"""
Modelos Pydantic para validación de datos en endpoints de reservas.

Este módulo define los esquemas de validación y serialización para:
- Crear nuevas reservas
- Listar reservas existentes
- Obtener disponibilidad de espacios
- Respuestas de la API

Los modelos Pydantic validan automáticamente los datos de entrada
y proporcionan documentación automática en Swagger UI.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class EspacioComunResponse(BaseModel):
    """Response model para espacios comunes"""
    id: int
    nombre: str
    descripcion: str
    requiere_pago: bool
    precio: Optional[float] = None

class SlotDisponible(BaseModel):
    """Model para slots disponibles"""
    inicio: datetime
    fin: datetime
    disponible: bool

class DisponibilidadResponse(BaseModel):
    """Response de disponibilidad"""
    espacio: str
    fecha_inicio: datetime
    fecha_fin: datetime
    slots: List[SlotDisponible]

class ReservaCreate(BaseModel):
    """Model para crear una reserva"""
    espacio: str = Field(..., description="Tipo de espacio: multicancha, quincho, sala_eventos")
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "espacio": "multicancha",
                "fecha_hora_inicio": "2025-10-25T18:00:00",
                "fecha_hora_fin": "2025-10-25T19:00:00"
            }
        }

class ReservaResponse(BaseModel):
    """Response model para una reserva"""
    id: int
    espacio_comun_id: int
    usuario_id: int
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    monto_pago: float
    estado_pago: str
    created_at: datetime
    google_event_id: Optional[str] = None

class ReservaListResponse(BaseModel):
    """Response para listar reservas"""
    id: int
    espacio: str
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    estado_pago: str
    monto_pago: float
    usuario_nombre: Optional[str] = None

class ErrorResponse(BaseModel):
    """Model para respuestas de error"""
    detail: str
    code: Optional[str] = None
