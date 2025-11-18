# Función de Validación del Ranking Anual

## Descripción General
- La función valida que los datos almacenados en `fotoclub_ranking` y `profiles_ranking_category_section` (ranking anual) estén correctamente calculados según las premiaciones registradas en los concursos juzgados del año en curso.
- En caso de detectar diferencias, retorna un detalle de discrepancias y errores de integridad/consistencia para permitir su corrección o recálculo.

## Parámetros de Entrada
- `year` (opcional): Año a validar en formato `YYYY`. Por defecto, año actual.
- `organization_type` (opcional): Tipo de organización a considerar. Por defecto `'INTERNO'`.
- `strict` (opcional): Si `true`, trata advertencias como errores (afecta `stat`). Por defecto `false`.
- `include_details` (opcional): Si `true`, retorna detalles exhaustivos por perfil y fotoclub. Por defecto `true`.

## Salida Esperada
- Retorna JSON con `stat` (`true` si no hay errores; `false` si hay errores graves o discrepancias cuando `strict` es `true`).
- Incluye resúmenes y listados de discrepancias, advertencias y errores de integridad.

Ejemplo de salida:

```json
{
  "stat": false,
  "resumen": {
    "anio": 2025,
    "organization_type": "INTERNO",
    "concursos_juzgados": 7,
    "perfiles_validados": 124,
    "fotoclubs_validados": 12,
    "discrepancias_count": 9,
    "errores_integridad_count": 2,
    "advertencias_count": 4
  },
  "discrepancias": {
    "profiles": [
      {
        "profile_id": 123,
        "section_id": 2,
        "category_id": 1,
        "campo": "score_total",
        "esperado": 86,
        "almacenado": 80,
        "detalle": "Diferencia de 6 puntos según métricas del año"
      },
      {
        "profile_id": 123,
        "section_id": 2,
        "category_id": 1,
        "campo": "prizes",
        "esperado": {"ACEPTADA": 20, "MENCION JURADO": 6},
        "almacenado": {"ACEPTADA": 18, "MENCION JURADO": 6},
        "detalle": "Sumatoria de 'ACEPTADA' no coincide"
      }
    ],
    "fotoclubs": [
      {
        "fotoclub_id": 9,
        "campo": "puntaje_temporada",
        "esperado": 350,
        "almacenado": 342,
        "detalle": "Suma de puntajes de perfiles del club difiere en 8"
      }
    ]
  },
  "errores_integridad": [
    {"tipo": "referencia", "detalle": "profiles_ranking_category_section.profile_id=999 no existe en profile"},
    {"tipo": "datos", "detalle": "prizes JSON inválido en fotoclub_ranking.id=45"}
  ],
  "advertencias": [
    {"tipo": "efectividad", "detalle": "porc_efectividad_anual en fotoclub_id=9 formateado como texto, esperado número"}
  ]
}
```

## Tablas de ranking validadas
### fotoclub_ranking
Almacena el ranking anual de cada fotoclub: puntaje, premios y efectividad.

**Aclaración `prizes`:** JSON donde la clave es el nombre del premio y el valor la sumatoria del puntaje de ese premio.

Campos relevantes:
- `fotoclub_id`, `name`, `score`, `puntaje_temporada`, `porc_efectividad_anual` (texto o número), `prizes` (JSON), `premios_temporada` (texto/JSON).

### profiles_ranking_category_section
Ranking anual por perfil, categoría y sección, con puntajes y premios por usuario.

**Aclaración `prizes`:** JSON con clave premio y valor sumatoria de puntaje.

Campos relevantes:
- `profile_id`, `section_id`, `category_id`, `puntaje_temporada`, `score_total`, `prizes` (JSON), `name`, `premios_temporada` (texto/JSON).

## Tablas relacionadas a concursos (fuente de verdad)
Se validará contra:
- `metric` (tipos de premio y puntaje)
- `contest` (concursos juzgados del año)
- `contest_category`, `contest_section` (categorías/secciones por concurso)
- `contest_result` (resultados con `metric_id`, `image_id`, `contest_id`, `section_id`)
- `image` (perfil y categoría de la imagen)
- `profile`, `fotoclub` (identidad y vinculación de perfiles a fotoclubs)

## Alcance y filtros
- Solo concursos con `judged = true` y `organization_type = 'INTERNO'` (configurable por parámetro).
- Año a validar: por defecto el actual (`EXTRACT(YEAR FROM end_date)`), configurable por `year`.

Ejemplo de filtro de concursos:
```sql
SELECT id
FROM contest
WHERE judged = true
  AND organization_type = 'INTERNO'
  AND EXTRACT(YEAR FROM end_date) = :year;
```

## Reglas de negocio a validar
- Por perfil/categoría/sección:
  - `score_total` = suma de `metric.score` de todas las imágenes premiadas del año.
  - `puntaje_temporada` consistente con `score_total` (igual o cálculo definido; documentar si difiere).
  - `prizes` JSON: sumatoria por tipo de premio coincide con los resultados.
  - Efectividad: `% = (premiadas / presentadas) * 100` según criterio `metric.score > 0` (configurable).
  - Integridad: referencias válidas a `profile`, `category`, `section`.
