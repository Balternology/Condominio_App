"""
Configuración e integración con Google Calendar API.

Este módulo proporciona:
- Configuración de credenciales de Google Calendar (Service Account)
- IDs de calendarios para cada espacio común
- Información de espacios comunes disponibles
- Validación de configuración

La integración con Google Calendar permite sincronizar reservas de espacios comunes
con calendarios de Google, facilitando la gestión y visualización de disponibilidad.

IMPORTANTE: Para usar esta funcionalidad, se requiere:
1. Un archivo de credenciales de Service Account de Google
2. IDs de calendarios de Google para cada espacio común
3. Configurar las variables de entorno correspondientes
"""
import os
from dotenv import load_dotenv

# Cargar variables de entorno desde archivo .env
load_dotenv()

# ========================================================================
# CONFIGURACIÓN DE GOOGLE CALENDAR
# ========================================================================

# Ruta al archivo de credenciales de Service Account de Google
# Este archivo se obtiene desde Google Cloud Console
GOOGLE_SERVICE_ACCOUNT_KEY_PATH = os.getenv("GOOGLE_SERVICE_ACCOUNT_KEY_PATH", "google-service-account-key.json")

# IDs de calendarios de Google para cada espacio común
# Cada espacio tiene su propio calendario en Google Calendar
GOOGLE_CALENDAR_IDS = {
    "multicancha": os.getenv("GOOGLE_CALENDAR_ID_MULTICANCHA"),
    "quincho": os.getenv("GOOGLE_CALENDAR_ID_QUINCHO"),
    "sala_eventos": os.getenv("GOOGLE_CALENDAR_ID_SALA_EVENTOS"),
}


def validate_google_calendar_config():
    """
    Valida que la configuración de Google Calendar sea válida.
    
    Verifica:
    1. Que exista el archivo de credenciales de Service Account
    2. Que todos los IDs de calendarios estén configurados
    
    Returns:
        bool: True si la configuración es válida
        
    Raises:
        ValueError: Si falta algún archivo o configuración
    """
    if not os.path.exists(GOOGLE_SERVICE_ACCOUNT_KEY_PATH):
        raise ValueError(f"Service Account Key file not found at {GOOGLE_SERVICE_ACCOUNT_KEY_PATH}")
    
    for espacio, calendar_id in GOOGLE_CALENDAR_IDS.items():
        if not calendar_id:
            raise ValueError(f"GOOGLE_CALENDAR_ID_{espacio.upper()} no está configurada")
    
    return True

# ========================================================================
# INFORMACIÓN DE ESPACIOS COMUNES
# ========================================================================

# Información predefinida sobre los espacios comunes disponibles
# Esta información se usa cuando la base de datos está vacía o como fallback
ESPACIOS_COMUNES = {
    "multicancha": {
        "nombre": "Multicancha",
        "descripcion": "Cancha multiusos para fútbol, vóleibol, etc.",
        "requiere_pago": True,
        "precio": 50000  # Precio en pesos chilenos
    },
    "quincho": {
        "nombre": "Quincho",
        "descripcion": "Área de asados y reuniones",
        "requiere_pago": True,
        "precio": 75000  # Precio en pesos chilenos
    },
    "sala_eventos": {
        "nombre": "Sala de Eventos",
        "descripcion": "Sala para reuniones y eventos",
        "requiere_pago": True,
        "precio": 100000  # Precio en pesos chilenos
    }
}
