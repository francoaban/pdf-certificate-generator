import { normalizeText } from './text.js'

export const DOC_TYPES = {
  DNI: { label: 'DNI', short: 'DNI', kind: 'digits', min: 7, max: 8, dots: true },
  DNI_EXT: { label: 'DNI extranjero', short: 'DNI', kind: 'digits', min: 8, max: 8, dots: true },
  PASAPORTE: { label: 'Pasaporte', short: 'Pasaporte', kind: 'alnum', min: 6, max: 9 },
  CI: { label: 'Cédula de identidad', short: 'C.I.', kind: 'digits', min: 5, max: 10, dots: true },
  LE: { label: 'Libreta de enrolamiento', short: 'L.E.', kind: 'digits', min: 6, max: 8, dots: true },
  LC: { label: 'Libreta cívica', short: 'L.C.', kind: 'digits', min: 6, max: 8, dots: true },
  CUIL: { label: 'CUIL / CUIT', short: 'CUIL', kind: 'digits', min: 11, max: 11 },
  OTRO: { label: 'Otro documento', short: 'Doc.', kind: 'free' },
}

export const DOC_TYPE_IDS = Object.keys(DOC_TYPES)

// Interpreta el texto de una columna "Tipo de documento"
export function parseDocType(value) {
  const n = normalizeText(value)
  if (!n) return null
  if (['dni', 'd n i', 'documento nacional de identidad'].includes(n)) return 'DNI'
  if (n.includes('extranj')) return 'DNI_EXT'
  if (n.includes('pasaporte') || n.includes('passport') || n === 'pas') return 'PASAPORTE'
  if (['ci', 'c i', 'cedula', 'cedula de identidad'].includes(n)) return 'CI'
  if (['le', 'l e', 'libreta de enrolamiento'].includes(n)) return 'LE'
  if (['lc', 'l c', 'libreta civica'].includes(n)) return 'LC'
  if (n.includes('cuil') || n.includes('cuit')) return 'CUIL'
  return 'OTRO'
}

// Adivina el tipo a partir del número ya limpio.
// No se infiere "DNI extranjero" por rango: la numeración puede solaparse.
// Para extranjeros conviene traer la columna "Tipo de documento" explícita.
export function guessDocType(clean) {
  if (!clean) return 'DNI'
  if (/[A-Z]/i.test(clean)) return 'PASAPORTE'
  if (/^\d{11}$/.test(clean)) return 'CUIL'
  return 'DNI'
}

export function effectiveDocType(record, opts = {}) {
  if (record.docType && DOC_TYPES[record.docType]) return record.docType
  const forced = opts.defaultDocType
  return forced && forced !== 'auto' && DOC_TYPES[forced]
    ? forced
    : guessDocType(record.docNumber)
}

// Prefijos comunes: "DNI", "D.N.I.", "N°", "Nro."… (no confunde "CIA123" con "CI")
const PREFIX_RE =
  /^(?:d\.?\s?n\.?\s?i\.?|documento|dni|cuil|cuit|c\.?\s?i\.?|l\.?\s?e\.?|l\.?\s?c\.?|nro\.?|num\.?|n[°º])(?![a-z])\s*[:\-.]?\s*/i

/** Deja el documento en su forma "limpia" (sin puntos ni prefijos). */
export function cleanDocument(raw, typeId = null) {
  let s = String(raw ?? '').trim()
  if (!s) return ''

  // Artefactos de Excel: 12345678.0 / 1.2345678E+7
  if (/^\d+\.0+$/.test(s)) s = s.replace(/\.0+$/, '')
  else if (/^\d+(\.\d+)?e\+?\d+$/i.test(s)) {
    const n = Number(s)
    if (Number.isFinite(n)) s = n.toFixed(0)
  }

  if (typeId === 'OTRO') return s
  if (typeId === 'PASAPORTE') return s.replace(/[\s.-]/g, '').toUpperCase()

  let prev
  do {
    prev = s
    s = s.replace(PREFIX_RE, '')
  } while (s !== prev)

  const compact = s.replace(/[.\s-]/g, '')
  return /[A-Za-z]/.test(compact) ? compact.toUpperCase() : compact
}

/** { valid, empty, message } — un documento vacío es válido (es opcional). */
export function validateDocument(clean, typeId) {
  if (!clean) return { valid: true, empty: true, message: '' }
  const rule = DOC_TYPES[typeId] || DOC_TYPES.OTRO
  if (rule.kind === 'free') return { valid: true, empty: false, message: '' }

  const range = rule.min === rule.max ? `${rule.min}` : `${rule.min} a ${rule.max}`
  if (rule.kind === 'digits') {
    if (/\D/.test(clean))
      return { valid: false, empty: false, message: 'Solo debe contener números' }
    if (clean.length < rule.min || clean.length > rule.max)
      return { valid: false, empty: false, message: `Debe tener ${range} dígitos` }
  }
  if (rule.kind === 'alnum') {
    if (!/^[A-Z0-9]+$/.test(clean))
      return { valid: false, empty: false, message: 'Solo letras y números' }
    if (clean.length < rule.min || clean.length > rule.max)
      return { valid: false, empty: false, message: `Debe tener ${range} caracteres` }
  }
  return { valid: true, empty: false, message: '' }
}

/** Formato para mostrar: 12.345.678 / 20-12345678-3 */
export function formatDocument(clean, typeId, { dots = true } = {}) {
  if (!clean) return ''
  const rule = DOC_TYPES[typeId] || DOC_TYPES.OTRO
  if (rule.kind !== 'digits' || !/^\d+$/.test(clean)) return clean
  if (typeId === 'CUIL')
    return clean.length === 11 ? `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}` : clean
  return dots && rule.dots ? clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : clean
}