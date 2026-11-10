import { applyCase } from './text.js'
import { normalizeDate } from './dates.js'
import { DOC_TYPES, effectiveDocType, formatDocument } from './documents.js'

export function generateCertificateCode() {
  const cryptoApi = globalThis.crypto
  if (!cryptoApi) {
    throw new Error('Este navegador no permite generar códigos de certificado seguros.')
  }
  let uuid
  if (cryptoApi.randomUUID) {
    uuid = cryptoApi.randomUUID()
  } else if (cryptoApi.getRandomValues) {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
    uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  } else {
    throw new Error('Este navegador no permite generar códigos de certificado seguros.')
  }
  return `CERT-${uuid.toUpperCase()}`
}

// Un registro sin código recibe uno estable durante toda la sesión.
const GENERATED_CODES = new WeakMap()

function codeFor(record) {
  const existing = String(record?.codigo ?? '').trim()
  if (existing) return existing

  if (record && typeof record === 'object') {
    let code = GENERATED_CODES.get(record)
    if (!code) {
      code = generateCertificateCode()
      GENERATED_CODES.set(record, code)
    }
    return code
  }

  return generateCertificateCode()
}

/** Aplica mayúsculas, tipo y formato de documento según las opciones. */
export function resolveRecord(record, opts = {}) {
  const nombre = applyCase(record.nombre, opts.caseMode)
  const apellido = applyCase(record.apellido, opts.caseMode)
  const docType = effectiveDocType(record, opts)
  const docDisplay = formatDocument(record.docNumber, docType, { dots: opts.docDots !== false })
  const rule = DOC_TYPES[docType] || DOC_TYPES.OTRO
  return {
    nombre,
    apellido,
    fullName: [nombre, apellido].filter(Boolean).join(' '),
    docType,
    docDisplay,
    docLine:
      opts.showDocument !== false && docDisplay
        ? `${rule.short} N° ${docDisplay}`
        : '',
    course: String(record.curso ?? '').trim(),
    hours: String(record.horas ?? '').trim(),
    instructor: String(record.instructor ?? '').trim(),
    date: normalizeDate(record.fecha || opts.date || ''),
    code: codeFor(record),
  }
}

const safe = (s) => String(s).replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '')
const MAX_FILE_BASE_LENGTH = 120

export const FILENAME_FORMATS = [
  { id: 'nombre-apellido', label: 'Nombre_Apellido' },
  { id: 'apellido-nombre', label: 'Apellido_Nombre' },
  { id: 'apellido-nombre-doc', label: 'Apellido_Nombre_Documento' },
]

/**
 * Devuelve un nombre libre dentro del conjunto `used` y lo registra.
 * La comparación es insensible a mayúsculas para evitar colisiones en
 * Windows/macOS (por ejemplo, "Pérez" y "PÉREZ").
 */
export function allocateUniqueFileName(base, used) {
  const normalize = (name) => name.toLocaleLowerCase('es')
  let candidate = base
  let suffix = 2
  while (used.has(normalize(candidate))) {
    candidate = `${base}_${suffix}`
    suffix += 1
  }
  used.add(normalize(candidate))
  return candidate
}

/** Nombre de archivo (sin extensión). */
export function buildFileName(view, record, format = 'nombre-apellido') {
  let parts
  if (format === 'apellido-nombre') parts = [view.apellido, view.nombre]
  else if (format === 'apellido-nombre-doc') parts = [view.apellido, view.nombre, record.docNumber]
  else parts = [view.nombre, view.apellido]
  const body = (safe(parts.filter(Boolean).join(' ')) || 'sin_nombre').slice(
    0,
    MAX_FILE_BASE_LENGTH,
  )
  return `Certificado_${body}`
}