// Script CLI para regenerar códigos de imágenes de un concurso
// Uso: node node_api/commands/regenerar_codigos.js <contest_id>
//
// Formato del código: [random4d]_[año]_[id_concurso]_[nombre_seccion]_[id_image]

const path = require('path');
const config = require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
require('../knexfile.js');
const { sanitizarNombreSeccion } = require('../utils/strings.js');

async function generarCodigoUnico(knex, imageId, contestId, sectionName, usedRandoms, year) {
  const sectionClean = sanitizarNombreSeccion(sectionName);

  let randomNum;
  let attempts = 0;
  do {
    randomNum = String(Math.floor(1000 + Math.random() * 9000));
    attempts++;
  } while (usedRandoms.has(randomNum) && attempts < 100);

  usedRandoms.add(randomNum);
  return `${randomNum}_${year}_${contestId}_${sectionClean}_${imageId}`;
}

(async () => {
  try {
    const contestId = process.argv[2];
    if (!contestId || isNaN(parseInt(contestId))) {
      console.error('Uso: node node_api/commands/regenerar_codigos.js <contest_id>');
      process.exit(1);
    }

    await global.knex.raw('SELECT 1');
    console.log(`Regenerando códigos para el concurso ID: ${contestId}`);

    const year = new Date().getFullYear().toString();

    // Obtener todos los contest_results del concurso con sus imágenes y secciones
    const rows = await global.knex('contest_result')
      .join('image', 'contest_result.image_id', 'image.id')
      .leftJoin('section', 'contest_result.section_id', 'section.id')
      .where('contest_result.contest_id', contestId)
      .select(
        'contest_result.image_id',
        'contest_result.section_id',
        'section.name as section_name',
        'image.code as current_code',
        'image.id as img_id'
      )
      .orderBy('contest_result.image_id');

    if (rows.length === 0) {
      console.log('No se encontraron resultados para este concurso.');
      process.exit(0);
    }

    // Colectar random numbers ya usados (extraer el prefijo de 4 dígitos)
    const usedRandoms = new Set();
    for (const row of rows) {
      if (row.current_code) {
        const prefix = row.current_code.split('_')[0];
        if (prefix && /^\d{4}$/.test(prefix)) {
          usedRandoms.add(prefix);
        }
      }
    }

    console.log(`Total resultados: ${rows.length}`);
    console.log(`Randoms ya existentes: ${usedRandoms.size}`);

    let actualizados = 0;
    for (const row of rows) {
      const sectionName = row.section_name || 'sin_seccion';
      const newCode = await generarCodigoUnico(
        global.knex, row.img_id, contestId, sectionName, usedRandoms, year
      );
      await global.knex('image').where({ id: row.img_id }).update({ code: newCode });
      actualizados++;
      if (actualizados % 50 === 0) {
        console.log(`  Procesados ${actualizados}/${rows.length}...`);
      }
    }

    console.log(`✔ Completado. ${actualizados} códigos actualizados.`);
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err?.message || err);
    if (process.env.NODE_ENV === 'development') {
      console.error(err?.stack);
    }
    process.exit(1);
  } finally {
    try { await global.knex?.destroy?.(); } catch (_) {}
  }
})();