- Por fotoclub:
  - `puntaje_temporada` y/o `score` = suma de puntajes de perfiles del fotoclub.
  - `prizes` JSON: agregación por premio coincide con suma de perfiles.
  - `porc_efectividad_anual`: cálculo y formato consistentes (numérico preferido).
  - Integridad: referencia válida a `fotoclub`.
- Consistencias cruzadas:
  - La suma de `profiles_ranking_category_section.score_total` por fotoclub coincide con `fotoclub_ranking.puntaje_temporada`.
  - Las claves de `prizes` corresponden a premios definidos en `metric.prize`.
  - No existen duplicados inesperados por (`profile_id`,`category_id`,`section_id`) en el año.

## Proceso técnico de validación
1. Inicialización
   - Determinar `year` y `organization_type`.
   - Cargar definiciones de `metric` (premios y puntajes).

2. Obtener datos base
   - Listar concursos juzgados que cumplan filtros.
   - Traer `contest_result` del año y enriquecer con `image.profile_id`, `image.category_id` y `metric`.

3. Validación por perfil/categoría/sección
   - Agrupar resultados por (`profile_id`,`section_id`,`category_id`).
   - Calcular esperado:
     - `expected_score_total` = SUM(`metric.score`).
     - `expected_prizes` = sumatoria de `metric.score` por `metric.prize`.
     - `expected_efectividad` = `premiadas / presentadas`.
   - Comparar con registros en `profiles_ranking_category_section` y coleccionar discrepancias.

4. Validación por fotoclub
   - Vincular perfiles a `fotoclub`.
   - Agregar puntajes y `prizes` por fotoclub.
   - Comparar con `fotoclub_ranking` y coleccionar discrepancias.

5. Integridad y consistencia
   - Verificar claves ajenas: `profile_id`, `category_id`, `section_id`, `fotoclub_id` existen.
   - Validar formato de `prizes` (JSON válido) y presencia de claves definidas en `metric`.
   - Comprobar ausencia de duplicados para el año.

6. Generar salida
   - Armar JSON final con `stat`, `resumen`, `discrepancias`, `errores_integridad`, `advertencias`.
   - Si `strict = true` y existen discrepancias, `stat = false`.

## Consultas de referencia (ejemplos)
- Perfil/categoría/sección (puntaje esperado, ejemplo ilustrativo):
```sql
SELECT i.profile_id, cr.section_id, i.category_id,
       SUM(m.score) AS expected_score_total
FROM contest_result cr
JOIN contest c ON c.id = cr.contest_id
JOIN metric m ON m.id = cr.metric_id
JOIN image i ON i.id = cr.image_id
WHERE c.judged = true
  AND c.organization_type = :organization_type
  AND EXTRACT(YEAR FROM c.end_date) = :year
GROUP BY i.profile_id, cr.section_id, i.category_id;
```

- Efectividad (ejemplo aproximado):
```sql
SELECT i.profile_id, cr.section_id, i.category_id,
       SUM(CASE WHEN m.score > 0 THEN 1 ELSE 0 END) * 100.0
         / COUNT(*) AS expected_efectividad
FROM contest_result cr
JOIN contest c ON c.id = cr.contest_id
JOIN metric m ON m.id = cr.metric_id
JOIN image i ON i.id = cr.image_id
WHERE c.judged = true
  AND c.organization_type = :organization_type
  AND EXTRACT(YEAR FROM c.end_date) = :year
GROUP BY i.profile_id, cr.section_id, i.category_id;
```

## Criterios de severidad
- Error: Diferencias en puntajes, referencias inválidas, JSON `prizes` inválido.
- Advertencia: Diferencias de formato (por ejemplo, porcentajes texto vs número), redondeos menores, claves de premio no encontradas pero con puntaje 0.

## Ubicación de la función en la estructura de archivos
- Se implementará en `node_api/controllers/ranking.js` como nueva función `validar_ranking`.

## Notas de implementación y llamada de la función
- Llamada por línea de comandos: se creará `node_api/commands/validar_ranking.js` que usará la configuración de `node_api/.env` y ejecutará `validar_ranking`.
- Ejemplo de uso CLI:
  - `node node_api/commands/validar_ranking.js --year 2025 --organization INTERNO --strict --include_details`
- Respuesta: imprimir JSON por consola y retornar código de salida `0` si `stat=true`, `1` si `stat=false`.

## Manejo de errores
- Ante errores de conexión o ejecución, retornar `stat=false` con detalle en `errores_integridad` y loguear en consola.

## Consideraciones adicionales
- Alinear filtros y lógica con la función de recálculo existente para comparar exactamente contra el mismo universo de datos.
- Parametrizar el criterio de efectividad si fuese distinto a `score>0`.
- Evitar lecturas completas; usar agregaciones por año para performance.

## Checklist de validación (resumen)
- Concursos filtrados correctamente por año y tipo.
- Puntajes por perfil/categoría/sección coinciden (`score_total` / `puntaje_temporada`).
- `prizes` JSON coincide en claves y sumatorias.
- Suma por fotoclub coincide (`puntaje_temporada` / `score`).
- Efectividad calculada y formato consistente.
- Integridad referencial y ausencia de duplicados.
- Salida JSON clara con `stat`, discrepancias y errores.