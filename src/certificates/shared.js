import {
  FONT_SIZE_DEFAULT,
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  getCurrentDate,
} from './defaults.js'
import { normalizeDate } from '../utils/dates.js'
import {
  SYNTHETIC_BOLD_OFFSET,
  drawRichText,
  drawRichWrappedText,
  hasBoldMarkup,
  needsSyntheticBold,
  safeFontStyle,
} from '../utils/richText.js'

export const PAGE_WIDTH = 297
export const PAGE_HEIGHT = 210
export const LOGO_HEIGHT_RATIO = 0.3

/** Factor de tamaño de un texto concreto del certificado. */
export function getFontScale(options = {}, field = null) {
  const value = Number(field ? options?.[field] : FONT_SIZE_DEFAULT)
  if (!Number.isFinite(value)) return FONT_SIZE_DEFAULT / 100
  return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, value)) / 100
}

export function scaleFont(size, options = {}, field = null) {
  return size * getFontScale(options, field)
}

const ASSET_CACHE = new Map()
const FONT_CACHE = new Map()

/** Convierte una ruta de /public en URL respetando el base de Vite. */
export function publicUrl(path) {
  if (!path) return ''
  if (/^(data:|blob:|https?:)/i.test(path)) return path
  const base = import.meta.env?.BASE_URL || '/'
  return `${base.replace(/\/?$/, '/')}${String(path).replace(/^\//, '')}`
}

/** Carga una imagen (incluido SVG) y la convierte a PNG/JPEG para jsPDF. */
export async function loadImageAsset(
  source,
  { scale = 1, maxWidth = 2000, mime = 'image/png', quality = 0.92 } = {},
) {
  // Acepta tanto una URL/ruta como un asset { dataUrl, ratio, name }.
  const sourceUrl = typeof source === 'string' ? source : source?.dataUrl
  if (!sourceUrl) throw new Error('No se pudo cargar la imagen: falta la fuente.')
  const url = publicUrl(sourceUrl)
  const key = `${url}|${scale}|${maxWidth}|${mime}|${quality}`
  if (ASSET_CACHE.has(key)) return ASSET_CACHE.get(key)

  const promise = (async () => {
    const image = await loadHtmlImage(url)
    const naturalWidth = image.naturalWidth || image.width || 1123
    const naturalHeight = image.naturalHeight || image.height || 794
    const finalScale = Math.min(scale, maxWidth / naturalWidth)
    const width = Math.max(1, Math.round(naturalWidth * finalScale))
    const height = Math.max(1, Math.round(naturalHeight * finalScale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (mime === 'image/jpeg') {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, width, height)
    }
    context.drawImage(image, 0, 0, width, height)

    return {
      dataUrl: canvas.toDataURL(mime, quality),
      width: naturalWidth,
      height: naturalHeight,
    }
  })()

  ASSET_CACHE.set(key, promise)
  try {
    return await promise
  } catch (error) {
    ASSET_CACHE.delete(key)
    throw error
  }
}

export function loadHtmlImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`))
    image.src = src
  })
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

/** Descarga y cachea las fuentes TTF declaradas por un estilo. */
export async function prepareFonts(fonts = {}) {
  const seen = new Set()
  const entries = Object.values(fonts)
    .filter((font) => font?.file)
    .filter(({ family, file }) => {
      const key = `${family}|${file}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

  return Promise.all(
    entries.map(async ({ family, file, style = 'normal' }) => {
      const url = publicUrl(file)
      let base64Promise = FONT_CACHE.get(url)
      if (!base64Promise) {
        base64Promise = (async () => {
          const response = await fetch(url)
          if (!response.ok) throw new Error(`No se pudo cargar la fuente: ${url}`)
          return arrayBufferToBase64(await response.arrayBuffer())
        })()
        FONT_CACHE.set(url, base64Promise)
      }
      try {
        return { family, style, base64: await base64Promise }
      } catch (error) {
        FONT_CACHE.delete(url)
        throw error
      }
    }),
  )
}

/** Registra en un documento jsPDF las fuentes ya descargadas. */
export function applyFonts(doc, preparedFonts = []) {
  for (const { family, style, base64 } of preparedFonts) {
    const vfsName = `${family}.ttf`
    doc.addFileToVFS(vfsName, base64)
    doc.addFont(vfsName, family, style)
  }
}

/** "San Salvador de Jujuy, Argentina · 5 de noviembre de 2026" */
export function composePlaceLine(options = {}) {
  const showCity = options.showCity ?? true
  const showProvince = options.showProvince ?? false
  const showCountry = options.showCountry ?? false

  return [
    showCity && (options.city || options.location || options.locations),
    showProvince && options.province,
    showCountry && (options.country || options.contry),
  ]
    .filter(Boolean)
    .join(', ')
}

export function composeDateLine(options) {
  const date = normalizeDate(options.date || '') || getCurrentDate()
  return [composePlaceLine(options), date].filter(Boolean).join(' · ')
}

