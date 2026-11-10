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
    src: 'backgrounds/rojo-floral.png',
    palette: BACKGROUND_PALETTES['rojo-floral'],
    recolor: 'bitmap',
    primaryOnly: true,
  },
  ...CERTIFICATE_STYLES.map(({ id, name, background }) => ({
    id,
    label: name,
    src: background,
    palette: BACKGROUND_PALETTES[id] || null,
  })),
]
