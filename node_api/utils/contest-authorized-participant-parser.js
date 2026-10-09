const { parse: csvParseSync } = require('csv-parse/sync');
const ExcelJS = require('exceljs');
const { PDFParse } = require('pdf-parse');
const { spawn } = require('child_process');

const MAX_ROWS = 5000;

const HEADER_ALIASES = {
  last_name: ['apellido', 'apellidos'],
  first_name: ['nombre', 'nombres'],
  dni: ['dni', 'documento', 'nro documento', 'n documento', 'numero de documento', 'nro de documento'],
  birth_date: ['f de nac', 'fecha de nacimiento', 'fecha nacimiento', 'nacimiento'],
  faculty: ['facultad'],
  discipline: ['disciplina']
};

function stripAccents(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normalizeHeader(h) {
  return stripAccents((h ?? '').toString())
    .replace(/\./g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizeDni(raw) {
  return (raw ?? '').toString().replace(/[.\s]/g, '').trim();
}

function looksLikeDni(normalized) {
  return /^\d{6,11}$/.test(normalized);
}

function buildColumnMap(headerRow) {
  const normalizedHeaders = headerRow.map(normalizeHeader);
  const columnMap = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const idx = normalizedHeaders.findIndex(h => aliases.includes(h));
    if (idx !== -1) columnMap[field] = idx;
  }
  if (columnMap.dni === undefined) {
    throw new Error('No se encontró una columna de DNI en el archivo');
  }
  return columnMap;
}

/** Arma filas finales {last_name, first_name, dni, ...} a partir de un getter por fila. */
function buildRowsFromGetter(dataRows, getField) {
  const rows = [];
  const seenDni = new Set();
  let skipped_no_dni = 0;
  let skipped_duplicate = 0;

  for (const dataRow of dataRows) {
    const dniRaw = getField(dataRow, 'dni');
    const dniNormalized = normalizeDni(dniRaw);

    if (!dniNormalized) {
      skipped_no_dni++;
      continue;
    }
    if (seenDni.has(dniNormalized)) {
      skipped_duplicate++;
      continue;
    }
    seenDni.add(dniNormalized);

    rows.push({
      last_name: getField(dataRow, 'last_name') || null,
      first_name: getField(dataRow, 'first_name') || null,
      dni: dniRaw,
      dni_normalized: dniNormalized,
      birth_date: getField(dataRow, 'birth_date') || null,
      faculty: getField(dataRow, 'faculty') || null,
      discipline: getField(dataRow, 'discipline') || null
    });
  }

  return {
    rows,
    stats: {
      total_rows: dataRows.length,
      valid_rows: rows.length,
      skipped_no_dni,
      skipped_duplicate
    }
  };
}

function cellToText(cell) {
  if (cell == null) return '';
  if (typeof cell === 'object') {
    if (cell instanceof Date) return cell.toLocaleDateString('es-AR');
    if ('text' in cell) return String(cell.text ?? '');
    if ('result' in cell) return String(cell.result ?? '');
  }
  return String(cell).trim();
}

function parseCsvBuffer(buffer) {
  const text = buffer.toString('utf8').replace(/^﻿/, '');
  return csvParseSync(text, {
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true
  });
}

async function parseXlsxBuffer(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];
  const rows = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const values = row.values.slice(1).map(cellToText);
    if (values.some(v => v !== '')) rows.push(values);
  });
  return rows;
}

function parseMatrixMimeFormat(matrix) {
  if (!matrix || matrix.length === 0) {
    throw new Error('El archivo no contiene datos para importar');
  }
  if (matrix.length - 1 > MAX_ROWS) {
    throw new Error(`El archivo supera el máximo de ${MAX_ROWS} filas admitidas`);
  }
  const [headerRow, ...dataRows] = matrix;
  const columnMap = buildColumnMap(headerRow);
  return buildRowsFromGetter(dataRows, (row, field) => {
    const idx = columnMap[field];
    return idx !== undefined ? (row[idx] ?? '').toString().trim() : '';
  });
}

/**
 * Extrae texto preservando el espaciado de columnas con el binario `pdftotext`
 * (poppler-utils, `-layout`). Devuelve null si el binario no está disponible o falla,
 * para caer en el fallback puramente JS (parsePdfTextWithPdfJs).
 */
function parsePdfTextWithPoppler(buffer) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn('pdftotext', ['-layout', '-', '-']);
    } catch {
      return resolve(null);
    }
    const stdoutChunks = [];
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    child.on('error', () => finish(null)); // binario no instalado
    child.stdout.on('data', (chunk) => stdoutChunks.push(chunk));
    child.on('close', (code) => {
      const text = Buffer.concat(stdoutChunks).toString('utf8');
      finish(code === 0 && text.trim() !== '' ? text : null);
    });

    child.stdin.on('error', () => {}); // evita crash si el proceso ya cerró stdin
    child.stdin.write(buffer);
    child.stdin.end();
  });
}

