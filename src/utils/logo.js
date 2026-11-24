import logoUrl from '../assets/logo-generico.svg'
import { processImageFile } from './imageAsset.js'

export const DEFAULT_LOGO_URL = logoUrl

const MAX_HEIGHT = 400
const MAX_WIDTH = 800
const MAX_PIXELS = 16_000_000
const DEFAULT_LOGO_SIZE = 1200

// Carga una imagen, la ajusta y devuelve { dataUrl, ratio }.
function rasterize(
  src,
  {
    maxHeight = MAX_HEIGHT,
    maxWidth = MAX_WIDTH,
    allowUpscale = false,
  } = {},
) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) {
        reject(new Error('La imagen no tiene dimensiones válidas.'))
        return
      }
      if (img.naturalWidth * img.naturalHeight > MAX_PIXELS) {
        reject(new Error('La imagen tiene demasiados píxeles.'))
        return
      }
      const fitScale = Math.min(
        maxHeight / img.naturalHeight,
        maxWidth / img.naturalWidth,
      )
      const scale = allowUpscale ? fitScale : Math.min(1, fitScale)
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve({
        dataUrl: canvas.toDataURL('image/png'),
        ratio: img.naturalWidth / img.naturalHeight,
      })
    }
    img.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    img.src = src
  })
}

let defaultLogoPromise = null

/** Logo genérico (se procesa una sola vez). */
export function loadDefaultLogo() {
  defaultLogoPromise ??= rasterize(logoUrl, {
    maxHeight: DEFAULT_LOGO_SIZE,
    maxWidth: DEFAULT_LOGO_SIZE,
    allowUpscale: true,
  })
  return defaultLogoPromise
}

/**
 * Procesa un archivo elegido por el usuario.
 * Usa la misma ruta que el fondo y devuelve { dataUrl, ratio, name, width, height }.
 */
export async function processLogoFile(file) {
  return processImageFile(file, {
    maxWidth: MAX_WIDTH,
    maxHeight: MAX_HEIGHT,
    maxPixels: MAX_PIXELS,
    mime: 'image/png',
    quality: undefined,
    fill: null,
    label: 'La imagen del logo',
  })
}
