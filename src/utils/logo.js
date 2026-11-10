import escudoUrl from '../assets/logo-generico.png'
import { processImageFile } from './imageAsset.js'

export const DEFAULT_LOGO_URL = escudoUrl

const MAX_HEIGHT = 400
const MAX_WIDTH = 800
const MAX_PIXELS = 16_000_000

// Carga una imagen, la reduce y devuelve { dataUrl, ratio }.
function rasterize(src) {
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
      const scale = Math.min(1, MAX_HEIGHT / img.naturalHeight, MAX_WIDTH / img.naturalWidth)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.naturalWidth * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
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

/** Escudo del IPSEL (se procesa una sola vez). */
export function loadDefaultLogo() {
  defaultLogoPromise ??= rasterize(escudoUrl)
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