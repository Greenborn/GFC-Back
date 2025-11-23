// Script CLI para revisar métricas de la temporada actual
// Verifica que los scores en la tabla 'metric' coincidan con los valores definidos en 'metric_abm'
// Uso: node node_api/commands/revisar_metricas_temporada.js

// Cargar variables de entorno desde el directorio correcto
const path = require('path');
const dotenv = require('dotenv');
const envPath = path.join(__dirname, '..', '.env');
const config = dotenv.config({ path: envPath });

if (config.error) {
  console.error('⚠️  Error cargando archivo .env:', config.error.message);
  console.log('📍 Buscando en:', envPath);
}

// Verificar que las variables críticas estén cargadas
if (!process.env.DB_PASSWORD) {
  console.error('❌ ERROR: DB_PASSWORD no está definido en el archivo .env');
  process.exit(1);
}

require('../knexfile.js'); // inicializa global.knex
const fs = require('fs');

/**
 * Obtiene todos los concursos de la temporada actual (año actual)
 * @returns {Promise<Array>} Lista de concursos
 */
async function obtenerConcursosTemporada() {
  const añoActual = new Date().getFullYear();
  const fechaInicio = new Date(`${añoActual}-01-01`);
  
  console.log(`📅 Buscando concursos del año ${añoActual}...`);
  
  const concursos = await global.knex('contest')
    .where('end_date', '>', fechaInicio)
    .orderBy('end_date', 'desc');
  
  console.log(`✅ Encontrados ${concursos.length} concursos en la temporada ${añoActual}`);
  
  return concursos;
}

/**
 * Obtiene todas las métricas asociadas a un concurso
 * @param {number} contestId - ID del concurso
 * @returns {Promise<Array>} Lista de métricas con detalles
 */
async function obtenerMetricasConcurso(contestId) {
  const metricas = await global.knex('contest_result as cr')
    .join('metric as m', 'cr.metric_id', 'm.id')
    .where('cr.contest_id', contestId)
    .select(
      'm.id as metric_id',
      'm.prize',
      'm.score',
      'm.dni',
      'cr.contest_id',
      'cr.section_id',
      'cr.image_id'
    );
  
  return metricas;
}

/**
 * Obtiene la tabla de puntajes de referencia (metric_abm)
 * @param {string} organizationType - Tipo de organización del concurso
 * @returns {Promise<Object>} Mapa de premio -> puntaje
 */
async function obtenerPuntajesReferencia(organizationType = null) {
  let query = global.knex('metric_abm').select('prize', 'score', 'organization_type');
  
  if (organizationType) {
    query = query.where('organization_type', organizationType);
  }
  
  const puntajes = await query;
  
  // Crear un mapa para búsqueda rápida
  const mapa = {};
  puntajes.forEach(p => {
    const key = organizationType 
      ? `${p.prize}` 
      : `${p.prize}_${p.organization_type || 'default'}`;
    mapa[key] = p.score;
  });
  
  return { registros: puntajes, mapa };
}

/**
 * Verifica las métricas de un concurso contra la tabla de referencia
 * @param {Object} concurso - Datos del concurso
 * @param {Object} puntajesRef - Mapa de puntajes de referencia
 * @returns {Promise<Object>} Resultado de la verificación
 */
