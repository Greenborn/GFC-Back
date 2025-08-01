#!/bin/bash

# Script de ejemplo para gestión de caché vía servidor interno
# Uso: ./cache_management.sh [comando]

INTERNAL_PORT=${SERVICE_PORT_INTERNAL:-3001}
BASE_URL="http://localhost:${INTERNAL_PORT}"

case "$1" in
    "stats")
        echo "📊 Obteniendo estadísticas de caché..."
        curl -s "${BASE_URL}/cache/stats" | jq '.' 2>/dev/null || curl -s "${BASE_URL}/cache/stats"
        ;;
    "clear")
        echo "🧹 Limpiando todo el caché..."
        curl -s -X DELETE "${BASE_URL}/cache/clear" | jq '.' 2>/dev/null || curl -s -X DELETE "${BASE_URL}/cache/clear"
        ;;
    "cleanup")
        echo "🗑️ Limpiando elementos expirados..."
        curl -s -X POST "${BASE_URL}/cache/cleanup" | jq '.' 2>/dev/null || curl -s -X POST "${BASE_URL}/cache/cleanup"
        ;;
    "contests")
        echo "🏆 Invalidando caché de concursos..."
        curl -s -X DELETE "${BASE_URL}/cache/resource/contests" | jq '.' 2>/dev/null || curl -s -X DELETE "${BASE_URL}/cache/resource/contests"
        ;;
    "categories")
        echo "📂 Invalidando caché de categorías..."
        curl -s -X DELETE "${BASE_URL}/cache/resource/categories" | jq '.' 2>/dev/null || curl -s -X DELETE "${BASE_URL}/cache/resource/categories"
        ;;
    "health")
        echo "❤️ Verificando estado del servidor interno..."
        curl -s "${BASE_URL}/health" | jq '.' 2>/dev/null || curl -s "${BASE_URL}/health"
        ;;
    *)
        echo "🔧 Script de gestión de caché - GFC Node API"
        echo ""
        echo "Uso: $0 [comando]"
        echo ""
        echo "Comandos disponibles:"
        echo "  stats      - Mostrar estadísticas del caché"
        echo "  clear      - Limpiar todo el caché"
        echo "  cleanup    - Limpiar solo elementos expirados"
        echo "  contests   - Invalidar caché de concursos"
        echo "  categories - Invalidar caché de categorías"
        echo "  health     - Verificar estado del servidor interno"
        echo ""
        echo "Ejemplo:"
        echo "  $0 stats"
        echo "  $0 clear"
        echo ""
        echo "Puerto interno: ${INTERNAL_PORT}"
        echo "URL base: ${BASE_URL}"
        ;;
esac
