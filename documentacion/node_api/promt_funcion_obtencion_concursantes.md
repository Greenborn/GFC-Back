## Prompt para GPT-5: Función de obtención de concursantes INTERNO (año en curso)

Desarrolla una función en Node.js ubicada en el directorio `commands` de la carpeta `node_api` que realice lo siguiente:

1. **Conexión a la base de datos**:
   - Utiliza los datos de conexión del archivo `.env` de `node_api` (PostgreSQL).
   - Usa la estructura de tablas y relaciones definidas en la especificación técnica adjunta.

2. **Consulta de participantes**:
   - Obtén todos los participantes (usuarios) de concursos cuyo campo `organization_type` sea `INTERNO` y cuya fecha de realización (`start_date` o `end_date`) corresponda al año en curso.
   - El listado debe incluir los campos completos del perfil del usuario (profile), según la estructura definida en la base de datos.

3. **Formato y ordenamiento**:
   - El resultado debe estar ordenado alfabéticamente por el nombre del usuario.
   - El listado debe generarse en formato CSV, incluyendo los nombres de los campos como encabezado.

4. **Ubicación y ejecución**:
   - La función debe estar ubicada en el directorio `commands` de `node_api`.
   - Debe poder ejecutarse desde la línea de comandos y guardar el archivo CSV en una ruta configurable.

5. **Ejemplo de uso**:
   ```bash
   node commands/obtener_concursantes_interno.js --output ./output/concursantes_interno_2025.csv
   ```

6. **Consideraciones**:
   - Maneja errores de conexión y consulta.
   - Utiliza variables de entorno para credenciales y rutas.
   - Documenta el código con comentarios claros.

### Estructura esperada del CSV

```
id,nombre,apellido,email,telefono,fecha_registro,estado, ...otros campos del perfil
1,Juan,Pérez,juan.perez@email.com,123456789,2025-03-10,active,...
2,Ana,Gómez,ana.gomez@email.com,987654321,2025-04-22,active,...
```

---

**Referencia:** Utiliza la estructura de entidades y relaciones del sistema definida en `definicion_tecnica.md`.
