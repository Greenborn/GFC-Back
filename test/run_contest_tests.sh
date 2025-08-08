#!/bin/bash

# test/run_contest_tests.sh
# Script para ejecutar tests de listado de concursos

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Script de Tests para Listado de Concursos${NC}"
echo "=============================================="

# Función para mostrar uso
show_usage() {
    echo "Uso: $0 [opción]"
    echo ""
    echo "Opciones:"
    echo "  simple     - Ejecutar solo test simple (sin auth)"
    echo "  full       - Ejecutar test completo con comparación APIs"
    echo "  both       - Ejecutar ambos tests"
    echo "  server     - Iniciar servidor Node.js en background"
    echo "  stop       - Detener servidor Node.js"
    echo "  status     - Verificar estado del servidor"
    echo "  help       - Mostrar esta ayuda"
    echo ""
}

# Función para verificar si el servidor está corriendo
check_server() {
    local port=7779
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0 # Servidor corriendo
    else
        return 1 # Servidor no corriendo
    fi
}

# Función para iniciar servidor
start_server() {
    echo -e "${YELLOW}🔧 Iniciando servidor Node.js...${NC}"
    
    cd ../node_api
    
    # Verificar si ya está corriendo
    if check_server; then
        echo -e "${GREEN}✅ El servidor ya está corriendo en puerto 7779${NC}"
        return 0
    fi
    
    # Iniciar en background
    nohup npm start > server.log 2>&1 &
    SERVER_PID=$!
    echo $SERVER_PID > server.pid
    
    echo -e "${BLUE}📝 PID del servidor: $SERVER_PID${NC}"
    echo -e "${BLUE}📝 Log del servidor: ../node_api/server.log${NC}"
    
    # Esperar a que el servidor arranque
    echo -e "${YELLOW}⏳ Esperando que el servidor arranque...${NC}"
    sleep 3
    
    if check_server; then
        echo -e "${GREEN}✅ Servidor iniciado exitosamente${NC}"
    else
        echo -e "${RED}❌ Error al iniciar el servidor${NC}"
        return 1
    fi
}

# Función para detener servidor
stop_server() {
    echo -e "${YELLOW}🛑 Deteniendo servidor Node.js...${NC}"
    
    if [ -f "../node_api/server.pid" ]; then
        local pid=$(cat ../node_api/server.pid)
        if kill -0 $pid 2>/dev/null; then
            kill $pid
            echo -e "${GREEN}✅ Servidor detenido (PID: $pid)${NC}"
        else
            echo -e "${YELLOW}⚠️ El proceso $pid ya no existe${NC}"
        fi
        rm -f ../node_api/server.pid
    else
        echo -e "${YELLOW}⚠️ No se encontró archivo PID${NC}"
    fi
    
    # Matar cualquier proceso en puerto 7779
    local port_pid=$(lsof -ti:7779 2>/dev/null || true)
    if [ ! -z "$port_pid" ]; then
        kill $port_pid 2>/dev/null || true
        echo -e "${GREEN}✅ Proceso en puerto 7779 terminado${NC}"
    fi
}

# Función para verificar estado
check_status() {
    echo -e "${BLUE}🔍 Verificando estado del servidor...${NC}"
    
    if check_server; then
        echo -e "${GREEN}✅ Servidor Node.js está corriendo en puerto 7779${NC}"
        
        # Intentar hacer un health check
        if command -v curl >/dev/null 2>&1; then
            echo -e "${YELLOW}🏥 Probando health check...${NC}"
            if curl -s http://localhost:7779/health >/dev/null; then
                echo -e "${GREEN}✅ Health check exitoso${NC}"
            else
                echo -e "${RED}❌ Health check falló${NC}"
            fi
        fi
    else
        echo -e "${RED}❌ Servidor Node.js no está corriendo${NC}"
    fi
}

# Función para ejecutar test simple
run_simple_test() {
    echo -e "${BLUE}🧪 Ejecutando test simple...${NC}"
    node test_contest_list_simple.js $PAGE_ARG $PERPAGE_ARG
}

# Función para ejecutar test completo
run_full_test() {
    echo -e "${BLUE}🧪 Ejecutando test completo...${NC}"
    node test_contest_list.js $PAGE_ARG $PERPAGE_ARG
}

# Función principal
main() {
        local action=${1:-help}
        shift
        # Parámetros opcionales de paginación
        PAGE_ARG=""
        PERPAGE_ARG=""
        while [[ $# -gt 0 ]]; do
            case $1 in
                --page)
                    PAGE_ARG="--page $2"
                    shift 2
                    ;;
                --perPage)
                    PERPAGE_ARG="--perPage $2"
                    shift 2
                    ;;
                *)
                    shift
                    ;;
            esac
        done

        case $action in
        "simple")
            echo -e "${BLUE}🎯 Ejecutando test simple${NC}"
            check_status
            run_simple_test
            ;;
        "full")
            echo -e "${BLUE}🎯 Ejecutando test completo${NC}"
            check_status
            run_full_test
            ;;
        "both")
            echo -e "${BLUE}🎯 Ejecutando ambos tests${NC}"
            check_status
            echo -e "\n${YELLOW}--- Test Simple ---${NC}"
            run_simple_test
            echo -e "\n${YELLOW}--- Test Completo ---${NC}"
            run_full_test
            ;;
        "server")
            start_server
            ;;
        "stop")
            stop_server
            ;;
        "status")
            check_status
            ;;
        "help"|"--help"|"-h")
            show_usage
            ;;
        *)
            echo -e "${RED}❌ Opción inválida: $action${NC}"
            show_usage
            exit 1
            ;;
    esac
}

# Verificar que estamos en el directorio correcto
if [ ! -f "test_contest_list_simple.js" ]; then
    echo -e "${RED}❌ Error: Este script debe ejecutarse desde el directorio test${NC}"
    exit 1
fi

# Ejecutar función principal
main "$@"
