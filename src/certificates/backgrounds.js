import { DEFAULT_BACKGROUND_URL } from '../utils/background.js'
import { BACKGROUND_PALETTES } from '../utils/backgroundColors.js'
import { CERTIFICATE_STYLES } from './styles/index.js'

/**
 * Fondos disponibles sin subir un archivo. Se pueden combinar con cualquier
 * estilo: el estilo define la composición y el fondo solo reemplaza la imagen.
 */
export const BACKGROUND_PRESETS = [
  {
    id: 'generico',
    label: 'Genérico',
    src: DEFAULT_BACKGROUND_URL,
    palette: BACKGROUND_PALETTES.generico,
  },
  {
    id: 'rojo-floral',
    label: 'Rojo floral',
    src: 'backgrounds/rojo-floral.svg',
    palette: BACKGROUND_PALETTES['rojo-floral'],
    primaryOnly: true,
  },
  ...CERTIFICATE_STYLES.map(({ id, name, background }) => ({
    id,
    label: name,
    src: background,
    palette: BACKGROUND_PALETTES[id] || null,
  })),
]

// Fuentes antiguas que deben seguir resolviendo al preset actual.
const LEGACY_PRESET_SOURCES = new Map([
  ['backgrounds/rojo-floral.png', 'rojo-floral'],
])

/** Devuelve el preset que corresponde a una fuente guardada, incluidos los alias antiguos. */
export function findBackgroundPreset(source) {
  const normalized =
    typeof source === 'string' ? source.replace(/^\.?\//, '') : null
  if (!normalized) return null

  const legacyId = LEGACY_PRESET_SOURCES.get(normalized.toLowerCase())
  return (
    BACKGROUND_PRESETS.find(
      (preset) =>
        preset.src === normalized || (legacyId && preset.id === legacyId),
    ) || null
  )
}
