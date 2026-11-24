/**
 * Paletas por defecto de los fondos. Se usan como valor inicial de los
 * selectores de color y para completar el color que el usuario no haya cambiado.
 */
export const BACKGROUND_PALETTES = {
  generico: { primary: '#6366f1', secondary: '#0ea5e9' },
  clasico: { primary: '#c2a251', secondary: '#d9c48d' },
  moderno: { primary: '#12263f', secondary: '#2f7f7a' },
  elegante: { primary: '#c2a251', secondary: '#e6d29a' },
  botanico: { primary: '#879a75', secondary: '#a9b798' },
  'rojo-floral': { primary: '#a83837', secondary: '#a83837' },
}

/**
 * Colores originales de cada SVG que se reemplazan por variantes del color
 * principal o secundario. El papel y los fondos neutros se mantienen para no
 * afectar la legibilidad de los textos.
 */
const COLOR_MAPS = {
  generico: {
    '#6366f1': 'primary',
    '#0ea5e9': 'secondary',
    '#14b8a6': 'secondaryDark',
    '#94a3b8': 'primaryLight',
    '#cbd5e1': 'secondaryLight',
    '#e2e8f0': 'secondaryLight2',
  },
  clasico: {
    '#c2a251': 'primary',
    '#b08a3e': 'primaryDark',
    '#a9853a': 'primaryDark2',
    '#e6d29a': 'secondary',
    '#f0e0ad': 'secondaryLight',
    '#d9c48d': 'secondary',
  },
  moderno: {
    '#12263f': 'primaryDark',
    '#18324f': 'primary',
    '#5f7a95': 'primaryLight',
    '#2f7f7a': 'secondary',
    '#5aa8a1': 'secondaryLight',
    '#c2a251': 'secondaryDark',
    '#eef4f3': 'secondaryLight2',
    '#d7e5e3': 'secondaryLight2',
    '#c6dcd9': 'secondaryLight',
    '#e6eef0': 'secondaryLight3',
    '#f0f5f6': 'secondaryLight3',
    '#dde6ea': 'secondaryLight2',
  },
  elegante: {
    '#c2a251': 'primary',
    '#a9853a': 'primaryDark',
    '#e6d29a': 'secondary',
    '#f0e0ad': 'secondaryLight',
  },
  botanico: {
    '#879a75': 'primary',
    '#6f8060': 'primaryDark',
    '#7f9271': 'primaryLight',
    '#a9b798': 'secondary',
    '#c4cfb5': 'secondaryLight',
    '#dfe7d2': 'secondaryLight2',
    '#e4ead9': 'secondaryLight2',
    '#e9eedf': 'secondaryLight3',
    '#c2a251': 'secondaryDark',
  },
  'rojo-floral': {
    '#a83837': 'primary',
    '#be6a69': 'floralLight1',
    '#cf9291': 'floralLight2',
    '#e1b9b9': 'floralLight3',
    '#efdada': 'floralLight4',
    '#f8eeee': 'floralLight5',
  },
}

export function getBackgroundPalette(id) {
  return BACKGROUND_PALETTES[id] || null
}

function normalizeHex(value, fallback) {
  if (typeof value !== 'string') return fallback
  const color = value.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(color)) return color
  if (/^#[0-9a-f]{3}$/.test(color)) {
    return `#${color
      .slice(1)
      .split('')
      .map((part) => part + part)
      .join('')}`
  }
  return fallback
}

function parseHex(hex) {
  const value = hex.slice(1)
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ]
}

function toHex([red, green, blue]) {
  return `#${[red, green, blue]
    .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')}`
}

/** Mezcla un color con otro (por ejemplo blanco o negro) en una proporción 0..1. */
export function mixColor(hex, target, amount) {
  const sourceRgb = parseHex(hex)
  const targetRgb = parseHex(target)
  const ratio = Math.max(0, Math.min(1, amount))
  return toHex(
    sourceRgb.map(
      (channel, index) => channel + (targetRgb[index] - channel) * ratio,
    ),
  )
}

function buildVariants(primary, secondary) {
  return {
    primary,
    primaryDark: mixColor(primary, '#000000', 0.18),
    primaryDark2: mixColor(primary, '#000000', 0.32),
    primaryLight: mixColor(primary, '#ffffff', 0.3),
    primaryLight2: mixColor(primary, '#ffffff', 0.5),
    floralLight1: mixColor(primary, '#ffffff', 0.25),
    floralLight2: mixColor(primary, '#ffffff', 0.45),
    floralLight3: mixColor(primary, '#ffffff', 0.65),
    floralLight4: mixColor(primary, '#ffffff', 0.815),
    floralLight5: mixColor(primary, '#ffffff', 0.915),
    secondary,
    secondaryDark: mixColor(secondary, '#000000', 0.18),
    secondaryDark2: mixColor(secondary, '#000000', 0.32),
    secondaryLight: mixColor(secondary, '#ffffff', 0.25),
    secondaryLight2: mixColor(secondary, '#ffffff', 0.5),
    secondaryLight3: mixColor(secondary, '#ffffff', 0.7),
  }
}

/**
 * Reemplaza los colores decorativos del SVG por variantes de los colores
 * elegidos. Los reemplazos se hacen en una sola pasada para que un color
 * generado no vuelva a sustituirse por coincidir con otro color original.
 */
export function colorizeBackgroundSvg(svg, id, primary, secondary) {
  const colorMap = COLOR_MAPS[id]
  if (!colorMap || typeof svg !== 'string') return svg

  const palette = BACKGROUND_PALETTES[id] || {
    primary: '#4f46e5',
    secondary: '#0ea5e9',
  }
  const selectedPrimary = normalizeHex(primary, palette.primary)
  const selectedSecondary = normalizeHex(secondary, palette.secondary)
  const variants = buildVariants(selectedPrimary, selectedSecondary)
  const pattern = new RegExp(Object.keys(colorMap).join('|'), 'gi')

  return svg.replace(pattern, (match) => {
    const variant = colorMap[match.toLowerCase()]
    return variants[variant] || match
  })
}


