import { BACKGROUND_PRESETS } from '../certificates/backgrounds.js'
import {
  loadHtmlImage,
  loadImageAsset,
  publicUrl,
} from '../certificates/shared.js'
import {
  colorizeBackgroundSvg,
  recolorFloralPixels,
} from './backgroundColors.js'

const COLORIZED_CACHE = new Map()
const MAX_CACHE_ENTRIES = 24

function normalizeSource(source) {
  return typeof source === 'string' ? source.replace(/^\.?\//, '') : null
}

function findPreset(source) {
  const normalized = normalizeSource(source)
  if (!normalized) return null
  return BACKGROUND_PRESETS.find((preset) => preset.src === normalized) || null
}

async function recolorBitmapBackground(source, primaryColor, assetOptions) {
  const {
    scale = 1,
    maxWidth = 2000,
    mime = 'image/png',
    quality = 0.92,
  } = assetOptions
  const sourceUrl = typeof source === 'string' ? source : source?.dataUrl
  if (!sourceUrl) throw new Error('No se pudo cargar el fondo: falta la fuente.')

  const image = await loadHtmlImage(publicUrl(sourceUrl))
  const naturalWidth = image.naturalWidth || image.width || 1123
  const naturalHeight = image.naturalHeight || image.height || 794
  const finalScale = Math.min(scale, maxWidth / naturalWidth)
  const width = Math.max(1, Math.round(naturalWidth * finalScale))
  const height = Math.max(1, Math.round(naturalHeight * finalScale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('No se pudo procesar el fondo.')

  if (mime === 'image/jpeg') {
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
  }
  context.drawImage(image, 0, 0, width, height)
  const imageData = context.getImageData(0, 0, width, height)
  recolorFloralPixels(imageData.data, primaryColor)
  context.putImageData(imageData, 0, 0)

  return {
    dataUrl: canvas.toDataURL(mime, quality),
    width: naturalWidth,
    height: naturalHeight,
  }
}

/**
 * Carga un fondo. Si es un SVG predeterminado y hay colores personalizados,
 * reemplaza sus colores decorativos antes de rasterizarlo. El fondo floral es
 * un bitmap al que se le recolorean los trazos rojos. Las imágenes subidas o
 * remotas se cargan sin modificaciones.
 */
export async function loadBackground(source, options = {}) {
  const { primaryColor, secondaryColor, ...assetOptions } = options
  const preset = findPreset(source)

  if (preset?.recolor === 'bitmap') {
    const normalizedPrimary =
      typeof primaryColor === 'string' ? primaryColor.trim().toLowerCase() : ''
    if (!normalizedPrimary || normalizedPrimary === preset.palette?.primary) {
      return loadImageAsset(source, assetOptions)
    }

    const cacheKey = [
      'bitmap',
      preset.id,
      normalizedPrimary,
      assetOptions.scale,
      assetOptions.maxWidth,
      assetOptions.mime,
      assetOptions.quality,
    ].join('|')

    const cached = COLORIZED_CACHE.get(cacheKey)
    if (cached) return cached

    const promise = (async () => {
      try {
        return await recolorBitmapBackground(
          source,
          normalizedPrimary,
          assetOptions,
        )
      } catch {
        // Si el navegador no puede procesar los píxeles, usamos el original.
        return loadImageAsset(source, assetOptions)
      }
    })()

    COLORIZED_CACHE.set(cacheKey, promise)
    if (COLORIZED_CACHE.size > MAX_CACHE_ENTRIES) {
      const oldest = COLORIZED_CACHE.keys().next().value
      COLORIZED_CACHE.delete(oldest)
    }

    try {
      return await promise
    } catch (error) {
      COLORIZED_CACHE.delete(cacheKey)
      throw error
    }
  }

  if (!preset?.palette || (!primaryColor && !secondaryColor)) {
    return loadImageAsset(source, assetOptions)
  }

  const colors = {
    primary: primaryColor || preset.palette.primary,
    secondary: secondaryColor || preset.palette.secondary,
  }
  const cacheKey = [
    preset.id,
    colors.primary,
    colors.secondary,
    assetOptions.scale,
    assetOptions.maxWidth,
    assetOptions.mime,
    assetOptions.quality,
  ].join('|')

  const cached = COLORIZED_CACHE.get(cacheKey)
  if (cached) return cached

  const promise = (async () => {
    try {
      const response = await fetch(publicUrl(source))
      if (!response.ok) throw new Error(`No se pudo cargar el fondo (${response.status}).`)
      const svg = await response.text()
      const colorized = colorizeBackgroundSvg(
        svg,
        preset.id,
        colors.primary,
        colors.secondary,
      )
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(colorized)}`
      return await loadImageAsset(dataUrl, assetOptions)
    } catch {
      // Si falla la lectura del SVG, el fondo original sigue siendo una opción.
      return loadImageAsset(source, assetOptions)
    }
  })()

  COLORIZED_CACHE.set(cacheKey, promise)
  if (COLORIZED_CACHE.size > MAX_CACHE_ENTRIES) {
    const oldest = COLORIZED_CACHE.keys().next().value
    COLORIZED_CACHE.delete(oldest)
  }

  try {
    return await promise
  } catch (error) {
    COLORIZED_CACHE.delete(cacheKey)
    throw error
  }
}
