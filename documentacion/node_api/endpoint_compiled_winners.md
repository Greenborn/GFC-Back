# Endpoint: Descarga de Fotos Premiadas del Año

## Descripción
Genera un ZIP con todas las fotografías premiadas de los concursos del año especificado. Solo considera concursos con `judged = true` y `organization_type = 'INTERNO'` cuyo `end_date` cae entre el 1 de enero y el 31 de diciembre del año indicado.

## Ruta
`GET /api/contest/compiled-winners`

## Seguridad
- Privado: requiere autenticación con token Bearer
- Permisos: solo administrador (`role_id == '1'`)

## Parámetros
- `year` (opcional): año objetivo; si no se indica se usa el año en curso
- `premios` (opcional): CSV con premios a incluir; por defecto `"1er PREMIO","2do PREMIO","3er PREMIO","MENCION ESPECIAL"`
- `categorias` (opcional): CSV con categorías a incluir; por defecto `"Estímulo","Primera"`

## Comportamiento
- Selecciona concursos por rango de `end_date` del año
- Filtra por `judged = true` y `organization_type = 'INTERNO'`
- Crea `compilado_premiadas` en `IMG_REPOSITORY_PATH`
  - Si existe se elimina y se recrea
- Estructura generada:
  - `<titulo_concurso_sanitizado>/` (minúsculas, espacios→`_`, solo alfanumérico)
    - `<categoria>/` (minúsculas)
      - `<seccion>/` (minúsculas)
        - `<premio>/` (minúsculas)
          - archivos con su nombre original
- Copia de archivos desde `IMG_REPOSITORY_PATH + image.url`
- Genera `compilado_premiadas_<year>.zip` y devuelve URL pública

## Respuesta
```json
{
  "success": true,
  "year": 2025,
  "download_url": "https://assets.prod-gfc.greenborn.com.ar/compilado_premiadas_2025.zip"
}
```

## Ejemplos de Uso
```bash
# Por defecto (año actual, premios y categorías por defecto)
curl -H "Authorization: Bearer <token_admin>" \
  "https://gfc.prod-api.greenborn.com.ar/api/contest/compiled-winners"

# Año 2024, premios y categorías personalizados
curl -H "Authorization: Bearer <token_admin>" \
  "https://gfc.prod-api.greenborn.com.ar/api/contest/compiled-winners?year=2024&premios=1er%20PREMIO,2do%20PREMIO&categorias=Primera"
```

## Variables de Entorno
- `IMG_REPOSITORY_PATH`: ruta local del repositorio de imágenes (ej. `/var/www/GFC-PUBLIC-ASSETS`)
- `IMG_BASE_PATH`: base pública para construir `download_url` (ej. `https://assets.prod-gfc.greenborn.com.ar`)

## Origen de Datos
- `contest` (title, end_date, judged, organization_type)
- `contest_result` (contest_id, image_id, section_id, metric_id)
- `metric` (prize)
- `image` (title, url, profile_id)
- `profile` (name, last_name)
- `profile_contest` → `category` (name)