async function verificarMetricasConcurso(concurso, puntajesRef) {
  const metricas = await obtenerMetricasConcurso(concurso.id);
  
  const resultado = {
    concurso_id: concurso.id,
    concurso_nombre: concurso.name,
    end_date: concurso.end_date,
    organization_type: concurso.organization_type,
    total_metricas: metricas.length,
    correctas: 0,
    incorrectas: 0,
    no_encontradas: 0,
    errores: []
  };
  
  for (const metrica of metricas) {
    // Buscar el puntaje de referencia
    let puntajeEsperado = null;
    
    // Primero intentar con organization_type específico
    if (concurso.organization_type) {
      const key = `${metrica.prize}_${concurso.organization_type}`;
      puntajeEsperado = puntajesRef.mapa[key];
    }
    
    // Si no se encuentra, buscar sin organization_type o con default
    if (puntajeEsperado === null || puntajeEsperado === undefined) {
      const keyDefault = `${metrica.prize}_default`;
      puntajeEsperado = puntajesRef.mapa[keyDefault];
    }
    
    // Si aún no se encuentra, buscar solo por prize (compatibilidad)
    if (puntajeEsperado === null || puntajeEsperado === undefined) {
      const keySimple = metrica.prize;
      puntajeEsperado = puntajesRef.mapa[keySimple];
    }
    
    if (puntajeEsperado === null || puntajeEsperado === undefined) {
      resultado.no_encontradas++;
      resultado.errores.push({
        metric_id: metrica.metric_id,
        prize: metrica.prize,
        score_actual: metrica.score,
        tipo: 'no_encontrado',
        mensaje: `Premio '${metrica.prize}' no encontrado en metric_abm`
      });
    } else {
      // Comparar puntajes (convertir a número para comparación)
      const scoreActual = Number(metrica.score);
      const scoreEsperado = Number(puntajeEsperado);
      
      if (scoreActual === scoreEsperado) {
        resultado.correctas++;
      } else {
        resultado.incorrectas++;
        resultado.errores.push({
          metric_id: metrica.metric_id,
          prize: metrica.prize,
          score_actual: scoreActual,
          score_esperado: scoreEsperado,
          diferencia: scoreActual - scoreEsperado,
          tipo: 'score_incorrecto',
          mensaje: `Score incorrecto: esperado ${scoreEsperado}, encontrado ${scoreActual}`
        });
      }
    }
  }
  
  return resultado;
}

/**
 * Genera un resumen en formato JSON y lo guarda en archivo
 * @param {Object} resumen - Datos del resumen
 */
function generarReporteJSON(resumen) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const nombreArchivo = `reporte_metricas_${timestamp}.json`;
  const rutaArchivo = path.join(__dirname, '..', '..', nombreArchivo);
  
  fs.writeFileSync(rutaArchivo, JSON.stringify(resumen, null, 2));
  
  console.log(`\n📄 Reporte JSON generado: ${nombreArchivo}`);
  
  return nombreArchivo;
}

/**
 * Muestra el resumen en consola
 * @param {Object} resumen - Datos del resumen
 */
function mostrarResumenConsola(resumen) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN DE REVISIÓN DE MÉTRICAS DE TEMPORADA');
  console.log('='.repeat(80));
  console.log(`\n⏰ Fecha de ejecución: ${resumen.fecha_ejecucion}`);
  console.log(`📅 Año de temporada: ${resumen.año_temporada}`);
  console.log(`🏆 Total de concursos revisados: ${resumen.total_concursos}`);
  console.log(`📊 Total de métricas revisadas: ${resumen.total_metricas}`);
  console.log(`\n✅ Métricas correctas: ${resumen.total_correctas}`);
  console.log(`❌ Métricas incorrectas: ${resumen.total_incorrectas}`);
  console.log(`⚠️  Métricas no encontradas: ${resumen.total_no_encontradas}`);
  
  if (resumen.total_metricas > 0) {
    const porcentajeCorrectas = ((resumen.total_correctas / resumen.total_metricas) * 100).toFixed(2);
    console.log(`\n📈 Porcentaje de precisión: ${porcentajeCorrectas}%`);
  }
  
  console.log('\n' + '-'.repeat(80));
  console.log('DETALLE POR CONCURSO:');
  console.log('-'.repeat(80));
  
  resumen.concursos.forEach((concurso, index) => {
    console.log(`\n${index + 1}. ${concurso.concurso_nombre} (ID: ${concurso.concurso_id})`);
    console.log(`   Fecha fin: ${concurso.end_date}`);
    console.log(`   Tipo organización: ${concurso.organization_type || 'N/A'}`);
    console.log(`   Total métricas: ${concurso.total_metricas}`);
    console.log(`   ✅ Correctas: ${concurso.correctas}`);
    console.log(`   ❌ Incorrectas: ${concurso.incorrectas}`);
    console.log(`   ⚠️  No encontradas: ${concurso.no_encontradas}`);
    
    if (concurso.errores.length > 0) {
      console.log(`   \n   🔍 Errores encontrados (${concurso.errores.length}):`);
      concurso.errores.forEach((error, idx) => {
        console.log(`      ${idx + 1}. [${error.tipo}] ${error.mensaje}`);
        console.log(`         Metric ID: ${error.metric_id}, Prize: ${error.prize}`);
      });
    }
  });
  
  console.log('\n' + '='.repeat(80));
}

