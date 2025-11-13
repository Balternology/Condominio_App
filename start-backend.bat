@echo off
REM Script simple para iniciar solo el backend
setlocal EnableDelayedExpansion
pushd "%~dp0"

set "PROJECT_ROOT=%CD%"
set "VENV_DIR=%PROJECT_ROOT%\backend\.venv"

echo.
echo ============================================================
echo   Iniciando Backend - Sistema de Gestion de Condominio
echo ============================================================
echo.

cd /d "%PROJECT_ROOT%\backend"

if not exist "%VENV_DIR%\Scripts\activate.bat" (
    echo ❌ Entorno virtual no encontrado.
    echo    Ejecuta start.bat primero para crear el entorno virtual.
    pause
    exit /b 1
)

call "%VENV_DIR%\Scripts\activate.bat"
echo ✅ Entorno virtual activado

echo.
echo 🚀 Iniciando backend FastAPI...
echo    Backend estara disponible en: http://localhost:8000
echo    Documentacion API: http://localhost:8000/docs
echo.

set DB_HOST=127.0.0.1
set DB_PORT=3306
set DB_USER=root
set DB_PASSWORD=
set DB_NAME=condominio_db

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

popd

