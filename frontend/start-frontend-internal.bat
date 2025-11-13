@echo off
REM Script interno para iniciar el frontend desde start.bat
setlocal EnableDelayedExpansion

set "PROJECT_ROOT=%~dp0.."

cd /d "%PROJECT_ROOT%\frontend"

set VITE_API_URL=http://localhost:8000/api/v1

echo 🚀 Iniciando servidor de desarrollo Vite...
echo    Frontend: http://localhost:3000
echo.

npm run dev

