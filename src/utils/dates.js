const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

// Serial de Excel: día 0 = 1899-12-30 (incluye el bug histórico del 29/02/1900).
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30)
const MIN_EXCEL_SERIAL = 20_000 // ~1954: evita interpretar años sueltos como fechas
const MAX_EXCEL_SERIAL = 2_958_465 // 9999-12-31

function validDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

function formatDate(year, month, day) {
  return `${day} de ${MONTHS[month - 1]} de ${year}`
}

function parseExcelSerial(raw) {
  if (!/^\d+(?:\.\d+)?$/.test(raw)) return null
  const serial = Math.floor(Number(raw))
  if (!Number.isFinite(serial) || serial < MIN_EXCEL_SERIAL || serial > MAX_EXCEL_SERIAL) {
    return null
  }
  const date = new Date(EXCEL_EPOCH_UTC + serial * 86_400_000)
  if (Number.isNaN(date.getTime())) return null
  return formatDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

function parseDateParts(year, month, day) {
  const y = Number(year)
  const m = Number(month)
  const d = Number(day)
  if (!validDate(y, m, d)) return null
  return formatDate(y, m, d)
}

/**
 * Normaliza fechas de planillas a un texto legible en español.
 * Acepta seriales de Excel, ISO (2026-10-12), dd/mm/yyyy y yyyy/mm/dd.
 * Si no puede interpretar el valor, devuelve el texto original.
 */
export function normalizeDate(value) {
  if (value === undefined || value === null) return ''
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return ''
    return formatDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate())
  }

  const raw = String(value).trim()
  if (!raw) return ''

  const serial = parseExcelSerial(raw)
  if (serial) return serial

  let match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/)
  if (match) return parseDateParts(match[1], match[2], match[3]) || raw

  // dd/mm/yyyy, dd-mm-yyyy o dd.mm.yyyy (formato habitual en español).
  match = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/)
  if (match) {
    let year = Number(match[3])
    if (year < 100) year += year >= 70 ? 1900 : 2000
    return parseDateParts(year, match[2], match[1]) || raw
  }

  // yyyy/mm/dd o yyyy-mm-dd ya cubierto arriba; variante yyyy/mm/dd.
  match = raw.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/)
  if (match) return parseDateParts(match[1], match[2], match[3]) || raw

  return raw
}
