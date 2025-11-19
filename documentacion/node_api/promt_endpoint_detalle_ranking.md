# Endpoint: Detalle de Ranking por Concursante

## Descripción Técnica

Este endpoint permite obtener los detalles del ranking para cada concursante en un concurso específico. La información se obtiene combinando los datos de las tablas `contest`, `profile`, `profile_contest`, `contest_result`, `metric`, y las relaciones con categorías y secciones.

### Ruta Sugerida
`GET /api/ranking/detalle/:contest_id/:profile_id`

### Parámetros
- `contest_id`: ID del concurso.
- `profile_id`: ID del concursante (perfil).

### Respuesta
La respuesta incluye:
- Datos del concursante (`profile`): nombre, apellido, fotoclub, imagen, etc.
- Datos del concurso (`contest`): nombre, fechas, organización, etc.
- Categorías y secciones en las que participa el concursante.
- Resultados obtenidos por el concursante en cada sección/categoría:
    - Métricas (`metric`): premios, puntajes, etc.
    - Imágenes presentadas y resultados asociados (`contest_result`).
- Ranking total y por categoría/sección.

#### Ejemplo de respuesta
```json
{
  "contest": { ... },
  "profile": { ... },
  "categories": [ ... ],
  "sections": [ ... ],
  "results": [
    {
      "section": "Naturaleza",
      "category": "Fauna",
      "images": [
        {
          "image_id": 123,
          "metric": {
            "prize": "Oro",
            "score": 95
          }
        }
      ]
    }
  ],
  "ranking": {
    "total_score": 250,
    "position": 2
  }
}
```

### Consultas SQL Sugeridas

1. **Obtener datos del concursante y concurso:**
```sql
SELECT p.*, c.*
FROM profile p
JOIN profile_contest pc ON pc.profile_id = p.id
JOIN contest c ON c.id = pc.contest_id
WHERE c.id = :contest_id AND p.id = :profile_id;
```

2. **Obtener categorías y secciones:**
```sql
SELECT cc.category_id, cs.section_id
FROM contest_category cc
JOIN contest_section cs ON cs.contest_id = cc.contest_id
WHERE cc.contest_id = :contest_id;
```

3. **Obtener resultados y métricas del concursante:**
```sql
SELECT cr.*, m.*
FROM contest_result cr
JOIN metric m ON m.id = cr.metric_id
JOIN profile_contest pc ON pc.contest_id = cr.contest_id
WHERE cr.contest_id = :contest_id AND pc.profile_id = :profile_id;
```

4. **Cálculo de ranking:**
- Sumar los puntajes (`score`) de las métricas asociadas al concursante.
- Determinar la posición comparando el total con otros concursantes del mismo concurso.

### Consideraciones
- Validar que el concursante esté inscripto en el concurso (`profile_contest`).
- Incluir solo resultados válidos y publicados.
- Permitir filtros por categoría/sección si se requiere.
- Optimizar las consultas con índices existentes.

### Seguridad
- Verificar permisos de acceso según el rol del usuario. solo los usuarios registrados deben poder acceder al endpoint

- Proteger datos sensibles del concursante.

---
