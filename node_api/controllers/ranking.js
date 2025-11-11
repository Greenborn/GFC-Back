// Controlador de Recalculo de Ranking Anual
// Implementa la funcionalidad definida en documentacion/node_api/promt_funcion_recalculo_ranking.md

/**
 * Recalcula el ranking anual de perfiles y fotoclubs.
 * - Limpia tablas de ranking
 * - Toma concursos juzgados del año en curso y tipo 'INTERNO'
 * - Agrega puntajes por perfil/categoría/sección desde contest_result + metric
 * - Agrega sumatoria por fotoclub y porcentaje de efectividad
 * Retorna un resumen con cantidades insertadas y detalle opcional.
 */
async function actualizarRanking() {
  const knex = global.knex;
  if (!knex) throw new Error('Conexión a base de datos (global.knex) no inicializada');

  // Inicio de temporada: primer día de enero del año actual
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  // Consulta de concursos del año actual, internos y juzgados
  const contests = await knex('contest')
    .select('id')
    .where({ organization_type: 'INTERNO', judged: true })
    .andWhere('end_date', '>=', startOfYear);

  const contestIds = contests.map(c => c.id);
  if (contestIds.length === 0) {
    // Aún así vaciamos tablas por consistencia
    await knex.transaction(async (trx) => {
      await trx('profiles_ranking_category_section').del();
      await trx('fotoclub_ranking').del();
    });
    return { stat: true, message: 'No hay concursos juzgados en el año actual', perfiles_insertados: 0, fotoclubs_insertados: 0 };
  }

  // Prefetch de inscripciones para mapear contest_id + profile_id -> category_id
  const inscriptions = await knex('profile_contest')
    .select('contest_id', 'profile_id', 'category_id')
    .whereIn('contest_id', contestIds);

  const categoryMap = new Map(); // key: `${contest_id}:${profile_id}` -> category_id
  for (const pc of inscriptions) {
    const key = `${pc.contest_id}:${pc.profile_id}`;
    // Si existe más de una inscripción, conservamos la primera
    if (!categoryMap.has(key) && pc.category_id != null) {
      categoryMap.set(key, pc.category_id);
    }
  }

  // Resultados con joins necesarios
  const resultados = await knex('contest_result as cr')
    .select(
      'cr.contest_id',
      'cr.section_id',
      'i.profile_id',
      'm.score as metric_score',
      'm.prize as metric_prize'
    )
    .join('metric as m', 'cr.metric_id', 'm.id')
    .join('image as i', 'cr.image_id', 'i.id')
    .whereIn('cr.contest_id', contestIds);

  // Agregación por perfil/categoría/sección
  const agregadosPerfiles = new Map(); // key: `${category_id}|${section_id}|${profile_id}`
  const perfilesIdsSet = new Set();

  for (const r of resultados) {
    const catKey = `${r.contest_id}:${r.profile_id}`;
    const categoryId = categoryMap.get(catKey);
    if (!categoryId) {
      // No se puede asignar categoría, se omite este resultado
      continue;
    }

    const key = `${categoryId}|${r.section_id}|${r.profile_id}`;
    if (!agregadosPerfiles.has(key)) {
      agregadosPerfiles.set(key, {
        profile_id: r.profile_id,
        section_id: r.section_id,
        category_id: categoryId,
        sumatoria_puntos: 0,
        resumen_premios: {}, // { prize: sum(score) }
        cant_presentadas: 0,
        cant_premiadas: 0
      });
    }
    const agg = agregadosPerfiles.get(key);
    const score = Number(r.metric_score) || 0;
    const prize = r.metric_prize || '-';

    agg.sumatoria_puntos += score;
    agg.cant_presentadas += 1;
    if (score > 0) agg.cant_premiadas += 1;
    agg.resumen_premios[prize] = (agg.resumen_premios[prize] || 0) + score; // suma de puntaje por premio

    perfilesIdsSet.add(r.profile_id);
  }

  const perfilesIds = Array.from(perfilesIdsSet);
  const perfiles = perfilesIds.length
    ? await knex('profile').select('id', 'name', 'last_name', 'fotoclub_id').whereIn('id', perfilesIds)
    : [];
  const perfilesById = new Map(perfiles.map(p => [p.id, p]));

  // Fotoclubs visibles para ranking
  const fotoclubs = await knex('fotoclub').select('id', 'name', 'mostrar_en_ranking');
  const fotoclubById = new Map(fotoclubs.map(f => [f.id, f]));

  // Agregación por fotoclub
  const agregadosFotoclub = new Map(); // key: fotoclub_id -> { sumatoria_puntos, resumen_premios, cant_presentadas, cant_premiadas }

  for (const agg of agregadosPerfiles.values()) {
    const perfil = perfilesById.get(agg.profile_id);
    if (!perfil) continue;
    const fc = fotoclubById.get(perfil.fotoclub_id);
    if (!fc || fc.mostrar_en_ranking !== 1) continue;

    if (!agregadosFotoclub.has(perfil.fotoclub_id)) {
      agregadosFotoclub.set(perfil.fotoclub_id, {
        fotoclub_id: perfil.fotoclub_id,
        sumatoria_puntos: 0,
        resumen_premios: {},
        cant_presentadas: 0,
        cant_premiadas: 0
      });
    }
    const aggFc = agregadosFotoclub.get(perfil.fotoclub_id);
    aggFc.sumatoria_puntos += agg.sumatoria_puntos;
    aggFc.cant_presentadas += agg.cant_presentadas;
    aggFc.cant_premiadas += agg.cant_premiadas;
    // Merge de premios (sumatoria de puntajes por premio)
    for (const [prize, val] of Object.entries(agg.resumen_premios)) {
      aggFc.resumen_premios[prize] = (aggFc.resumen_premios[prize] || 0) + (Number(val) || 0);
    }
  }

  // Persistencia en transacción
  let perfilesInsertados = 0;
  let fotoclubsInsertados = 0;

  await knex.transaction(async (trx) => {
    // Limpiar tablas
    await trx('profiles_ranking_category_section').del();
    await trx('fotoclub_ranking').del();

    // Insertar ranking por perfil/categoría/sección
    for (const agg of agregadosPerfiles.values()) {
      const perfil = perfilesById.get(agg.profile_id);
      const nombre = perfil ? `${perfil.name || ''} ${perfil.last_name || ''}`.trim() : '';
      const prizesJson = JSON.stringify(agg.resumen_premios || {});
      await trx('profiles_ranking_category_section').insert({
        profile_id: agg.profile_id,
        section_id: agg.section_id,
        category_id: agg.category_id,
        puntaje_temporada: agg.sumatoria_puntos,
        score_total: agg.sumatoria_puntos,
        prizes: prizesJson === '[]' ? '{}' : prizesJson,
        name: nombre,
        premios_temporada: prizesJson
      });
      perfilesInsertados += 1;
    }

    // Insertar ranking por fotoclub
    for (const aggFc of agregadosFotoclub.values()) {
      const fc = fotoclubById.get(aggFc.fotoclub_id);
      if (!fc) continue;
      const efectividad = (aggFc.cant_presentadas > 0)
        ? (aggFc.cant_premiadas / (aggFc.cant_presentadas / 100))
        : 0;
      const porcJson = JSON.stringify({
        premiadas: aggFc.cant_premiadas,
        totales: aggFc.cant_presentadas,
        porcentaje: efectividad
      });
      const prizesJson = JSON.stringify(aggFc.resumen_premios || {});
      await trx('fotoclub_ranking').insert({
        fotoclub_id: aggFc.fotoclub_id,
        name: fc.name,
        score: aggFc.sumatoria_puntos,
        puntaje_temporada: aggFc.sumatoria_puntos,
        prizes: prizesJson === '[]' ? '{}' : prizesJson,
        porc_efectividad_anual: porcJson,
        premios_temporada: prizesJson
      });
      fotoclubsInsertados += 1;
    }
  });

  return {
    stat: true,
    message: 'Ranking recalculado exitosamente',
    perfiles_insertados: perfilesInsertados,
    fotoclubs_insertados: fotoclubsInsertados
  };
}

module.exports = {
  actualizarRanking
};