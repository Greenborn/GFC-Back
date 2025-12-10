const fs = require('fs');
const path = require('path');

function loadEnv() {
  const candidates = [path.resolve(__dirname, '..', '.env'), path.resolve(__dirname, '..', '..', '.env')];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      require('dotenv').config({ path: p });
      break;
    }
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith('--')) {
      const eq = t.indexOf('=');
      if (eq !== -1) {
        args[t.substring(2, eq)] = t.substring(eq + 1);
      } else {
        const k = t.substring(2);
        const n = argv[i + 1];
        if (n && !n.startsWith('--')) { args[k] = n; i++; } else { args[k] = true; }
      }
    }
  }
  return args;
}

function normalizeText(s) {
  return (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function sanitizeNamePart(s) {
  const base = (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return base.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

async function validateStructure(baseDir, year, verbose) {
  const compiledDir = path.join(baseDir, 'compilado_premiadas');
  const exists = fs.existsSync(compiledDir);
  if (!exists) {
    console.error(`No existe: ${compiledDir}`);
    process.exit(2);
  }
  const categories = fs.readdirSync(compiledDir).filter(d => fs.lstatSync(path.join(compiledDir, d)).isDirectory());
  const result = {
    categories: new Set(),
    sections: new Set(),
    prizes: new Set(),
    files: 0,
    mismatches: []
  };

  for (const catDirName of categories) {
    const catDir = path.join(compiledDir, catDirName);
    const sections = fs.readdirSync(catDir).filter(d => fs.lstatSync(path.join(catDir, d)).isDirectory());
    for (const secDirName of sections) {
      const secDir = path.join(catDir, secDirName);
      const prizes = fs.readdirSync(secDir).filter(d => fs.lstatSync(path.join(secDir, d)).isDirectory());
      for (const prizeDirName of prizes) {
        const prizeDir = path.join(secDir, prizeDirName);
        const files = fs.readdirSync(prizeDir).filter(f => fs.lstatSync(path.join(prizeDir, f)).isFile());
        for (const fileName of files) {
          result.files++;
          result.categories.add(catDirName);
          result.sections.add(secDirName);
          result.prizes.add(prizeDirName);
          const ext = path.extname(fileName);
          const code = path.basename(fileName, ext);
          const row = await global.knex('contest_result as cr')
            .leftJoin('image as i', 'cr.image_id', 'i.id')
            .leftJoin('metric as m', 'cr.metric_id', 'm.id')
            .leftJoin('section as s', 'cr.section_id', 's.id')
            .leftJoin('contest as c', 'cr.contest_id', 'c.id')
            .leftJoin('profile_contest as pc', function() { this.on('i.profile_id', '=', 'pc.profile_id').andOn('c.id', '=', 'pc.contest_id'); })
            .leftJoin('category as cat', 'pc.category_id', 'cat.id')
            .select('i.id as image_id', 'i.code as image_code', 'm.prize as prize', 's.name as section_name', 'cat.name as category_name', 'c.end_date')
            .where('i.code', code)
            .modify(q => {
              if (year) {
                const startBound = `${year}-01-01 00:00:00`;
                const endBound = `${year}-12-31 23:59:59`;
                q.andWhereBetween('c.end_date', [startBound, endBound]);
              }
            })
            .orderBy('c.end_date', 'desc')
            .first();
          const catOk = row && sanitizeNamePart(row.category_name || '') === catDirName;
          const secOk = row && sanitizeNamePart(row.section_name || '') === secDirName;
          const prizeOk = row && sanitizeNamePart(row.prize || '') === prizeDirName;
          if (verbose) {
            console.log(JSON.stringify({ path: path.join(prizeDir, fileName), code, category_dir: catDirName, section_dir: secDirName, prize_dir: prizeDirName, category_db: row?.category_name || null, section_db: row?.section_name || null, prize_db: row?.prize || null, ok: !!(catOk && secOk && prizeOk) }));
          }
          if (!(catOk && secOk && prizeOk)) {
            result.mismatches.push({ file: path.join(prizeDir, fileName), code, category_dir: catDirName, section_dir: secDirName, prize_dir: prizeDirName, category_db: row?.category_name || null, section_db: row?.section_name || null, prize_db: row?.prize || null });
          }
        }
      }
    }
  }
  return result;
}

async function main() {
  loadEnv();
  require('../knexfile.js');
  const argv = parseArgs(process.argv.slice(2));
  const year = argv.year ? parseInt(argv.year, 10) : null;
  const verbose = !!(argv.verbose || argv.v);
  const baseDir = process.env.IMG_REPOSITORY_PATH || '/var/www/GFC-PUBLIC-ASSETS';
  try {
    await global.knex.raw('SELECT 1');
    const r = await validateStructure(baseDir, year, verbose);
    console.log(`Categorías: ${Array.from(r.categories).length}`);
    console.log(`Secciones: ${Array.from(r.sections).length}`);
    console.log(`Premios: ${Array.from(r.prizes).length}`);
    console.log(`Fotografías: ${r.files}`);
    console.log(`Inconsistencias: ${r.mismatches.length}`);
    if (r.mismatches.length) {
      console.log(JSON.stringify(r.mismatches, null, 2));
      process.exitCode = 1;
    } else {
      process.exitCode = 0;
    }
  } catch (err) {
    console.error(err?.message || err);
    if (process.env.NODE_ENV === 'development') { console.error(err?.stack); }
    process.exitCode = 2;
  } finally {
    try { await global.knex?.destroy?.(); } catch (_) {}
  }
}

if (require.main === module) {
  main();
}
