#!/usr/bin/env node

/**
 * Script para probar el parsing de la estructura de judging
 * Simula la recepción de datos por parte del endpoint
 */

// Estructura de ejemplo con caracteres especiales
const estructuraEjemplo = {
  "BALCARCE 2025": {
    "Primera": {
      "Sub Sección": {
        "3er PREMIO": {
          "__files": ["1585_2025_52_Sub Sección_11865.jpg"]
        },
        "ACEPTADA": {
          "__files": [
            "4165_2025_52_Sub Sección_12100.jpg",
            "5953_2025_52_Sub Sección_12002.jpg"
          ]
        },
        "1er PREMIO": {
          "__files": ["1015_2025_52_Sub Sección_12104.jpg"]
        }
      },
      "Monocromo": {
        "3er PREMIO": {
          "__files": ["3077_2025_52_Monocromo_12043.jpg"]
        }
      },
      "Color": {
        "3er PREMIO": {
          "__files": ["6985_2025_52_Color_11810.jpg"]
        }
      }
    },
    "Estímulo": {
      "Sub Sección": {
        "3er PREMIO": {
          "__files": ["4604_2025_52_Sub Sección_11969.jpg"]
        }
      },
      "Monocromo": {
        "3er PREMIO": {
          "__files": ["9630_2025_52_Monocromo_11954.jpg"]
        }
      },
      "Color": {
        "3er PREMIO": {
          "__files": ["5806_2025_52_Color_11939.jpg"]
        }
      }
    }
  }
};

console.log('═══════════════════════════════════════════════════════');
console.log('TEST: Validación de estructura de judging');
console.log('═══════════════════════════════════════════════════════\n');

// 1. Verificar que la estructura existe y es un objeto
console.log('1. Verificando estructura...');
if (!estructuraEjemplo) {
  console.error('   ❌ ERROR: Estructura no definida');
  process.exit(1);
}
if (typeof estructuraEjemplo !== 'object' || Array.isArray(estructuraEjemplo)) {
  console.error('   ❌ ERROR: Estructura no es un objeto válido');
  process.exit(1);
}
console.log('   ✓ Estructura es válida\n');

// 2. Verificar concursos
const concursosKeys = Object.keys(estructuraEjemplo);
console.log('2. Concursos encontrados:');
console.log(`   Total: ${concursosKeys.length}`);
concursosKeys.forEach(key => console.log(`   - ${key}`));
console.log('');

// 3. Procesar la estructura (simulando el endpoint)
console.log('3. Procesando estructura...\n');
const resultados = [];
let totalArchivos = 0;

for (let nombreConcurso in estructuraEjemplo) {
  const concursoData = estructuraEjemplo[nombreConcurso];
  console.log(`   Concurso: ${nombreConcurso}`);
  
  for (const categoria in concursoData) {
    let categoriaNormalizada = categoria === 'Estmulo' ? 'Estimulo' : categoria;
    const categoriaData = concursoData[categoria];
    console.log(`     └─ Categoría: ${categoria} (normalizada: ${categoriaNormalizada})`);
    
    for (const seccion in categoriaData) {
      const seccionData = categoriaData[seccion];
      console.log(`        └─ Sección: ${seccion}`);
      
      for (const premio in seccionData) {
        const premioData = seccionData[premio];
        
        if (!premioData.__files || !Array.isArray(premioData.__files)) {
          console.log(`           └─ Premio: ${premio} - Sin archivos`);
          continue;
        }
        
        const archivos = premioData.__files;
        console.log(`           └─ Premio: ${premio} - ${archivos.length} archivo(s)`);
        totalArchivos += archivos.length;
        
        for (const archivo of archivos) {
          let nombreSinExtension = archivo.replace('.jpg', '').replace('Copia de ', '');
          let partes = nombreSinExtension.split('_');
          let id_usuario = partes[0];
          let anio = partes[1];
          let id_concurso = partes[2];
          let id_imagen = partes[partes.length - 1];
          let seccionArchivo = partes.slice(3, partes.length - 1).join('_');
          let code = nombreSinExtension;
          
          resultados.push({
            nombreConcurso,
            categoria: categoriaNormalizada,
            seccion,
            premio,
            archivo,
            id_usuario,
            anio,
            id_concurso,
            seccionArchivo,
            id_imagen,
            code
          });
        }
      }
    }
  }
}

console.log('\n4. Resultados del procesamiento:');
console.log(`   Total de archivos procesados: ${totalArchivos}`);
console.log(`   Total de resultados generados: ${resultados.length}\n`);

// Mostrar algunos ejemplos de resultados
console.log('5. Ejemplos de resultados extraídos:\n');
resultados.slice(0, 3).forEach((r, i) => {
  console.log(`   Resultado ${i + 1}:`);
  console.log(`     - Concurso: ${r.nombreConcurso}`);
  console.log(`     - Categoría: ${r.categoria}`);
  console.log(`     - Sección: ${r.seccion}`);
  console.log(`     - Premio: ${r.premio}`);
  console.log(`     - Code: ${r.code}`);
  console.log(`     - ID Usuario: ${r.id_usuario}`);
  console.log(`     - Año: ${r.anio}`);
  console.log(`     - ID Concurso: ${r.id_concurso}`);
  console.log(`     - ID Imagen: ${r.id_imagen}`);
  console.log('');
});

// 6. Serializar a JSON y volver a parsear (simula el envío HTTP)
console.log('6. Probando serialización JSON...');
try {
  const jsonString = JSON.stringify({ estructura: estructuraEjemplo });
  console.log(`   JSON String length: ${jsonString.length} bytes`);
  
  const parsed = JSON.parse(jsonString);
  console.log('   ✓ JSON parseado correctamente');
  console.log(`   ✓ Estructura recuperada con ${Object.keys(parsed.estructura).length} concurso(s)\n`);
} catch (error) {
  console.error('   ❌ ERROR al serializar/parsear JSON:', error.message);
  process.exit(1);
}

console.log('═══════════════════════════════════════════════════════');
console.log('✓ TEST COMPLETADO EXITOSAMENTE');
console.log('═══════════════════════════════════════════════════════');

// Generar comando curl de ejemplo
console.log('\n📝 COMANDO CURL DE EJEMPLO:\n');
console.log('Guardar la estructura en un archivo data.json y usar:\n');
console.log('curl -X POST https://gfc.api2.greenborn.com.ar/api/results/judging \\');
console.log('  -H "Authorization: Bearer TU_TOKEN" \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  --data @data.json\n');
