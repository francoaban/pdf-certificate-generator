/**
 * Fuentes disponibles para el nombre y para los textos personalizables.
 *
 * Las fuentes con `file` se cargan desde `public/fonts` y se registran en
 * jsPDF. Las fuentes con `family` pero sin `file` son fuentes estándar de
 * jsPDF y no requieren descarga.
 */
export const NAME_FONTS = [
  {
    id: 'auto',
    label: 'Automática (estilo del certificado)',
    family: null,
    file: null,
  },
  {
    id: 'great-vibes',
    label: 'Great Vibes',
    family: 'GreatVibes',
    file: 'fonts/GreatVibes-Regular.ttf',
  },
  {
    id: 'parisienne',
    label: 'Parisienne',
    family: 'Parisienne',
    file: 'fonts/Parisienne-Regular.ttf',
  },
  {
    id: 'pinyon-script',
    label: 'Pinyon Script',
    family: 'PinyonScript',
    file: 'fonts/PinyonScript-Regular.ttf',
  },
  {
    id: 'sacramento',
    label: 'Sacramento',
    family: 'Sacramento',
    file: 'fonts/Sacramento-Regular.ttf',
  },
  {
    id: 'serif',
    label: 'Serif clásica',
    family: 'times',
    file: null,
  },
  {
    id: 'sans',
    label: 'Sans moderna',
    family: 'helvetica',
    file: null,
  },
]

export const DEFAULT_NAME_FONT = 'auto'

const NAME_FONT_MAP = new Map(NAME_FONTS.map((font) => [font.id, font]))

export const NAME_FONT_IDS = new Set(NAME_FONTS.map((font) => font.id))

/**
 * Familia que debe usar el nombre. `auto` conserva la caligrafía del estilo
 * (se pasa como fallback) y las demás opciones usan su familia explícita.
 */
export function resolveNameFont(nameFont, fallbackFamily) {
  const selected = NAME_FONT_MAP.get(nameFont)
  return selected?.family || fallbackFamily
}

/** Resuelve la familia elegida para cualquier texto del certificado. */
export function resolveTextFont(textFont, fallbackFamily) {
  return resolveNameFont(textFont, fallbackFamily)
}

/**
 * Entradas de fuentes que hay que preparar para un estilo y una selección.
 * Se evita duplicar la misma familia/archivo cuando la fuente elegida coincide
 * con la caligrafía del estilo.
 */
export function getFontEntries(
  styleFonts = {},
  nameFont = DEFAULT_NAME_FONT,
  textFonts = [],
) {
  const entries = { ...styleFonts }
  const selected = NAME_FONT_MAP.get(nameFont)
  if (selected?.file) entries.name = selected

  textFonts.forEach((fontId, index) => {
    const font = NAME_FONT_MAP.get(fontId)
    if (font?.file) entries[`text${index}`] = font
  })

  return entries
}
