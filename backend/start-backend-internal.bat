@echo off
REM Script interno para iniciar el backend desde start.bat
setlocal EnableDelayedExpansion

set "PROJECT_ROOT=%~dp0.."
set "VENV_DIR=%PROJECT_ROOT%\backend\.venv"

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

set DB_HOST=127.0.0.1
set DB_PORT=3306
set DB_USER=root
set DB_PASSWORD=
set DB_NAME=condominio_db

echo 🚀 Iniciando servidor FastAPI...
echo    Backend: http://localhost:8000
echo    Docs: http://localhost:8000/docs
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

