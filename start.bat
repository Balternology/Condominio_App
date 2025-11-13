@echo off
setlocal EnableDelayedExpansion

REM Cambiar al directorio del script
cd /d "%~dp0"
set "PROJECT_ROOT=%CD%"

echo.
echo ============================================================
echo   Sistema de Gestion de Condominio - Inicio
echo ============================================================
echo.

REM Verificar Python
where python >nul 2>&1
if errorlevel 1 (
    echo ❌ Python no encontrado. Por favor instala Python 3.11+
    pause
    exit /b 1
)
echo ✅ Python detectado

REM Verificar npm
where npm >nul 2>&1
if errorlevel 1 (
    echo ❌ npm no encontrado. Por favor instala Node.js
    pause
    exit /b 1
)
echo ✅ npm detectado

REM Crear .env si no existe
if not exist "%PROJECT_ROOT%\.env" (
    echo.
    echo 📄 Creando archivo .env...
    (
        echo DB_HOST=127.0.0.1
        echo DB_PORT=3306
        echo DB_USER=root
        echo DB_PASSWORD=
        echo DB_NAME=condominio_db
        echo JWT_SECRET_KEY=change-this-secret-key-in-production
        echo JWT_ACCESS_TOKEN_EXPIRE_MINUTES=120
    ) > "%PROJECT_ROOT%\.env"
    echo ✅ Archivo .env creado
)

REM ============================================================
REM Configurar entorno virtual de Python
REM ============================================================
echo.
echo 🐍 Configurando entorno virtual de Python...
set "VENV_DIR=%PROJECT_ROOT%\backend\.venv"

if not exist "%VENV_DIR%\Scripts\python.exe" (
    echo    Creando entorno virtual...
    python -m venv "%VENV_DIR%"
    if errorlevel 1 (
        echo ❌ Error al crear el entorno virtual
        pause
        exit /b 1
    )
    echo ✅ Entorno virtual creado
) else (
    echo ✅ Entorno virtual ya existe
)

REM Activar entorno virtual
echo    Activando entorno virtual...
call "%VENV_DIR%\Scripts\activate.bat"
if errorlevel 1 (
    echo ❌ Error al activar el entorno virtual
    pause
    exit /b 1
)

REM Actualizar pip
echo    Actualizando pip...
python -m pip install --upgrade pip --quiet
if errorlevel 1 (
    echo ⚠️  Advertencia: No se pudo actualizar pip
) else (
    echo ✅ pip actualizado
)

REM Instalar dependencias del backend
echo.
echo 🛠️  Instalando dependencias del backend...
if not exist "%PROJECT_ROOT%\backend\requirements.txt" (
    echo ❌ No se encontro backend\requirements.txt
    pause
    exit /b 1
)

pip install -r "%PROJECT_ROOT%\backend\requirements.txt"
if errorlevel 1 (
    echo ❌ Error al instalar dependencias del backend
    pause
    exit /b 1
)
echo ✅ Dependencias del backend instaladas

REM Desactivar entorno virtual (se reactivará en la ventana del backend)
call "%VENV_DIR%\Scripts\deactivate.bat"

REM ============================================================
REM Instalar dependencias del frontend
REM ============================================================
echo.
echo 📦 Instalando dependencias del frontend...
set "FRONTEND_DIR=%PROJECT_ROOT%\frontend"

if not exist "%FRONTEND_DIR%\package.json" (
    echo ❌ No se encontro frontend\package.json
    pause
    exit /b 1
)

pushd "%FRONTEND_DIR%"
call npm install
if errorlevel 1 (
    echo ❌ Error al instalar dependencias del frontend
    popd
    pause
    exit /b 1
)
popd
echo ✅ Dependencias del frontend instaladas

REM ============================================================
REM Iniciar Backend
REM ============================================================
echo.
echo 🚀 Iniciando backend FastAPI...

REM Crear script temporal para el backend
set "BACKEND_BAT=%TEMP%\condominio_backend_%RANDOM%.bat"
(
    echo @echo off
    echo title Condominio API - Backend
    echo cd /d "%PROJECT_ROOT%\backend"
    echo call "%VENV_DIR%\Scripts\activate.bat"
    echo set DB_HOST=127.0.0.1
    echo set DB_PORT=3306
    echo set DB_USER=root
    echo set DB_PASSWORD=
    echo set DB_NAME=condominio_db
    echo echo.
    echo echo ============================================================
    echo echo   Backend FastAPI - Sistema de Gestion de Condominio
    echo echo ============================================================
    echo echo.
    echo echo ✅ Entorno virtual activado
    echo echo 🚀 Iniciando servidor...
    echo echo.
    echo echo Backend: http://localhost:8000
    echo echo Docs:    http://localhost:8000/docs
    echo echo.
    echo uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    echo pause
) > "%BACKEND_BAT%"

start "Condominio Backend" cmd /k "%BACKEND_BAT%"

REM Esperar un momento
timeout /t 3 /nobreak >nul

REM ============================================================
REM Iniciar Frontend
REM ============================================================
echo 🚀 Iniciando frontend Vite...

REM Crear script temporal para el frontend
set "FRONTEND_BAT=%TEMP%\condominio_frontend_%RANDOM%.bat"
(
    echo @echo off
    echo title Condominio Frontend
    echo cd /d "%PROJECT_ROOT%\frontend"
    echo set VITE_API_URL=http://localhost:8000/api/v1
    echo echo.
    echo echo ============================================================
    echo echo   Frontend Vite - Sistema de Gestion de Condominio
    echo echo ============================================================
    echo echo.
    echo echo 🚀 Iniciando servidor de desarrollo...
    echo echo.
    echo echo Frontend: http://localhost:3000
    echo echo API URL:  http://localhost:8000/api/v1
    echo echo.
    echo npm run dev
    echo pause
) > "%FRONTEND_BAT%"

start "Condominio Frontend" cmd /k "%FRONTEND_BAT%"

REM ============================================================
REM Mensaje final
REM ============================================================
echo.
echo ============================================================
echo ✅ Proyecto iniciado correctamente
echo ============================================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000/docs
echo.
echo Se abrieron dos ventanas para backend y frontend.
echo Presiona cualquier tecla para cerrar esta ventana...
echo.
pause >nul

exit /b 0