async function parsePdfTextWithPdfJs(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

/**
 * Localiza, dentro de la línea de encabezado cruda (sin dividir por espacios), la
 * posición de caracter donde empieza cada campo reconocido (según HEADER_ALIASES).
 * Devuelve los campos ordenados por posición ascendente.
 */
function findHeaderFieldPositions(headerLine) {
  const normalized = stripAccents(headerLine).toLowerCase().replace(/\./g, ' ');
  const found = [];
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    for (const alias of aliases) {
      const re = new RegExp(`\\b${alias.split(' ').join('\\s+')}\\b`);
      const m = re.exec(normalized);
      if (m) {
        found.push({ field, start: m.index });
        break;
      }
    }
  }
  found.sort((a, b) => a.start - b.start);
  return found;
}

/**
 * Parsea un PDF de "tabla simple" (una fila de texto por participante, columnas
 * alineadas por posición, sin líneas de grilla) ubicando cada columna por la posición
 * de su encabezado y recortando esa misma franja de caracteres en cada fila de datos.
 * Es best-effort: si el recorte no produce DNIs con forma plausible, se considera que
 * el PDF no tiene un formato tabular reconocible y se aborta con error explícito en
 * vez de importar datos corridos/incorrectos silenciosamente.
 */
function parsePdfRows(text) {
  const lines = text.split('\n').map(l => l.replace(/\s+$/, '')).filter(l => l.trim() !== '');
  if (lines.length === 0) {
    throw new Error('El archivo no contiene datos para importar');
  }

  // Busca la primera línea que reconozca al menos la columna DNI y otro campo más,
  // para no confundir un título de página/hoja (ej. "test_pdf", "Página 1") con el
  // encabezado real de la tabla.
  let headerIdx = -1;
  let fields = [];
  for (let i = 0; i < lines.length; i++) {
    const candidate = findHeaderFieldPositions(lines[i]);
    if (candidate.some(f => f.field === 'dni') && candidate.length >= 2) {
      headerIdx = i;
      fields = candidate;
      break;
    }
  }
  if (headerIdx === -1) {
    throw new Error('No se encontró una columna de DNI en el archivo');
  }
  const dataLines = lines.slice(headerIdx + 1);

  if (dataLines.length > MAX_ROWS) {
    throw new Error(`El archivo supera el máximo de ${MAX_ROWS} filas admitidas`);
  }

  const sliceRow = (line) => {
    const values = {};
    for (let i = 0; i < fields.length; i++) {
      const start = fields[i].start;
      const end = i + 1 < fields.length ? fields[i + 1].start : line.length;
      values[fields[i].field] = line.slice(start, end).trim();
    }
    return values;
  };

  const result = buildRowsFromGetter(dataLines.map(sliceRow), (row, field) => row[field] ?? '');

  const plausibleDniCount = result.rows.filter(r => looksLikeDni(r.dni_normalized)).length;
  if (result.rows.length > 0 && plausibleDniCount === 0) {
    throw new Error(
      'No se pudo reconocer la estructura de columnas del PDF (los DNI extraídos no tienen un formato válido). ' +
      'Exporte el listado como CSV o XLSX, o verifique que el PDF tenga un formato de tabla simple con columnas alineadas.'
    );
  }

  return result;
}

async function parsePdfBuffer(buffer) {
  const text = (await parsePdfTextWithPoppler(buffer)) ?? (await parsePdfTextWithPdfJs(buffer));
  return parsePdfRows(text);
}

function detectFormat(originalFilename, mimetype) {
  const ext = (originalFilename || '').split('.').pop().toLowerCase();
  if (ext === 'csv') return 'csv';
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx';
  if (ext === 'pdf') return 'pdf';
  if ((mimetype || '').includes('csv')) return 'csv';
  if ((mimetype || '').includes('sheet') || (mimetype || '').includes('excel')) return 'xlsx';
  if ((mimetype || '').includes('pdf')) return 'pdf';
  throw new Error('Formato de archivo no soportado. Use CSV, XLSX o PDF');
}

async function parseAuthorizedParticipantsFile(buffer, originalFilename, mimetype) {
  const format = detectFormat(originalFilename, mimetype);

  if (format === 'pdf') {
    return parsePdfBuffer(buffer);
  }

  const matrix = format === 'csv' ? parseCsvBuffer(buffer) : await parseXlsxBuffer(buffer);
  return parseMatrixMimeFormat(matrix);
}

module.exports = { parseAuthorizedParticipantsFile, normalizeDni };
