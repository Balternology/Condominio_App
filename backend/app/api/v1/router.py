"""
Router principal de la API v1.

Este módulo agrupa todos los routers de la API y los organiza en:
- Rutas públicas (auth): No requieren autenticación
- Rutas protegidas: Requieren autenticación JWT válida

Todas las rutas protegidas tienen la dependencia get_current_active_user
aplicada automáticamente, asegurando que solo usuarios autenticados y activos
puedan acceder a ellas.
"""

from fastapi import APIRouter, Depends

from app.core.auth import get_current_active_user
from .routes import auth, gastos, reservas, pagos, dashboard, multas, anuncios, perfil, residentes, morosidad, viviendas

# Router principal de la API
api_router = APIRouter()

# ============================================================================
# RUTAS PÚBLICAS (No requieren autenticación)
# ============================================================================
# Solo las rutas de autenticación (login, register) son públicas
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# ============================================================================
# RUTAS PROTEGIDAS (Requieren autenticación JWT)
# ============================================================================
# Todas estas rutas requieren un token JWT válido en el header Authorization
# La dependencia get_current_active_user se aplica automáticamente a todas
protected_router = APIRouter(dependencies=[Depends(get_current_active_user)])

# Registrar todos los routers protegidos
protected_router.include_router(gastos.router, prefix="/gastos", tags=["gastos"])
protected_router.include_router(reservas.router, prefix="/reservas", tags=["reservas"])
protected_router.include_router(pagos.router, prefix="/pagos", tags=["pagos"])
protected_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
protected_router.include_router(multas.router, prefix="/multas", tags=["multas"])
protected_router.include_router(anuncios.router, prefix="/anuncios", tags=["anuncios"])
protected_router.include_router(perfil.router, prefix="/perfil", tags=["perfil"])
protected_router.include_router(residentes.router, prefix="/residentes", tags=["residentes"])
protected_router.include_router(morosidad.router, prefix="/morosidad", tags=["morosidad"])
protected_router.include_router(viviendas.router, prefix="/viviendas", tags=["viviendas"])

# Incluir el router protegido en el router principal
api_router.include_router(protected_router)
