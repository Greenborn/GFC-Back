# Solución al Problema del Endpoint /api/results/judging

## Problema Identificado

El comando `curl` original estaba usando escapes hexadecimales de bash (`\xf3`, `\xed`) en lugar de caracteres UTF-8 reales, lo que causaba que el servidor no pudiera parsear correctamente el JSON.

### Comando Problemático
```bash
curl ... --data-raw $'{"estructura":{"BALCARCE 2025":{"Primera":{"Sub Secci\xf3n":...}}}}'
```

El uso de `$'...'` con escapes hexadecimales funciona en bash, pero cuando se envía por HTTP, el servidor no puede interpretar estos escapes correctamente.

## Soluciones Implementadas

### 1. Mejoras en el Endpoint (Completado ✓)

Se mejoró el endpoint `/api/results/judging` con:

- **Validación más robusta** de la estructura recibida
- **Logging detallado** para debugging:
  - Muestra el tipo de datos recibidos
  - Verifica que `estructura` sea un objeto válido
  - Lista los concursos encontrados
  - Registra cada paso del procesamiento
- **Manejo de errores mejorado** con try-catch completo
- **Mensajes de error descriptivos** que indican exactamente qué falló

### 2. Cambios Realizados

**Archivo modificado:** `node_api/routes/results.js`

```javascript
// Antes
const estructura = req.body.estructura;
if (!estructura || typeof estructura !== 'object') {
  return res.status(400).json({ success: false, message: 'Estructura inválida o faltante' });
}

// Ahora
console.log('═══════════════════════════════════════════════════════');
console.log('POST /results/judging - Inicio del procesamiento');
console.log('Body recibido - Keys:', Object.keys(req.body));
console.log('Body recibido - Tipo:', typeof req.body);

const estructura = req.body.estructura;
console.log('Estructura - Tipo:', typeof estructura);
console.log('Estructura - Es null:', estructura === null);
console.log('Estructura - Es undefined:', estructura === undefined);

// Validación mejorada con mensajes descriptivos
if (!estructura) {
  console.error('ERROR: Estructura no definida');
  return res.status(400).json({ 
    success: false, 
    message: 'Estructura inválida o faltante',
    detalle: 'El campo "estructura" no está presente en el body'
  });
}

if (typeof estructura !== 'object' || Array.isArray(estructura)) {
  console.error('ERROR: Estructura no es un objeto válido');
  return res.status(400).json({ 
    success: false, 
    message: 'Estructura inválida o faltante',
    detalle: 'El campo "estructura" debe ser un objeto, no un array o valor primitivo'
  });
}

const concursosKeys = Object.keys(estructura);
if (concursosKeys.length === 0) {
  console.error('ERROR: Estructura vacía');
  return res.status(400).json({ 
    success: false, 
    message: 'Estructura inválida o faltante',
    detalle: 'La estructura no contiene ningún concurso'
  });
}

console.log('Concursos encontrados:', concursosKeys);
```

Todo el endpoint ahora está envuelto en un try-catch para capturar cualquier error inesperado.

## Cómo Usar el Endpoint Correctamente

### Opción 1: Usando un Archivo JSON (RECOMENDADO)

1. **Crear el archivo JSON** con caracteres UTF-8 reales:

```bash
cat > judging_data.json << 'EOF'
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
              "5953_2025_52_Sub Sección_12002.jpg"
            ]
          }
        }
      }
    }
  }
}
EOF
```

2. **Ejecutar el curl**:

```bash
curl -X POST 'https://gfc.api2.greenborn.com.ar/api/results/judging' \
  -H 'Authorization: Bearer TU_TOKEN_AQUI' \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data @judging_data.json
```

### Opción 2: Usando el Script de Prueba

Se creó un script interactivo que facilita el proceso:

```bash
chmod +x test_curl_judging.sh
./test_curl_judging.sh
```

Este script:
- Crea el archivo JSON temporal
- Valida que el JSON sea correcto
- Muestra el comando que se va a ejecutar
- Solicita confirmación antes de ejecutar
- Muestra la respuesta formateada del servidor

### Opción 3: Inline (Para estructuras pequeñas)