/** Dibuja texto con tamaño ajustable y espaciado entre letras. */
export function drawText(
  doc,
  text,
  x,
  y,
  {
    size = 12,
    font = 'times',
    style = 'normal',
    color = [0, 0, 0],
    align = 'left',
    charSpace = 0,
    maxWidth,
    minSize = 8,
  } = {},
) {
  if (text === undefined || text === null || text === '') return size

  if (hasBoldMarkup(text)) {
    return drawRichText(doc, text, x, y, {
      size,
      font,
      style,
      color,
      align,
      charSpace,
      maxWidth,
      minSize,
    })
  }

  const drawStyle = safeFontStyle(font, style)
  const syntheticBold = needsSyntheticBold(font, style)
  doc.setFont(font, drawStyle)
  let finalSize = size
  doc.setFontSize(finalSize)

  if (maxWidth) {
    while (finalSize > minSize && doc.getTextWidth(String(text)) > maxWidth) {
      finalSize = Math.max(minSize, Math.round((finalSize - 0.5) * 10) / 10)
      doc.setFontSize(finalSize)
    }
  }

  doc.setTextColor(color[0], color[1], color[2])
  if (charSpace) doc.setCharSpace(charSpace)
  doc.text(String(text), x, y, { align })
  if (syntheticBold) {
    doc.text(String(text), x + SYNTHETIC_BOLD_OFFSET, y, { align })
  }
  if (charSpace) doc.setCharSpace(0)

  return finalSize
}

/** Texto centrado en el ancho de la página. */
export function drawCenteredText(doc, text, y, options = {}) {
  return drawText(doc, text, PAGE_WIDTH / 2, y, { ...options, align: 'center' })
}

/** Texto multilínea con ajuste automático. */
export function drawWrappedText(
  doc,
  text,
  x,
  y,
  {
    width = 180,
    size = 11,
    font = 'times',
    style = 'normal',
    color = [0, 0, 0],
    align = 'center',
    lineHeight = 1.45,
    maxLines,
  } = {},
) {
  if (!text) return y

  if (hasBoldMarkup(text)) {
    return drawRichWrappedText(doc, text, x, y, {
      width,
      size,
      font,
      style,
      color,
      align,
      lineHeight,
      maxLines,
    })
  }

  const drawStyle = safeFontStyle(font, style)
  const syntheticBold = needsSyntheticBold(font, style)
  doc.setFont(font, drawStyle)
  doc.setFontSize(size)
  doc.setTextColor(color[0], color[1], color[2])

  let lines = doc.splitTextToSize(String(text), width)
  if (maxLines) lines = lines.slice(0, maxLines)

  const lineStep = size * 0.352778 * lineHeight
  lines.forEach((line, index) => {
    const lineY = y + index * lineStep
    doc.text(line, x, lineY, { align })
    if (syntheticBold) doc.text(line, x + SYNTHETIC_BOLD_OFFSET, lineY, { align })
  })

  return y + lines.length * lineStep
}

export function drawDiamond(doc, x, y, size, color) {
  doc.setFillColor(color[0], color[1], color[2])
  doc.triangle(x, y - size, x + size, y, x, y + size, 'F')
  doc.triangle(x, y - size, x - size, y, x, y + size, 'F')
}

export function drawSignature(
  doc,
  {
    centerX,
    y,
    width = 60,
    text,
    lineColor = [180, 173, 156],
    textColor = [30, 40, 60],
    font = 'times',
    style = 'italic',
    fontSize = 11,
    image,
  },
) {
  if (image?.dataUrl) {
    const ratio = image.ratio || (image.width && image.height ? image.width / image.height : 2)
    const imageHeight = Math.min(12, width / ratio)
    const imageWidth = imageHeight * ratio
    doc.addImage(image.dataUrl, 'PNG', centerX - imageWidth / 2, y - imageHeight - 2, imageWidth, imageHeight)
  }

  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2])
  doc.setLineWidth(0.35)
  doc.line(centerX - width / 2, y, centerX + width / 2, y)

  drawText(doc, text, centerX, y + 7, {
    size: fontSize,
    font,
    style,
    color: textColor,
    align: 'center',
    maxWidth: width,
  })
}

/**
 * Dibuja el logo conservando su relación de aspecto.
 * Acepta { dataUrl, ratio } (utils/logo) o { dataUrl, width, height }.
 */
export function drawLogo(
  doc,
  logo,
  { centerX, x = 0, top, maxWidth = 26, maxHeight = 16, align = 'center', alias = 'logo' },
) {
  if (!logo) return null

  const ratio = logo.ratio || (logo.width && logo.height ? logo.width / logo.height : 1)
  let height = maxHeight
  let width = height * ratio
  if (width > maxWidth) {
    width = maxWidth
    height = width / ratio
  }

  const left = align === 'center' ? centerX - width / 2 : x
  doc.addImage(logo.dataUrl, 'PNG', left, top, width, height, alias, 'FAST')
  return { x: left, y: top, width, height }
}

/** Logo superior izquierdo con una altura fija del 30 % de la página. */
export function drawCertificateLogo(doc, logo) {
  return drawLogo(doc, logo, {
    align: 'left',
    x: 14,
    top: 10,
    maxWidth: PAGE_WIDTH - 28,
    maxHeight: PAGE_HEIGHT * LOGO_HEIGHT_RATIO,
  })
}
