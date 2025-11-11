# Función de Recalculo de Ranking Anual

## Descripción General
- Se debe regenerar ranking por fotoclub y por perfil de acuerdo a las premiaciones obtenidas en todos los
concursos en los cuales los concursantes participaron y fueron juzgados

## Parámetros de Entrada
- No requiere parametros de entrada

## Salida Esperada
- la salida es el resultado del ranking recalculado
- retorna json stat == true o false segun corresponda

## Tablas en base de datos de resultado de ranking
### fotoclub_ranking
Almacena el ranking anual de cada fotoclub, incluyendo puntaje, premios obtenidos y efectividad.

**Aclaración:** El campo `prizes` es un JSON donde la clave representa el tipo de premio y el valor la sumatoria del puntaje obtenido por ese premio. Ejemplo:

```json
{"ACEPTADA":26,"MENCION JURADO":5,"-":2,"2do PREMIO":1,"0":5,"1er PREMIO":1}
```
En este ejemplo, cada clave es el nombre del premio y el valor es la sumatoria del puntaje correspondiente.
CREATE TABLE "public"."fotoclub_ranking" ( 
  "id" SERIAL,
  "fotoclub_id" INTEGER NOT NULL,
  "name" TEXT NULL,
  "score" INTEGER NOT NULL,
  "prizes" TEXT NULL,
  "puntaje_temporada" INTEGER NULL,
  "porc_efectividad_anual" TEXT NULL,
  "premios_temporada" TEXT NULL,
  CONSTRAINT "fotoclub_ranking_pkey" PRIMARY KEY ("id")
);

### profiles_ranking_category_section
Registra el ranking anual por perfil, categoría y sección, con puntajes y premios obtenidos por cada usuario.

**Aclaración:** El campo `prizes` es un JSON donde la clave representa el tipo de premio y el valor la sumatoria del puntaje obtenido por ese premio. Ejemplo:

```json
{"ACEPTADA":26,"MENCION JURADO":5,"-":2,"2do PREMIO":1,"0":5,"1er PREMIO":1}
```
En este ejemplo, cada clave es el nombre del premio y el valor es la sumatoria del puntaje correspondiente.
CREATE TABLE "public"."profiles_ranking_category_section" ( 
  "id" SERIAL,
  "profile_id" INTEGER NOT NULL,
  "section_id" INTEGER NOT NULL,
  "category_id" INTEGER NOT NULL,
  "puntaje_temporada" INTEGER NOT NULL,
  "score_total" INTEGER NOT NULL,
  "prizes" TEXT NULL,
  "name" VARCHAR NULL,
  "premios_temporada" TEXT NULL,
  CONSTRAINT "profiles_ranking_category_section_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "profiles_ranking_category_section_category_id" FOREIGN KEY ("category_id") REFERENCES "public"."category" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "profiles_ranking_category_section_profile_id" FOREIGN KEY ("profile_id") REFERENCES "public"."profile" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "profiles_ranking_category_section_section_id" FOREIGN KEY ("section_id") REFERENCES "public"."section" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

## Tablas relacionadas a concursos

### metric
Define los tipos de premios y sus valores de puntaje, utilizados para calcular el ranking según los resultados obtenidos por los participantes.
CREATE TABLE "public"."metric" ( 
  "id" SERIAL,
  "prize" VARCHAR NOT NULL,
  "score" INTEGER NULL,
  "dni" VARCHAR(25) NULL,
  CONSTRAINT "metric_pkey" PRIMARY KEY ("id")
);

### contest
Contiene la información principal de cada concurso fotográfico, incluyendo fechas, nombre y estado de juzgamiento.
CREATE TABLE "public"."contest" ( 
  "id" SERIAL,
  "name" VARCHAR NOT NULL,
  "description" TEXT NULL,
  "start_date" TIMESTAMP NULL,
  "end_date" TIMESTAMP NULL,
  "max_img_section" INTEGER NULL DEFAULT 3 ,
  "img_url" VARCHAR(200) NULL,
  "rules_url" VARCHAR NULL,
  "sub_title" VARCHAR(255) NULL,
  "organization_type" VARCHAR(250) NULL,
  "judged" BOOLEAN NULL,
  CONSTRAINT "contest_pkey" PRIMARY KEY ("id")
);

### contest_category
Relaciona cada concurso con sus categorías, permitiendo identificar en qué categorías se compite en cada evento.
CREATE TABLE "public"."contest_category" ( 
  "id" SERIAL,
  "contest_id" INTEGER NOT NULL,
  "category_id" INTEGER NOT NULL,
  CONSTRAINT "contest_category_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fk_contest_category_id" FOREIGN KEY ("category_id") REFERENCES "public"."category" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "fk_contest_contest_id" FOREIGN KEY ("contest_id") REFERENCES "public"."contest" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
CREATE INDEX "fk_contest_category_id" 
ON "public"."contest_category" (
  "category_id" ASC
);
CREATE INDEX "fk_contest_contest_id" 
ON "public"."contest_category" (
  "contest_id" ASC
);

### contest_result
Almacena los resultados de cada concurso, asociando imágenes, métricas y secciones, base para el cálculo de puntajes y premios.
CREATE TABLE "public"."contest_result" ( 
  "id" SERIAL,
  "metric_id" INTEGER NOT NULL,
  "image_id" INTEGER NOT NULL,
  "contest_id" INTEGER NOT NULL,
  "section_id" INTEGER NOT NULL,
  CONSTRAINT "contest_result_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "contest_result_section" FOREIGN KEY ("section_id") REFERENCES "public"."section" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "fk_contest_result_contest_id" FOREIGN KEY ("contest_id") REFERENCES "public"."contest" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "fk_contest_result_image_id" FOREIGN KEY ("image_id") REFERENCES "public"."image" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "fk_contest_result_metric_id" FOREIGN KEY ("metric_id") REFERENCES "public"."metric" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
CREATE INDEX "fk_contest_result_contest_id" 
ON "public"."contest_result" (
  "contest_id" ASC
);
CREATE INDEX "fk_contest_result_image_id" 
ON "public"."contest_result" (
  "image_id" ASC
);
CREATE INDEX "fk_contest_result_metric_id" 
ON "public"."contest_result" (
  "metric_id" ASC
);

### contest_section
Permite vincular concursos con sus secciones, facilitando el análisis por áreas temáticas o técnicas.
CREATE TABLE "public"."contest_section" ( 
  "id" SERIAL,
  "contest_id" INTEGER NOT NULL,
  "section_id" INTEGER NOT NULL,
  CONSTRAINT "contest_section_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fk_contest_contest2_id" FOREIGN KEY ("contest_id") REFERENCES "public"."contest" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "fk_contest_section_id" FOREIGN KEY ("section_id") REFERENCES "public"."section" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
CREATE INDEX "fk_contest_contest2_id" 
ON "public"."contest_section" (
  "contest_id" ASC
);
CREATE INDEX "fk_contest_section_id" 
ON "public"."contest_section" (
  "section_id" ASC
);

### profile_contest
Registra la inscripción de perfiles (usuarios) en concursos y categorías, clave para identificar participantes y calcular rankings individuales.
CREATE TABLE "public"."profile_contest" ( 
  "id" SERIAL,
  "profile_id" INTEGER NOT NULL,
  "contest_id" INTEGER NOT NULL,
  "category_id" INTEGER NULL,
  CONSTRAINT "profile_contest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fk_profile_contest_id" FOREIGN KEY ("contest_id") REFERENCES "public"."contest" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "fk_profile_profile_id" FOREIGN KEY ("profile_id") REFERENCES "public"."profile" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "profile_contest_category" FOREIGN KEY ("category_id") REFERENCES "public"."category" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "profile_enrolled" FOREIGN KEY ("profile_id") REFERENCES "public"."profile" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
CREATE INDEX "fk_profile_contest_id" 
ON "public"."profile_contest" (
  "contest_id" ASC
);
CREATE INDEX "fk_profile_profile_id" 
ON "public"."profile_contest" (
  "profile_id" ASC
);

## Proceso de Cálculo (Definición Técnica)

### 1. Inicialización
- Iniciar proceso de recalculo para el año actual.
- Limpiar o preparar las tablas de ranking (`fotoclub_ranking`, `profiles_ranking_category_section`) se vaciarán

### 2. Obtener datos base

- Recuperar todos los concursos juzgados en el año actual:
  - Seleccionar de la tabla `contest` aquellos registros donde:
    - El campo `judged` sea verdadero
    - La fecha de cierre (`end_date`) esté dentro del año en curso
    - El campo `organization_type` sea igual a 'INTERNO'
  - Ejemplo de consulta SQL:
    ```sql
    SELECT * FROM contest
    WHERE judged = true
      AND organization_type = 'INTERNO'
      AND EXTRACT(YEAR FROM end_date) = EXTRACT(YEAR FROM CURRENT_DATE);
    ```
  - Alternativamente, si se requiere filtrar por otro campo de fecha, ajustar la consulta según corresponda.

- Para cada concurso, obtener sus categorías (`contest_category`) y secciones (`contest_section`).
- Obtener todos los resultados (`contest_result`) asociados a los concursos juzgados.
- Obtener la definición de premios y puntajes desde la tabla `metric`.

### 3. Procesar resultados por perfil
Para cada perfil participante:
  - Para cada categoría y sección en la que participó:
  - Sumar el puntaje total obtenido según los premios (`metric.score`).
  - Contabilizar la cantidad de premios por tipo (acumulando en un JSON `prizes`).
  - Calcular la efectividad (porcentaje de imágenes premiadas sobre presentadas).
  - Guardar/actualizar el registro en `profiles_ranking_category_section`.

### 4. Procesar resultados por fotoclub
Para cada fotoclub:
  - Identificar todos los perfiles asociados al fotoclub.
  - Sumar puntajes y premios obtenidos por sus miembros en el año.
  - Calcular la efectividad anual del fotoclub.
  - Guardar/actualizar el registro en `fotoclub_ranking`.

### 5. Generar salida
- Retornar un JSON con stat == true y los rankings generados.
- En caso de error, retornar stat == false y loguear el error.

## Validaciones y Errores
- Manejo de errores y casos excepcionales.
- Los errores retornan stat == false y se muestra error en console.log

## Ubicacion de la función en estructura de archivos
Se usará archivo node_api/controllers/ranking.js para implementar nueva funcion actualizar_ranking

## Notas de implementación y llamada de la función 
la misma se puede llamar de dos maneras
- Por linea de comandos, se debe crear nuevo script dentro de directorio node_api/commands/recalcular_ranking.js que debe implementar todo el codigo necesario para conectarse a la base de datos usando las configuraciones ya definidas en node_api/.env
- A petición del administrador en edpoint existente en endpoint /recalcular-ranking, no omitas la validación de que el usuario que hace el llamado debe ser de tipo administrador (mantenlo como está), reemplaza el llamado a comando php