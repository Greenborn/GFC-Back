const { execSync } = require('child_process');

const scripts = [
  'test_concurso_creacion.js',
  'test_concurso_edicion.js',
  'test_concurso_borrado.js',
  'test_contest_list_simple.js',
  'test_contest_list.js',
  'test_ranking_detalle.js'
];

console.log('Ejecutando todos los tests de concursos...');
let allPassed = true;
for (const script of scripts) {
  try {
    console.log(`\n--- Ejecutando ${script} ---`);
    execSync(`node ${script}`, { stdio: 'inherit', cwd: __dirname });
  } catch (err) {
    console.error(`❌ Falló el test: ${script}`);
    allPassed = false;
  }
}
if (allPassed) {
  console.log('\n✅ Todos los tests pasaron correctamente.');
  process.exit(0);
} else {
  console.log('\n❌ Algún test falló.');
  process.exit(1);
}
