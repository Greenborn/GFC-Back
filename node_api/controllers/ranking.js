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

// Controlador de Validación de Ranking Anual
// Implementa la funcionalidad definida en documentacion/node_api/promt_funcion_valida_ranking.md

/**
 * Valida el ranking anual de perfiles y fotoclubs contra los resultados de concursos del año.
 * @param {Object} options
 * @param {number} [options.year] - Año a validar (YYYY). Por defecto, año actual.
 * @param {string} [options.organization_type] - Tipo de organización. Por defecto 'INTERNO'.
 * @param {boolean} [options.strict] - Si true, trata advertencias como errores.
 * @param {boolean} [options.include_details] - Si true, retorna detalles por entidad.
 * @returns {Promise<Object>} JSON con stat, resumen y discrepancias.
 */
async function validarRanking(options = {}) {
  const knex = global.knex;
  if (!knex) throw new Error('Conexión a base de datos (global.knex) no inicializada');

  const year = Number(options.year) || new Date().getFullYear();
  const organizationType = options.organization_type || 'INTERNO';
  const strict = !!options.strict;
  const includeDetails = options.include_details !== false; // default true

  // Fechas límite del año para filtrar de forma consistente con el recálculo
  const startOfYear = new Date(year, 0, 1);

  // Utilidad segura para parseo de JSON
  const parseJsonSafe = (txt) => {
    if (txt == null) return {};
    if (typeof txt === 'object') return txt || {};
    const s = String(txt).trim();
    if (s === '' || s === '[]') return {};
    try { return JSON.parse(s); } catch { return {}; }
  };

  // 1) Concursos del año, internos y juzgados (mismo criterio de recálculo)
  const contests = await knex('contest')
    .select('id', 'end_date')
    .where({ organization_type: organizationType, judged: true })
    .andWhere('end_date', '>=', startOfYear);
  const contestIds = contests
    .filter(c => new Date(c.end_date).getFullYear() === year)
    .map(c => c.id);

  // Si no hay concursos, validar consistencia de tablas vacías
  if (contestIds.length === 0) {
    const perfilesCount = await knex('profiles_ranking_category_section').count({ c: '*' }).first();
    const fotoclubsCount = await knex('fotoclub_ranking').count({ c: '*' }).first();
    const statOk = Number(perfilesCount?.c || perfilesCount?.count || 0) === 0 && Number(fotoclubsCount?.c || fotoclubsCount?.count || 0) === 0;
    return {
      stat: statOk,
      resumen: {
        anio: year,
        organization_type: organizationType,
        concursos_juzgados: 0,
        perfiles_validados: 0,
        fotoclubs_validados: 0,
        discrepancias_count: statOk ? 0 : 1,
        errores_integridad_count: 0,
        advertencias_count: statOk ? 0 : 1
      },
      discrepancias: statOk ? {} : { mensaje: 'No hay concursos del año pero las tablas de ranking no están vacías' },
      errores_integridad: [],
      advertencias: []
    };
  }

  // 2) Mapear inscripción (contest_id + profile_id -> category_id)
  const inscriptions = await knex('profile_contest')
    .select('contest_id', 'profile_id', 'category_id')
    .whereIn('contest_id', contestIds);
  const categoryMap = new Map();
  for (const pc of inscriptions) {
    const key = `${pc.contest_id}:${pc.profile_id}`;
    if (!categoryMap.has(key) && pc.category_id != null) {
      categoryMap.set(key, pc.category_id);
    }
  }

  // 3) Resultados del año, con joins
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

  // 4) Agregar esperado por perfil/categoría/sección (misma lógica de recálculo)
  const agregadosPerfiles = new Map(); // key: `${category_id}|${section_id}|${profile_id}`
  const perfilesIdsSet = new Set();
  for (const r of resultados) {
    const catKey = `${r.contest_id}:${r.profile_id}`;
    const categoryId = categoryMap.get(catKey);
    if (!categoryId) continue; // sin categoría, se omite
    const key = `${categoryId}|${r.section_id}|${r.profile_id}`;
    if (!agregadosPerfiles.has(key)) {
      agregadosPerfiles.set(key, {
        profile_id: r.profile_id,
        section_id: r.section_id,
        category_id: categoryId,
        sumatoria_puntos: 0,
        resumen_premios: {},
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
    agg.resumen_premios[prize] = (agg.resumen_premios[prize] || 0) + score;
    perfilesIdsSet.add(r.profile_id);
  }

  // 5) Datos auxiliares de perfiles y fotoclubs
  const perfilesIds = Array.from(perfilesIdsSet);
  const perfiles = perfilesIds.length
    ? await knex('profile').select('id', 'name', 'last_name', 'fotoclub_id').whereIn('id', perfilesIds)
    : [];
  const perfilesById = new Map(perfiles.map(p => [p.id, p]));

  const fotoclubs = await knex('fotoclub').select('id', 'name', 'mostrar_en_ranking');
  const fotoclubById = new Map(fotoclubs.map(f => [f.id, f]));

  // 6) Agregar esperado por fotoclub
  const agregadosFotoclub = new Map(); // fotoclub_id -> agg
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
    for (const [prize, val] of Object.entries(agg.resumen_premios)) {
      aggFc.resumen_premios[prize] = (aggFc.resumen_premios[prize] || 0) + (Number(val) || 0);
    }
  }

  // 7) Leer registros almacenados de ranking
  const registrosPerfiles = await knex('profiles_ranking_category_section')
    .select('id', 'profile_id', 'section_id', 'category_id', 'puntaje_temporada', 'score_total', 'prizes');
  const registrosFotoclub = await knex('fotoclub_ranking')
    .select('id', 'fotoclub_id', 'name', 'score', 'puntaje_temporada', 'prizes', 'porc_efectividad_anual');

  // Índices para comparaciones
  const storedPerfilByKey = new Map();
  const duplicatesPerfilKeys = new Set();
  for (const r of registrosPerfiles) {
    const key = `${r.category_id}|${r.section_id}|${r.profile_id}`;
    if (storedPerfilByKey.has(key)) duplicatesPerfilKeys.add(key);
    storedPerfilByKey.set(key, r);
  }

  const storedFotoclubById = new Map(registrosFotoclub.map(r => [r.fotoclub_id, r]));

  // 8) Comparaciones y recolección de discrepancias
  const discrepanciasProfiles = [];
  const discrepanciasFotoclubs = [];
  const erroresIntegridad = [];
  const advertencias = [];

  // Duplicados por perfil/categoría/sección
  for (const key of duplicatesPerfilKeys) {
    advertencias.push({ tipo: 'duplicado', detalle: `Registro duplicado en profiles_ranking_category_section para ${key}` });
  }

  // Comparar perfiles
  for (const [key, expected] of agregadosPerfiles.entries()) {
    const stored = storedPerfilByKey.get(key);
    if (!stored) {
      discrepanciasProfiles.push({
        profile_id: expected.profile_id,
        section_id: expected.section_id,
        category_id: expected.category_id,
        campo: 'missing',
        esperado: {
          puntaje_temporada: expected.sumatoria_puntos,
          score_total: expected.sumatoria_puntos,
          prizes: expected.resumen_premios
        },
        almacenado: null,
        detalle: 'Falta registro de ranking para el perfil/categoría/sección'
      });
      continue;
    }
    const prizesStored = parseJsonSafe(stored.prizes);
    // Puntajes
    if (Number(stored.score_total) !== Number(expected.sumatoria_puntos)) {
      discrepanciasProfiles.push({
        profile_id: expected.profile_id,
        section_id: expected.section_id,
        category_id: expected.category_id,
        campo: 'score_total',
        esperado: Number(expected.sumatoria_puntos),
        almacenado: Number(stored.score_total),
        detalle: 'La sumatoria de puntos no coincide con los resultados del año'
      });
    }
    if (Number(stored.puntaje_temporada) !== Number(expected.sumatoria_puntos)) {
      discrepanciasProfiles.push({
        profile_id: expected.profile_id,
        section_id: expected.section_id,
        category_id: expected.category_id,
        campo: 'puntaje_temporada',
        esperado: Number(expected.sumatoria_puntos),
        almacenado: Number(stored.puntaje_temporada),
        detalle: 'El puntaje de temporada no coincide con los resultados del año'
      });
    }
    // Premios JSON
    const keysPremios = new Set([...Object.keys(expected.resumen_premios), ...Object.keys(prizesStored)]);
    for (const k of keysPremios) {
      const vExp = Number(expected.resumen_premios[k] || 0);
      const vSto = Number(prizesStored[k] || 0);
      if (vExp !== vSto) {
        discrepanciasProfiles.push({
          profile_id: expected.profile_id,
          section_id: expected.section_id,
          category_id: expected.category_id,
          campo: `prizes.${k}`,
          esperado: vExp,
          almacenado: vSto,
          detalle: `Sumatoria de puntaje para premio '${k}' no coincide`
        });
      }
    }
  }

  // Perfiles almacenados sin esperado (sobrantes)
  for (const [key, stored] of storedPerfilByKey.entries()) {
    if (!agregadosPerfiles.has(key)) {
      advertencias.push({ tipo: 'sobrante', detalle: `Registro en ranking de perfil ${key} no tiene resultados asociados en el año` });
    }
  }

  // Comparar fotoclubs
  for (const [fcId, expected] of agregadosFotoclub.entries()) {
    const stored = storedFotoclubById.get(fcId);
    if (!stored) {
      discrepanciasFotoclubs.push({
        fotoclub_id: fcId,
        campo: 'missing',
        esperado: {
          puntaje_temporada: expected.sumatoria_puntos,
          score: expected.sumatoria_puntos,
          prizes: expected.resumen_premios,
          porc_efectividad_anual: {
            premiadas: expected.cant_premiadas,
            totales: expected.cant_presentadas,
            porcentaje: (expected.cant_presentadas > 0) ? (expected.cant_premiadas / (expected.cant_presentadas / 100)) : 0
          }
        },
        almacenado: null,
        detalle: 'Falta registro de ranking para el fotoclub'
      });
      continue;
    }
    if (Number(stored.score) !== Number(expected.sumatoria_puntos)) {
      discrepanciasFotoclubs.push({
        fotoclub_id: fcId,
        campo: 'score',
        esperado: Number(expected.sumatoria_puntos),
        almacenado: Number(stored.score),
        detalle: 'El puntaje total del fotoclub no coincide con la agregación de perfiles'
      });
    }
    if (Number(stored.puntaje_temporada) !== Number(expected.sumatoria_puntos)) {
      discrepanciasFotoclubs.push({
        fotoclub_id: fcId,
        campo: 'puntaje_temporada',
        esperado: Number(expected.sumatoria_puntos),
        almacenado: Number(stored.puntaje_temporada),
        detalle: 'El puntaje de temporada del fotoclub no coincide con la agregación de perfiles'
      });
    }
    const prizesStored = parseJsonSafe(stored.prizes);
    const keysPremiosFc = new Set([...Object.keys(expected.resumen_premios), ...Object.keys(prizesStored)]);
    for (const k of keysPremiosFc) {
      const vExp = Number(expected.resumen_premios[k] || 0);
      const vSto = Number(prizesStored[k] || 0);
      if (vExp !== vSto) {
        discrepanciasFotoclubs.push({
          fotoclub_id: fcId,
          campo: `prizes.${k}`,
          esperado: vExp,
          almacenado: vSto,
          detalle: `Sumatoria de puntaje por premio en fotoclub '${k}' no coincide`
        });
      }
    }
    // Efectividad
    const effStored = parseJsonSafe(stored.porc_efectividad_anual);
    const effExpected = (expected.cant_presentadas > 0) ? (expected.cant_premiadas / (expected.cant_presentadas / 100)) : 0;
    if (Number(effStored?.premiadas || 0) !== Number(expected.cant_premiadas)
      || Number(effStored?.totales || 0) !== Number(expected.cant_presentadas)) {
      advertencias.push({ tipo: 'efectividad', detalle: `Conteos de efectividad en fotoclub_id=${fcId} no coinciden` });
    }
    // Comparar porcentaje con tolerancia de redondeo
    const pctStored = Number(effStored?.porcentaje || 0);
    const tol = 0.0001;
    if (Math.abs(pctStored - effExpected) > tol) {
      advertencias.push({ tipo: 'efectividad', detalle: `Porcentaje de efectividad en fotoclub_id=${fcId} difiere (almacenado=${pctStored}, esperado=${effExpected})` });
    }
  }

  // Fotoclubs almacenados sin esperado (sobrantes)
  for (const [fcId, stored] of storedFotoclubById.entries()) {
    if (!agregadosFotoclub.has(fcId)) {
      advertencias.push({ tipo: 'sobrante', detalle: `Registro en ranking de fotoclub_id=${fcId} sin resultados asociados en el año` });
    }
  }

  // Integridad referencial básica
  for (const r of registrosPerfiles) {
    // profile/section/category deberían existir; si no, registrar error
    // Nota: se valida contra los mapas cargados; si no están presentes, marcamos advertencia.
    if (r.profile_id == null || r.section_id == null || r.category_id == null) {
      erroresIntegridad.push({ tipo: 'datos', detalle: `Campos nulos en profiles_ranking_category_section.id=${r.id}` });
    }
    const p = perfilesById.get(r.profile_id);
    if (!p) {
      advertencias.push({ tipo: 'referencia', detalle: `profile_id=${r.profile_id} no presente en resultados del año` });
    }
  }

  // Resumen
  const resumen = {
    anio: year,
    organization_type: organizationType,
    concursos_juzgados: contestIds.length,
    perfiles_validados: registrosPerfiles.length,
    fotoclubs_validados: registrosFotoclub.length,
    discrepancias_count: discrepanciasProfiles.length + discrepanciasFotoclubs.length,
    errores_integridad_count: erroresIntegridad.length,
    advertencias_count: advertencias.length
  };

  const hasErrors = (discrepanciasProfiles.length + discrepanciasFotoclubs.length) > 0 || erroresIntegridad.length > 0;
  const stat = strict ? !hasErrors : true;

  return {
    stat,
    resumen,
    discrepancias: includeDetails ? { profiles: discrepanciasProfiles, fotoclubs: discrepanciasFotoclubs } : undefined,
    errores_integridad: includeDetails ? erroresIntegridad : undefined,
    advertencias: includeDetails ? advertencias : undefined
  };
}

module.exports.validarRanking = validarRanking;