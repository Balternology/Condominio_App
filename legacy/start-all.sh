#!/bin/bash

# Script para iniciar el sistema completo sin necesidad de npm run dev manual
# Uso: ./start-all.sh

set -e

echo "🚀 Iniciando sistema de gestión de condominios..."
echo ""

# Verificar que Docker está disponible
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker no está instalado"
    exit 1
fi

# Verificar que docker-compose está disponible
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: docker-compose no está instalado"
    exit 1
fi

echo "📦 Iniciando contenedores Docker..."
docker-compose up -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# Verificar salud de los servicios
echo "🔍 Verificando estado de los servicios..."

# Verificar DB
if docker exec condominio_db pg_isready -U condouser -d condominio > /dev/null 2>&1; then
    echo "✅ Base de datos: OK"
else
    echo "❌ Base de datos: FALLO"
    exit 1
fi

# Verificar API
if curl -s http://localhost:8000/healthz > /dev/null 2>&1; then
    echo "✅ API (Puerto 8000): OK"
else
    echo "❌ API (Puerto 8000): FALLO"
    exit 1
fi

# Verificar Frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend (Puerto 3000): OK"
else
    echo "❌ Frontend (Puerto 3000): FALLO"
    exit 1
fi

echo ""
echo "✨ Sistema iniciado correctamente!"
echo ""
echo "URLs disponibles:"
echo "  🌐 Frontend:   http://localhost:3000"
echo "  🔧 API:        http://localhost:8000"
echo "  📊 API Docs:   http://localhost:8000/docs"
echo ""
echo "Para ver logs:"
echo "  docker-compose logs -f app    # Frontend"
echo "  docker-compose logs -f api    # Backend"
echo "  docker-compose logs -f db     # Base de datos"
echo ""
echo "Para detener:"
echo "  docker-compose down"
echo ""
