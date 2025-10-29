#!/bin/bash

# Script para probar el endpoint de judging
# Convierte la estructura con los caracteres UTF-8 correctos

# IMPORTANTE: Este archivo debe guardarse con encoding UTF-8

echo "════════════════════════════════════════════════════════════════"
echo "TEST: Endpoint /api/results/judging"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Variables
API_URL="https://gfc.api2.greenborn.com.ar/api/results/judging"
TOKEN="4af744e088478d9c628396e951f3e59a110acfdbab0e496c405895af5027ad9f"

# Crear el archivo JSON temporal con la estructura completa
cat > /tmp/judging_data.json << 'EOF'
{
  "estructura": {
    "BALCARCE 2025": {
      "Primera": {
        "Sub Sección": {
          "3er PREMIO": {
            "__files": ["1585_2025_52_Sub Sección_11865.jpg"]
          },
          "ACEPTADA": {
            "__files": [
              "4165_2025_52_Sub Sección_12100.jpg",
              "5953_2025_52_Sub Sección_12002.jpg",
              "6865_2025_52_Sub Sección_11864.jpg"
            ]
          },
          "MENCION JURADO": {
            "__files": ["4384_2025_52_Sub Sección_12018.jpg"]
          },
          "2do PREMIO": {
            "__files": ["9829_2025_52_Sub Sección_12108.jpg"]
          },
          "1er PREMIO": {
            "__files": ["1015_2025_52_Sub Sección_12104.jpg"]
          }
        }
      }
    }
  }
}
EOF

echo "✓ Archivo JSON temporal creado en /tmp/judging_data.json"
echo ""
echo "Contenido del archivo:"
cat /tmp/judging_data.json | head -20
echo "..."
echo ""

# Verificar que el JSON es válido
echo "Verificando validez del JSON..."
if jq empty /tmp/judging_data.json 2>/dev/null; then
    echo "✓ JSON válido"
else
    echo "⚠ jq no instalado, saltando validación JSON"
fi
echo ""

# Mostrar el comando curl que se va a ejecutar
echo "Comando curl a ejecutar:"
echo "────────────────────────────────────────────────────────────────"
echo "curl -X POST '$API_URL' \\"
echo "  -H 'Authorization: Bearer $TOKEN' \\"
echo "  -H 'Content-Type: application/json; charset=utf-8' \\"
echo "  --data @/tmp/judging_data.json"
echo "────────────────────────────────────────────────────────────────"
echo ""

# Preguntar si desea ejecutar
read -p "¿Desea ejecutar el curl? (s/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo ""
    echo "Ejecutando..."
    echo "════════════════════════════════════════════════════════════════"
    
    # Ejecutar el curl y capturar la respuesta
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json; charset=utf-8" \
      --data @/tmp/judging_data.json)
    
    # Separar el código de estado del body
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    echo ""
    echo "Respuesta del servidor:"
    echo "────────────────────────────────────────────────────────────────"
    echo "HTTP Status: $HTTP_CODE"
    echo ""
    echo "Body:"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    echo "────────────────────────────────────────────────────────────────"
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo ""
        echo "✓ Petición exitosa"
    else
        echo ""
        echo "✗ Petición falló con código $HTTP_CODE"
    fi
else
    echo "Operación cancelada"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "Nota: El archivo temporal se mantiene en /tmp/judging_data.json"
echo "      para que puedas inspeccionarlo o modificarlo."
echo "════════════════════════════════════════════════════════════════"
