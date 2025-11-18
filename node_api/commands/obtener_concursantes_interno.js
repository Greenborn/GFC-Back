const fs = require('fs');
const path = require('path');

let ENV_PATH_USED = null;
(function loadEnv() {
  const candidates = [
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '..', '..', '.env')
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      require('dotenv').config({ path: p });
      if (process.env.DB_CLIENT || process.env.DB_HOST || process.env.DB_NAME) {
        ENV_PATH_USED = p;
        break;
      }
    }
  }
})();
require('../knexfile.js');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const eqIndex = token.indexOf('=');
      if (eqIndex !== -1) {
        const key = token.substring(2, eqIndex);
        const value = token.substring(eqIndex + 1);
        args[key] = value;
      } else {
        const key = token.substring(2);
        const next = argv[i + 1];
        if (next && !next.startsWith('--')) {
          args[key] = next;
          i++;
        } else {
          args[key] = true;
        }
      }
    }
  }
  return args;
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function toCsv(rows, headersOrder) {
  const header = headersOrder.join(',');
  const lines = rows.map(row => headersOrder.map(h => csvEscape(row[h])).join(','));
  return [header, ...lines].join('\n');
}

async function main() {
  const argv = parseArgs(process.argv.slice(2));
  const now = new Date();
  const year = parseInt(argv.year || now.getFullYear(), 10);
  const startBound = `${year}-01-01 00:00:00`;
  const endBound = `${year}-12-31 23:59:59`;
  const limit = argv.limit ? parseInt(argv.limit, 10) : null;
  const verbose = !!(argv.verbose || argv.v);

  let outputPath = argv.output;
  if (!outputPath) {
    const baseDir = process.env.OUTPUT_DIR || path.join(process.cwd(), 'output');
    outputPath = path.join(baseDir, `concursantes_interno_${year}.csv`);
  }

  try {
    const requiredEnv = ['DB_CLIENT', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    for (const k of requiredEnv) {
      if (!process.env[k] || typeof process.env[k] !== 'string') {
        console.error(`Configuración faltante o inválida: ${k}. Verifique ${ENV_PATH_USED || path.resolve(__dirname, '..', '.env')}`);
        process.exit(1);
      }
    }

    if (argv['check-env'] || argv.checkEnv) {
      const mask = v => typeof v === 'string' ? v.replace(/.(?=.{2})/g, '*') : v;
      const summary = {
        DB_CLIENT: process.env.DB_CLIENT,
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        DB_USER: process.env.DB_USER,
        DB_PASSWORD: mask(process.env.DB_PASSWORD || ''),
        DB_NAME: process.env.DB_NAME,
        ENV_PATH: ENV_PATH_USED
      };
      console.log(JSON.stringify(summary, null, 2));
      process.exit(0);
    }

    if (verbose) console.log(`[${new Date().toISOString()}] Verificando conexión a la base...`);
    await global.knex.raw('SELECT 1');
    if (verbose) console.log(`[${new Date().toISOString()}] Conexión OK. Ejecutando consulta (${year})...`);

    const q = global.knex('profile_contest as pc')
      .join('contest as c', 'pc.contest_id', 'c.id')
      .join('profile as p', 'pc.profile_id', 'p.id')
      .leftJoin('user as u', 'u.profile_id', 'p.id')
      .leftJoin('fotoclub as fc', 'fc.id', 'p.fotoclub_id')
      .where('c.organization_type', 'INTERNO')
      .andWhere(function () {
        this.whereBetween('c.start_date', [startBound, endBound])
            .orWhereBetween('c.end_date', [startBound, endBound]);
      })
      .select(
        'p.id as profile_id',
        'p.name as nombre',
        'p.last_name as apellido',
        'u.email as email',
        'u.dni as dni',
        'p.fotoclub_id as fotoclub_id',
        'fc.name as fotoclub',
        'p.img_url as img_url',
        'p.executive as ejecutivo',
        'p.executive_rol as rol_ejecutivo',
        'u.status as estado',
        'u.created_at as fecha_registro'
      )
      .orderBy('p.name', 'asc')
      .orderBy('p.last_name', 'asc');

    if (limit && Number.isFinite(limit) && limit > 0) {
      q.limit(limit);
    }

    const rows = await q;
    if (verbose) console.log(`[${new Date().toISOString()}] Consulta completada. Filas: ${rows.length}. Procesando...`);

    const uniqueMap = new Map();
    for (const r of rows) {
      if (!uniqueMap.has(r.profile_id)) {
        uniqueMap.set(r.profile_id, r);
      }
    }
    const unique = Array.from(uniqueMap.values());

    const headers = [
      'profile_id',
      'nombre',
      'apellido',
      'email',
      'dni',
      'fotoclub',
      'fotoclub_id',
      'img_url',
      'ejecutivo',
      'rol_ejecutivo',
      'fecha_registro',
      'estado'
    ];

    const dir = path.dirname(outputPath);
    fs.mkdirSync(dir, { recursive: true });

    const csv = toCsv(unique, headers);
    fs.writeFileSync(outputPath, csv, 'utf8');

    if (verbose) console.log(`[${new Date().toISOString()}] CSV escrito.`);
    console.log(`OK: ${unique.length} concursantes únicos exportados para ${year}`);
    console.log(`Archivo: ${outputPath}`);
    process.exit(0);
  } catch (err) {
    console.error('ERROR al obtener concursantes INTERNO:', err?.message || err);
    if (process.env.NODE_ENV === 'development') {
      console.error(err?.stack);
    }
    process.exit(1);
  } finally {
    try { await global.knex?.destroy?.(); } catch (_) {}
  }
}

if (require.main === module) {
  main();
}