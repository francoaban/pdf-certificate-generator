// Normaliza para comparar: sin tildes, sin signos, en minúsculas
export const normalizeText = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\-.°º]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

export const CASE_MODES = [
  { id: 'asis', label: 'Tal cual' },
  { id: 'upper', label: 'MAYÚSCULAS' },
  { id: 'title', label: 'Capitalizar' },
]

const PARTICLES = new Set(['de', 'del', 'la', 'las', 'los', 'y'])
const LOCALE = 'es-AR'

function capitalizeWord(word) {
  const out = word
    .split(/([-'’])/)
    .map((part) =>
      /^[-'’]$/.test(part)
        ? part
        : part.charAt(0).toLocaleUpperCase(LOCALE) + part.slice(1).toLocaleLowerCase(LOCALE)
    )
    .join('')
  // McDonald, McArthur…
  return out.length > 3
    ? out.replace(/^Mc(\p{L})/u, (_, c) => 'Mc' + c.toLocaleUpperCase(LOCALE))
    : out
}

export function applyCase(text, mode = 'asis') {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim()
  if (mode === 'upper') return s.toLocaleUpperCase(LOCALE)
  if (mode === 'title') {
    return s
      .split(' ')
      .map((w, i) =>
        i > 0 && PARTICLES.has(w.toLocaleLowerCase(LOCALE)) ? w.toLocaleLowerCase(LOCALE) : capitalizeWord(w)
      )
      .join(' ')
  }
  return s
}