/**
 * Función principal
 */
async function main() {
  const inicioEjecucion = Date.now();
  
  console.log('🚀 Iniciando revisión de métricas de temporada...\n');
  
  try {
    // Verificar conexión a base de datos
    await global.knex.raw('SELECT 1');
    console.log('✅ Conexión a base de datos establecida\n');
    
    // Obtener concursos de la temporada
    const concursos = await obtenerConcursosTemporada();
    
    if (concursos.length === 0) {
      console.log('⚠️  No se encontraron concursos en la temporada actual');
      return {
        exito: true,
        mensaje: 'No hay concursos para revisar'
      };
    }
    
    // Obtener tabla de puntajes de referencia
    console.log('\n📖 Cargando tabla de puntajes de referencia (metric_abm)...');
    const puntajesRef = await obtenerPuntajesReferencia();
    console.log(`✅ Cargados ${puntajesRef.registros.length} registros de referencia\n`);
    
    // Inicializar resumen
    const resumen = {
      fecha_ejecucion: new Date().toISOString(),
      año_temporada: new Date().getFullYear(),
      total_concursos: concursos.length,
      total_metricas: 0,
      total_correctas: 0,
      total_incorrectas: 0,
      total_no_encontradas: 0,
      tiempo_ejecucion_ms: 0,
      concursos: []
    };
    
    // Procesar cada concurso
    console.log('🔍 Verificando métricas de cada concurso...\n');
    
    for (let i = 0; i < concursos.length; i++) {
      const concurso = concursos[i];
      console.log(`[${i + 1}/${concursos.length}] Procesando: ${concurso.name}...`);
      
      const resultado = await verificarMetricasConcurso(concurso, puntajesRef);
      
      resumen.concursos.push(resultado);
      resumen.total_metricas += resultado.total_metricas;
      resumen.total_correctas += resultado.correctas;
      resumen.total_incorrectas += resultado.incorrectas;
      resumen.total_no_encontradas += resultado.no_encontradas;
      
      console.log(`    ✓ ${resultado.total_metricas} métricas verificadas`);
    }
    
    // Calcular tiempo de ejecución
    resumen.tiempo_ejecucion_ms = Date.now() - inicioEjecucion;
    resumen.tiempo_ejecucion_segundos = (resumen.tiempo_ejecucion_ms / 1000).toFixed(2);
    
    // Mostrar resumen en consola
    mostrarResumenConsola(resumen);
    
    // Generar archivo JSON
    const nombreArchivo = generarReporteJSON(resumen);
    
    console.log(`\n⏱️  Tiempo de ejecución: ${resumen.tiempo_ejecucion_segundos} segundos`);
    console.log('\n✅ Proceso completado exitosamente\n');
    
    return {
      exito: true,
      resumen,
      archivo: nombreArchivo
    };
    
  } catch (error) {
    console.error('\n❌ ERROR durante la revisión:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    
    return {
      exito: false,
      error: error.message
    };
  }
}

// Ejecutar script
(async () => {
  try {
    const resultado = await main();
    process.exit(resultado.exito ? 0 : 1);
  } catch (err) {
    console.error('❌ ERROR FATAL:', err?.message || err);
    if (process.env.NODE_ENV === 'development') {
      console.error(err?.stack);
    }
    process.exit(1);
  } finally {
    try {
      await global.knex?.destroy?.();
      console.log('🔌 Conexión a base de datos cerrada');
    } catch (_) {}
  }
})();

module.exports = { main };
