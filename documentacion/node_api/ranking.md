# Generación y Recálculo de Ranking (API Node.js)

Este documento describe el flujo de generación y recálculo del ranking desde la API Node.js, incluyendo los endpoints involucrados, validaciones, estructura de datos esperada y efectos en la base de datos.

## Resumen del Proceso

- Se cargan los resultados del juzgamiento de un concurso vía `POST /api/results/judging`.
- Durante esa carga:
  - Se interpretan archivos y se extraen metadatos (usuario, año, concurso, sección, imagen).
  - Se completan datos cruzando `image`, `contest_result`, `metric` y `metric_abm`.
  - Se actualizan `metric.prize` y `metric.score` en base a `metric_abm` para cada resultado.
  - Se marca el concurso como `judged = true` (solo si hay un único `contest_id`).
- Luego se recalcula el ranking global vía `POST /api/results/recalcular-ranking`, que ahora utiliza lógica Node.js nativa para actualizar las tablas de ranking sin depender de comando PHP.

## Endpoints

### POST `/api/results/judging`

- Propósito: Registrar y consolidar resultados de juzgamiento en la BD.
- Autenticación: Requiere usuario con `role_id == '1'` (administrador).
- Header típico: `Authorization: Bearer <JWT>`.
- Body: Objeto `estructura` con cuatro niveles: concurso → categoría → sección → premio → archivos.

Ejemplo (simplificado):

```json
{
  "estructura": {
    "Concurso Nacional 2025": {
      "Primera": {
        "Monocromo": {
          "1er PREMIO": {
            "__files": [
              "12345_2025_51_Monocromo_67890.jpg",
              "12346_2025_51_Monocromo_67891.jpg"
            ]
          },
          "ACEPTADA": {
            "__files": [
              "12347_2025_51_Monocromo_67892.jpg"
            ]
          }
        },
        "Color": {
          "2do PREMIO": {
            "__files": [
              "22345_2025_51_Color_77890.jpg"
            ]
          }
        }
      }
    }
  }
}
```

Formato de nombre de archivo esperado:

- `id_usuario_anio_id_concurso_seccion_id_imagen.jpg`
- Ejemplo: `12345_2025_51_Monocromo_67890.jpg`
- Notas:
  - `seccion` puede contener guiones bajos si en el nombre original hay espacios.
  - Se normaliza la categoría `Estmulo` a `Estimulo` internamente.

Flujo interno (resumen técnico):

- Se parsea cada archivo y se construye un objeto resultado con: concurso, categoría, sección, premio, id_usuario, año, id_concurso, id_imagen y `code` (nombre del archivo sin extensión).
- Se complementa cada resultado con datos de BD:
  - `image` por `code`.
  - `profile` desde `image.profile_id`.
  - `contest_result` por `image.id`.
  - `metric` por `contest_result.metric_id`.
  - `metric_abm` por `premio` (`prize`). Si no existe, el proceso falla con error explícito.
- En transacción:
  - Se actualiza `metric.prize = premio` y `metric.score = score` (score tomado de `metric_abm.score`, redondeado a entero).
  - Se verifica que todos los resultados correspondan a un único `contest_id`.
  - Se marca `contest.judged = true` para ese concurso.

Respuestas típicas:

```json
{
  "success": true,
  "actualizaciones": [
    { "code": "12345_2025_51_Monocromo_67890", "metric_id": 999, "nuevo_prize": "1er PREMIO", "nuevo_score": 100 },
    { "code": "12346_2025_51_Monocromo_67891", "metric_id": 1000, "nuevo_prize": "2do PREMIO", "nuevo_score": 80 }
  ]
}
```

Errores y validaciones:

- 400 si falta `estructura` o no es un objeto.
- 400 si `estructura` está vacía.
- 500 si no se encuentra `metric_abm` para algún `premio`.
- 500 si se detectan múltiples `contest_id` en la misma carga.
- 403 si el usuario no es admin.

### POST `/api/results/recalcular-ranking`

- Propósito: Recalcular el ranking global en base a los resultados y métricas ya consolidados.
- Autenticación: Requiere usuario con `role_id == '1'` (administrador).
- Acción (Node): Selecciona concursos del año actual con `judged = true` y `organization_type = 'INTERNO'`, agrega por perfil/categoría/sección y por fotoclub, y persiste en transacción.

Efectos esperados:

- Limpia e inserta registros en `profiles_ranking_category_section` y `fotoclub_ranking`.
- `prizes` se guarda como JSON con la sumatoria de puntajes por tipo de premio.
- `porc_efectividad_anual` se compone con premiadas, totales y porcentaje.

Respuestas típicas:

```json
{
  "success": true,
  "message": "Ranking recalculado exitosamente",
  "output": {
    "stat": true,
    "message": "Ranking recalculado exitosamente",
    "perfiles_insertados": 123,
    "fotoclubs_insertados": 12
  }
}
```

Errores y validaciones:

- 403 si el usuario no es admin.
- 500 si ocurre un error interno durante el recálculo.

## Consideraciones de Datos y Configuración

- `metric_abm` es la tabla de referencia que mapea `prize` → `score` (y otros atributos como `organization_type`).
- El campo `category.mostrar_en_ranking` existe en el sistema y puede ser relevante para visualización/filtrado del ranking en otras vistas o procesos; se edita vía `PUT /api/category/edit`.
- El endpoint de recálculo tiene el directorio y binario PHP fijados: `/var/www/GFC-Back-PRD/php_api/` y `php8.1`. Si el entorno cambia, deben ajustarse estos valores en el código.

## Requisitos Previos

- Conexión a BD operativa desde Node (`global.knex`).
- Existencia de registros coherentes en `image`, `contest_result`, `metric` y `metric_abm`.
- PHP 8.1 y Yii CLI disponibles en el servidor y ruta configurada.

## Uso Recomendado (Paso a Paso)

1. Ejecutar `POST /api/results/judging` con el objeto `estructura` obtenido del sistema de juzgamiento.
2. Verificar que el concurso queda con `judged = true` y que las métricas se actualizan (prize/score) correctamente.
3. Ejecutar `POST /api/results/recalcular-ranking` para publicar/actualizar el ranking global (lógica Node).

## Ejemplos de Peticiones

`POST http://localhost:<SERVICE_PORT_ADMIN>/api/results/judging`

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d '{"estructura": {"Concurso Nacional 2025": {"Primera": {"Monocromo": {"1er PREMIO": {"__files": ["12345_2025_51_Monocromo_67890.jpg"]}}}}}}' \
  http://localhost:3000/api/results/judging
```

`POST http://localhost:<SERVICE_PORT_ADMIN>/api/results/recalcular-ranking`

```bash
curl -X POST \
  -H "Authorization: Bearer <JWT>" \
  http://localhost:3000/api/results/recalcular-ranking
```

## Notas de Implementación

- El endpoint `/judging` emite logs de diagnóstico detallados en consola, útiles para depurar la estructura recibida.
- La carga de resultados debe ser por concurso: la API rechaza estructuras que traigan resultados de más de un `contest_id`.
- El `code` utilizado para localizar `image` corresponde al nombre del archivo sin extensión.