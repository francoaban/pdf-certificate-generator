import * as XLSX from 'xlsx'
import { normalizeText } from './text.js'
import { normalizeDate } from './dates.js'
import { cleanDocument, parseDocType } from './documents.js'
import { generateCertificateCode } from './records.js'

const NAME_KEYS = ['nombre', 'nombres', 'name', 'first name', 'firstname', 'given name']
const LAST_KEYS = ['apellido', 'apellidos', 'last name', 'lastname', 'surname', 'family name']
const DOC_TYPE_KEYS = ['tipo documento', 'tipo de documento', 'tipo doc', 'tipo de doc']
const COURSE_KEYS = [
  'curso',
  'course',
  'capacitacion',
  'formacion',
  'nombre del curso',
  'nombre curso',
  'nombre del taller',
  'nombre del evento',
]
const HOURS_KEYS = ['horas', 'hora', 'hours', 'hour', 'duracion']
const DATE_KEYS = ['fecha', 'fecha de emision', 'date', 'date issued']
const INSTRUCTOR_KEYS = ['instructor', 'docente', 'formador', 'facilitador']
const CODE_KEYS = [
  'codigo',
  'codigo certificado',
  'codigo de certificado',
  'codigo unico',
  'code',
  'certificate code',
  'certificate id',
  'id certificado',
]
const DOC_KEYS = [
  'dni', 'd n i', 'doc', 'documento', 'nro documento', 'nro de documento', 'numero de documento',
  'numero documento', 'n documento', 'num documento', 'nro doc', 'nro de doc', 'nro dni'
]

function detectColumn(headers, exactKeys, partials = []) {
  return (
    headers.find((h) => exactKeys.includes(normalizeText(h))) ||
    headers.find((h) => partials.some((p) => normalizeText(h).includes(p)))
  )
}

export async function readWorkbook(file) {
  const buffer = await file.arrayBuffer()
  if (/\.csv$/i.test(file.name || '') || /^text\/csv(?:;|$)/i.test(file.type || '')) {
    const bytes = new Uint8Array(buffer)
    let csv

    if (bytes[0] === 0xff && bytes[1] === 0xfe) {
      csv = new TextDecoder('utf-16le').decode(bytes.subarray(2))
    } else if (bytes[0] === 0xfe && bytes[1] === 0xff) {
      csv = new TextDecoder('utf-16be').decode(bytes.subarray(2))
    } else {
      try {
        csv = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
      } catch {
        csv = new TextDecoder('windows-1252').decode(bytes)
      }
    }

    return XLSX.read(csv, { type: 'string' })
  }
  return XLSX.read(buffer, { type: 'array' })
}

/**
 * @returns {{ records, columns: { nameKey, lastKey, docKey, docTypeKey }, usedFallback }}
 */
export function parseSheet(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })
  if (!rows.length) throw new Error(`La hoja «${sheetName}» no contiene registros.`)

  const headers = Object.keys(rows[0])
  const docTypeKey = detectColumn(headers, DOC_TYPE_KEYS, ['tipo de doc', 'tipo doc']) || null
  const docKey =
    detectColumn(
      headers.filter((h) => h !== docTypeKey),
      DOC_KEYS,
      ['dni', 'documento']
    ) || null
  const courseKey =
    detectColumn(headers, COURSE_KEYS, ['del curso', 'taller', 'capacitacion', 'formacion']) || null
  const hoursKey = detectColumn(headers, HOURS_KEYS) || null
  const dateKey = detectColumn(headers, DATE_KEYS) || null
  const instructorKey = detectColumn(headers, INSTRUCTOR_KEYS) || null
  const codeKey = detectColumn(headers, CODE_KEYS) || null

  const metadataKeys = [docKey, docTypeKey, courseKey, hoursKey, dateKey, instructorKey, codeKey]
  const nameCandidates = headers.filter((h) => !metadataKeys.includes(h))

  let nameKey = detectColumn(nameCandidates, NAME_KEYS, ['nombre'])
  let lastKey = detectColumn(nameCandidates, LAST_KEYS, ['apellido'])
  let usedFallback = false

  if (!nameKey || !lastKey) {
    usedFallback = true
    const candidates = nameCandidates.filter((h) => ![nameKey, lastKey].includes(h))
    nameKey = nameKey || candidates.shift()
    lastKey = lastKey || candidates.shift() || null
  }

  const records = rows
    .map((row, i) => {
      const docType = docTypeKey ? parseDocType(row[docTypeKey]) : null
      return {
        id: i,
        nombre: String(row[nameKey] ?? '').trim(),
        apellido: lastKey ? String(row[lastKey] ?? '').trim() : '',
        docType, // null = se decide automáticamente / según el panel
        docNumber: docKey ? cleanDocument(row[docKey], docType) : '',
        curso: courseKey ? String(row[courseKey] ?? '').trim() : '',
        horas: hoursKey ? String(row[hoursKey] ?? '').trim() : '',
        fecha: dateKey ? normalizeDate(row[dateKey]) : '',
        instructor: instructorKey ? String(row[instructorKey] ?? '').trim() : '',
        codigo: codeKey ? String(row[codeKey] ?? '').trim() : '',
      }
    })
    .filter((r) => r.nombre || r.apellido)

  if (!records.length) throw new Error('No se encontraron nombres válidos en el archivo.')

  // Los códigos repetidos no bloquean la importación: se marcan en la tabla
  // para que el usuario los corrija o los regenere.
  records.forEach((record) => {
    if (!record.codigo) record.codigo = generateCertificateCode()
  })

  return {
    records,
    columns: { nameKey, lastKey, docKey, docTypeKey, courseKey, hoursKey, dateKey, instructorKey, codeKey },
    usedFallback,
  }
}

export function downloadTemplate() {
  const rows = [
    [
      'Nombre', 'Apellido', 'Tipo de documento', 'Documento',
      'Curso', 'Horas', 'Fecha', 'Instructor', 'Código',
    ],
    ['Juan', 'Pérez', 'DNI', '12345678', 'Primeros auxilios', '12', '8 de noviembre de 2026', 'Ana Gómez', ''],
    ['María', 'Gómez', 'DNI', '30123456', 'Primeros auxilios', '12', '8 de noviembre de 2026', 'Ana Gómez', ''],
    ['Ana', 'Souza', 'Pasaporte', 'FA123456', 'Excel inicial', '8', '9 de noviembre de 2026', 'Tomás Díaz', ''],
    ['Carlos', 'Mamani', 'DNI extranjero', '93456789', 'Excel inicial', '8', '9 de noviembre de 2026', 'Tomás Díaz', ''],
  ]
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [
    { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 16 },
    { wch: 24 }, { wch: 8 }, { wch: 22 }, { wch: 20 }, { wch: 28 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Participantes')
  XLSX.writeFile(wb, 'plantilla_certificados.xlsx')
}