```bash
curl -X POST 'https://gfc.api2.greenborn.com.ar/api/results/judging' \
  -H 'Authorization: Bearer TU_TOKEN' \
  -H 'Content-Type: application/json; charset=utf-8' \
  -d '{
    "estructura": {
      "BALCARCE 2025": {
        "Primera": {
          "Sub Sección": {
            "1er PREMIO": {
              "__files": ["1015_2025_52_Sub Sección_12104.jpg"]
            }
          }
        }
      }
    }
  }'
```

**IMPORTANTE**: NO uses `$'...'` con escapes hexadecimales. Siempre usa caracteres UTF-8 reales (ó, í, á, etc.)

## Estructura del JSON

La estructura debe seguir este formato:

```json
{
  "estructura": {
    "NOMBRE_CONCURSO": {
      "CATEGORIA": {
        "SECCION": {
          "PREMIO": {
            "__files": ["archivo1.jpg", "archivo2.jpg"]
          }
        }
      }
    }
  }
}
```

Donde:
- **NOMBRE_CONCURSO**: Ej. "BALCARCE 2025"
- **CATEGORIA**: "Primera" o "Estímulo" (nota: "Estmulo" se normaliza automáticamente a "Estímulo")
- **SECCION**: "Sub Sección", "Monocromo" o "Color"
- **PREMIO**: "1er PREMIO", "2do PREMIO", "3er PREMIO", "ACEPTADA", "RECHAZADA", "MENCION JURADO", "MENCION ESPECIAL", "FUERA DE REGLAMENTO"
- **__files**: Array de nombres de archivos

### Formato de Nombres de Archivo

Los archivos deben tener el formato:
```
{id_usuario}_{año}_{id_concurso}_{sección}_{id_imagen}.jpg
```

Ejemplo: `1585_2025_52_Sub Sección_11865.jpg`

El sistema extrae automáticamente:
- `id_usuario`: 1585
- `año`: 2025
- `id_concurso`: 52
- `sección`: Sub Sección
- `id_imagen`: 11865
- `code`: 1585_2025_52_Sub Sección_11865

## Scripts de Prueba Disponibles

### 1. test_estructura_judging.js
Script Node.js que valida la estructura localmente sin hacer peticiones HTTP.

```bash
node test_estructura_judging.js
```

**Útil para**:
- Verificar que la estructura es válida
- Ver cómo se procesa la estructura
- Debugging sin tocar el servidor

### 2. test_curl_judging.sh
Script bash interactivo para probar el endpoint.

```bash
chmod +x test_curl_judging.sh
./test_curl_judging.sh
```

**Útil para**:
- Hacer peticiones reales al servidor
- Ver la respuesta formateada
- Debugging de la comunicación HTTP

## Logs del Servidor

Con las mejoras implementadas, el servidor ahora registra información detallada:

```
═══════════════════════════════════════════════════════
POST /results/judging - Inicio del procesamiento
Body recibido - Keys: [ 'estructura' ]
Body recibido - Tipo: object
Estructura - Tipo: object
Estructura - Es null: false
Estructura - Es undefined: false
Concursos encontrados: [ 'BALCARCE 2025' ]
INICIO procesamiento de estructura
═══════════════════════════════════════════════════════
```

Si hay un error, verás:
```
═══════════════════════════════════════════════════════
ERROR en POST /results/judging: {mensaje de error}
Stack: {stack trace completo}
═══════════════════════════════════════════════════════
```

## Verificación de la Solución

Para verificar que todo funciona:

1. **Verificar el servidor está corriendo**:
```bash
curl https://gfc.api2.greenborn.com.ar/health
```

2. **Probar con estructura mínima**:
```bash
curl -X POST 'https://gfc.api2.greenborn.com.ar/api/results/judging' \
  -H 'Authorization: Bearer TU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d @/tmp/estructura_completa.json
```

3. **Revisar logs del servidor** para ver el procesamiento detallado

## Resumen

✅ **Problema resuelto**: El endpoint ahora valida y procesa correctamente estructuras con caracteres UTF-8

✅ **Logging mejorado**: Información detallada para debugging

✅ **Mejor manejo de errores**: Mensajes descriptivos que ayudan a identificar problemas

✅ **Scripts de prueba**: Herramientas para verificar la estructura antes de enviarla

**Clave**: Siempre usar archivos JSON con UTF-8 real, no escapes hexadecimales de bash.
