const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
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

  let outputPath = argv.output;
  if (!outputPath) {
    const baseDir = process.env.OUTPUT_DIR || path.join(process.cwd(), 'output');
    outputPath = path.join(baseDir, `concursantes_interno_${year}.csv`);
  }

  try {
    const requiredEnv = ['DB_CLIENT', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    for (const k of requiredEnv) {
      if (!process.env[k] || typeof process.env[k] !== 'string') {
        console.error(`Configuración faltante o inválida: ${k}. Verifique ${path.resolve(__dirname, '..', '.env')}`);
        process.exit(1);
      }
    }

    await global.knex.raw('SELECT 1');

    const q = global.knex('profile_contest as pc')
      .join('contest as c', 'pc.contest_id', 'c.id')
      .join('profile as p', 'pc.profile_id', 'p.id')
      .leftJoin('user as u', 'u.profile_id', 'p.id')
      .leftJoin('fotoclub as fc', 'fc.id', 'p.fotoclub_id')
      .where('c.organization_type', 'INTERNO')
      .andWhere(function () {
        this.whereRaw('EXTRACT(YEAR FROM c.start_date) = ?', [year])
            .orWhereRaw('EXTRACT(YEAR FROM c.end_date) = ?', [year]);
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

    const rows = await q;

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