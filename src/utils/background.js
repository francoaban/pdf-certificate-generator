import { processImageFile } from './imageAsset.js'
import { MAX_DATA_URL_LENGTH } from './optionsSchema'

const MAX_BYTES = 5 * 1024 * 1024
const MAX_PIXELS = 24_000_000
const MAX_WIDTH = 2400
const MAX_HEIGHT = 1600

/** Fondo neutro de muestra, útil para probar la vista previa y el PDF. */
export const DEFAULT_BACKGROUND_URL = 'backgrounds/generico.svg'

/**
 * Procesa un archivo de imagen elegido por el usuario y lo guarda como data URL.
 * Usa la misma ruta que el logo y devuelve { dataUrl, ratio, name, width, height }.
 * El fondo se convierte a JPEG con fondo blanco para que un PNG transparente no
 * se vea negro en el PDF.
 */
export async function processBackgroundFile(file) {
  return processImageFile(file, {
    maxBytes: MAX_BYTES,
    maxPixels: MAX_PIXELS,
    maxWidth: MAX_WIDTH,
    maxHeight: MAX_HEIGHT,
    mime: 'image/jpeg',
    quality: 0.9,
    fill: '#ffffff',
    maxDataUrlLength: MAX_DATA_URL_LENGTH,
    label: 'La imagen de fondo',
  })
}
