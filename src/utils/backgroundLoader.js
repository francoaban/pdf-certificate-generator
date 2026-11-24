import { BACKGROUND_PRESETS } from '../certificates/backgrounds.js'
import { loadImageAsset, publicUrl } from '../certificates/shared.js'
import { colorizeBackgroundSvg } from './backgroundColors.js'

const COLORIZED_CACHE = new Map()
const MAX_CACHE_ENTRIES = 24

// Fuentes antiguas que deben seguir resolviendo al preset actual.
const LEGACY_PRESET_SOURCES = new Map([
  ['backgrounds/rojo-floral.png', 'rojo-floral'],
])

function normalizeSource(source) {
  return typeof source === 'string' ? source.replace(/^\.?\//, '') : null
}

function findPreset(source) {
  const normalized = normalizeSource(source)
  if (!normalized) return null

  const legacyId = LEGACY_PRESET_SOURCES.get(normalized.toLowerCase())
  return (
    BACKGROUND_PRESETS.find(
      (preset) =>
        preset.src === normalized || (legacyId && preset.id === legacyId),
    ) || null
  )
}

/**
 * Carga un fondo. Si es un SVG predeterminado y hay colores personalizados,
 * reemplaza sus colores decorativos antes de rasterizarlo. Las imágenes subidas
 * o remotas se cargan sin modificaciones.
 */
export async function loadBackground(source, options = {}) {
  const { primaryColor, secondaryColor, ...assetOptions } = options
  const preset = findPreset(source)
  const resolvedSource = preset?.src || source

  if (!preset?.palette || (!primaryColor && !secondaryColor)) {
    return loadImageAsset(resolvedSource, assetOptions)
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
      const response = await fetch(publicUrl(resolvedSource))
      if (!response.ok) {
        throw new Error(`No se pudo cargar el fondo (${response.status}).`)
      }
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
      return loadImageAsset(resolvedSource, assetOptions)
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
