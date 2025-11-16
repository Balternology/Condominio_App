"""
Servicio para interactuar con Google Calendar API usando Service Account.

Este módulo proporciona una clase GoogleCalendarManager que permite:
- Obtener disponibilidad de espacios comunes desde Google Calendar
- Crear eventos en Google Calendar cuando se hace una reserva
- Eliminar eventos cuando se cancela una reserva
- Calcular slots disponibles considerando eventos existentes

La integración usa Service Account de Google, lo que permite acceso
sin necesidad de autenticación de usuario final.

IMPORTANTE: Requiere configuración previa de credenciales y calendarios.
"""
from googleapiclient.discovery import build
from google.oauth2 import service_account
from datetime import datetime, timedelta
from typing import List, Optional, Dict
import os
from app.core.google_calendar import GOOGLE_SERVICE_ACCOUNT_KEY_PATH, GOOGLE_CALENDAR_IDS

class GoogleCalendarManager:
    """
    Manager para interactuar con Google Calendar API usando Service Account.
    
    Esta clase encapsula todas las operaciones con Google Calendar:
    - Autenticación con Service Account
    - Consulta de eventos existentes
    - Creación de nuevos eventos
    - Eliminación de eventos
    - Cálculo de disponibilidad
    """
    
    def __init__(self):
        """
        Inicializa el manager de Google Calendar.
        
        Carga las credenciales de Service Account y crea el cliente de la API.
        
        Raises:
            ValueError: Si el archivo de credenciales no existe
        """
        # Validar que el archivo de Service Account exista
        if not os.path.exists(GOOGLE_SERVICE_ACCOUNT_KEY_PATH):
            raise ValueError(f"Service Account Key file not found at {GOOGLE_SERVICE_ACCOUNT_KEY_PATH}")
        
        # Configurar credenciales de Service Account
        # Service Account permite acceso sin autenticación de usuario
        SCOPES = ['https://www.googleapis.com/auth/calendar']  # Permisos necesarios
        credentials = service_account.Credentials.from_service_account_file(
            GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
            scopes=SCOPES
        )
        
        # Crear cliente de Google Calendar API v3
        self.service = build('calendar', 'v3', credentials=credentials)
        self.credentials = credentials
    
    def get_disponibilidad(
        self, 
        espacio: str, 
        fecha_inicio: datetime, 
        fecha_fin: datetime,
        duracion_minutos: int = 60
    ) -> List[Dict]:
        """
        Obtiene los espacios de tiempo disponibles para un espacio en un rango de fechas
        
        Args:
            espacio: Tipo de espacio ('multicancha', 'quincho', 'sala_eventos')
            fecha_inicio: Fecha y hora de inicio para buscar disponibilidad
            fecha_fin: Fecha y hora de fin para buscar disponibilidad
            duracion_minutos: Duración deseada en minutos (por defecto 60)
        
        Returns:
            Lista de rangos horarios disponibles
        """
        calendar_id = GOOGLE_CALENDAR_IDS.get(espacio)
        if not calendar_id:
            raise ValueError(f"Espacio '{espacio}' no válido")
        
        try:
            import sys
            print(f"DEBUG GCal: Obteniendo eventos para {espacio}, ID={calendar_id}", file=sys.stderr, flush=True)
            print(f"DEBUG GCal: Rango: {fecha_inicio.isoformat()} a {fecha_fin.isoformat()}", file=sys.stderr, flush=True)
            
            # Asegurar que tenemos timezone info (convertir a UTC si es naive)
            from datetime import timezone
            if fecha_inicio.tzinfo is None:
                fecha_inicio = fecha_inicio.replace(tzinfo=timezone.utc)
            if fecha_fin.tzinfo is None:
                fecha_fin = fecha_fin.replace(tzinfo=timezone.utc)
            
            print(f"DEBUG GCal: Rango con TZ: {fecha_inicio.isoformat()} a {fecha_fin.isoformat()}", file=sys.stderr, flush=True)
            
            # Obtener eventos del calendario
            events_result = self.service.events().list(
                calendarId=calendar_id,
                timeMin=fecha_inicio.isoformat(),
                timeMax=fecha_fin.isoformat(),
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            print(f"DEBUG GCal: Encontrados {len(events)} eventos", file=sys.stderr, flush=True)
            
            # Calcular slots disponibles
            disponibilidad = self._calcular_slots_disponibles(
                fecha_inicio, 
                fecha_fin, 
                events, 
                duracion_minutos
            )
            
            print(f"DEBUG GCal: Retornando {len(disponibilidad)} slots disponibles", file=sys.stderr, flush=True)
            return disponibilidad
            
        except Exception as e:
            import sys
            print(f"DEBUG GCal ERROR: {str(e)}", file=sys.stderr, flush=True)
            raise Exception(f"Error al obtener disponibilidad de Google Calendar: {str(e)}")
    
    def _calcular_slots_disponibles(
        self,
        fecha_inicio: datetime,
        fecha_fin: datetime,
        eventos_ocupados: List,
        duracion_minutos: int
    ) -> List[Dict]:
        """
        Calcula los slots disponibles considerando los eventos ocupados.
        
        Genera slots de tiempo disponibles dentro del rango especificado,
        excluyendo los horarios ocupados por eventos existentes.
        
        Args:
            fecha_inicio: Fecha y hora de inicio del rango
            fecha_fin: Fecha y hora de fin del rango
            eventos_ocupados: Lista de eventos de Google Calendar que ocupan tiempo
            duracion_minutos: Duración deseada de cada slot en minutos
            
        Returns:
            Lista de diccionarios con slots disponibles (inicio, fin, disponible)
        """
        disponibilidad = []
        duracion = timedelta(minutes=duracion_minutos)
        
        # Horario de apertura (8am - 8pm por defecto)
        hora_apertura = 8
        hora_cierre = 20
        
        current = fecha_inicio.replace(hour=hora_apertura, minute=0, second=0)
        
        while current < fecha_fin:
            slot_fin = current + duracion
            
            # Verificar que no supere la hora de cierre
            if slot_fin.hour > hora_cierre:
                current = current.replace(day=current.day + 1, hour=hora_apertura, minute=0)
                continue
            
            # Verificar que no haya conflictos con eventos existentes
            if not self._hay_conflicto(current, slot_fin, eventos_ocupados):
                disponibilidad.append({
                    "inicio": current.isoformat(),
                    "fin": slot_fin.isoformat(),
                    "disponible": True
                })
            
            current += timedelta(minutes=30)  # Incrementar por bloques de 30 min
        
        return disponibilidad
    
    def _hay_conflicto(self, inicio: datetime, fin: datetime, eventos: List) -> bool:
        """
        Verifica si hay conflicto (solapamiento) entre un horario y eventos existentes.
        
        Dos horarios se solapan si:
        - El inicio del slot está dentro del rango de un evento
        - El fin del slot está dentro del rango de un evento
        - El slot contiene completamente un evento
        
        Args:
            inicio: Fecha y hora de inicio del slot a verificar
            fin: Fecha y hora de fin del slot a verificar
            eventos: Lista de eventos de Google Calendar
            
        Returns:
            bool: True si hay conflicto, False si el slot está disponible
        """
        for evento in eventos:
            evento_inicio = datetime.fromisoformat(evento['start'].get('dateTime', evento['start'].get('date')))
            evento_fin = datetime.fromisoformat(evento['end'].get('dateTime', evento['end'].get('date')))
            
            # Hay conflicto si los rangos se solapan
            if not (fin <= evento_inicio or inicio >= evento_fin):
                return True
        
        return False
    
    def crear_evento(
        self,
        espacio: str,
        titulo: str,
        descripcion: str,
        fecha_inicio: datetime,
        fecha_fin: datetime,
        email_asistente: str = None
    ) -> Dict:
        """
        Crea un evento en el calendario de Google
        
        Args:
            espacio: Tipo de espacio ('multicancha', 'quincho', 'sala_eventos')
            titulo: Título del evento
            descripcion: Descripción del evento
            fecha_inicio: Fecha y hora de inicio
            fecha_fin: Fecha y hora de fin
            email_asistente: Email opcional para agregar como asistente
        
        Returns:
            Datos del evento creado
        """
        calendar_id = GOOGLE_CALENDAR_IDS.get(espacio)
        if not calendar_id:
            raise ValueError(f"Espacio '{espacio}' no válido")
        
        try:
            event = {
                'summary': titulo,
                'description': descripcion,
                'start': {
                    'dateTime': fecha_inicio.isoformat(),
                    'timeZone': 'America/Santiago',  # Ajusta según tu zona horaria
                },
                'end': {
                    'dateTime': fecha_fin.isoformat(),
                    'timeZone': 'America/Santiago',
                },
            }
            
            # NOTA: No agregamos attendees porque Service Account no puede enviar invitaciones
            # Si necesitas invitar usuarios, requiere Domain-Wide Delegation
            # if email_asistente:
            #     event['attendees'] = [{'email': email_asistente}]
            
            result = self.service.events().insert(
                calendarId=calendar_id,
                body=event,
                sendUpdates='none'  # No enviar notificaciones
            ).execute()
            
            return result
            
        except Exception as e:
            raise Exception(f"Error al crear evento en Google Calendar: {str(e)}")
    
    def eliminar_evento(self, espacio: str, event_id: str) -> bool:
        """
        Elimina un evento del calendario de Google.
        
        Se usa cuando se cancela una reserva para mantener sincronización
        entre la base de datos y Google Calendar.
        
        Args:
            espacio: Tipo de espacio ('multicancha', 'quincho', 'sala_eventos')
            event_id: ID del evento en Google Calendar (almacenado en reserva.google_event_id)
            
        Returns:
            bool: True si se eliminó correctamente
            
        Raises:
            ValueError: Si el espacio no es válido
            Exception: Si hay error al eliminar el evento
        """
        calendar_id = GOOGLE_CALENDAR_IDS.get(espacio)
        if not calendar_id:
            raise ValueError(f"Espacio '{espacio}' no válido")
        
        try:
            self.service.events().delete(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()
            
            return True
            
        except Exception as e:
            raise Exception(f"Error al eliminar evento de Google Calendar: {str(e)}")
