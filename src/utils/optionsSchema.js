import {
  DEFAULT_OPTIONS,
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  FONT_SIZE_STEP,
} from '../certificates/defaults.js'
import { NAME_FONT_IDS } from '../certificates/fonts.js'
import { DOC_TYPE_IDS } from './documents.js'
import { CASE_MODES } from './text.js'
import { FILENAME_FORMATS } from './records.js'

export const MAX_CONFIGURATION_BYTES = 30 * 1024 * 1024
export const MAX_DATA_URL_LENGTH = 8 * 1024 * 1024
const MAX_URL_LENGTH = 4096

// Mantener en sync con src/certificates/styles/index.js.
const STYLE_IDS = new Set(['clasico', 'moderno', 'elegante', 'botanico'])
const CASE_MODE_IDS = new Set(CASE_MODES.map((mode) => mode.id))
const FILENAME_FORMAT_IDS = new Set(FILENAME_FORMATS.map((format) => format.id))
const BACKGROUND_FIT_IDS = new Set(['cover', 'contain'])
const DOC_TYPE_VALUES = new Set(['auto', ...DOC_TYPE_IDS])
const FONT_SIZE_FIELDS = [
  'titleSize',
  'subtitleSize',
  'preTextSize',
  'nameSize',
  'bodySize',
  'dateSize',
  'signatureSize',
  'documentSize',
]

const STRING_LIMITS = {
  title: 100,
  subtitle: 100,
  preText: 200,
  bodyText: 2000,
  signatureLeft: 100,
  signatureRight: 100,
  date: 100,
  city: 100,
  province: 100,
  country: 100,
}

const BOOLEAN_FIELDS = [
  'useLogo',
  'backgroundFromLogo',
  'showDocument',
  'docDots',
  'showCity',
  'showProvince',
  'showCountry',
  'showImageBackground',
  'useBackground',
  'showVerificationQr',
]

const ASSET_FIELDS = ['customLogo', 'signatureLeftImage', 'signatureRightImage']
const URL_FIELDS = ['background']

const DATA_IMAGE_RE = /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/]+={0,2}$/i
const REMOTE_ASSET_RE = /^https:\/\/[^\s]+$/i

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const isSafeRelativeAsset = (value) => {
  if (!value || value.startsWith('//') || value.startsWith('\\\\')) return false
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return false
  if (value.includes('\0')) return false
  if (value.split(/[?#]/)[0].split('/').some((segment) => segment === '..')) return false
  const path = value.replace(/^\.?\//, '')
  return /\.(?:png|jpe?g|webp|svg)(?:[?#].*)?$/i.test(path)
}

export const isRemoteAsset = (value) =>
  typeof value === 'string' && REMOTE_ASSET_RE.test(value)

function createReporter(strict, warnings) {
  return (message, fallback) => {
    if (strict) throw new Error(message)
    warnings.push(message)
    return fallback
  }
}

function normalizeString(value, field, fallback, strict, warnings) {
  const report = createReporter(strict, warnings)
  if (value === undefined || value === null) return fallback
  if (typeof value !== 'string') {
    return report(`La opción «${field}» debe ser texto.`, fallback)
  }
  const max = STRING_LIMITS[field]
  if (max && value.length > max) {
    return report(
      `La opción «${field}» no puede superar los ${max} caracteres.`,
      value.slice(0, max),
    )
  }
  return value
}

function normalizeBoolean(value, field, fallback, strict, warnings) {
  const report = createReporter(strict, warnings)
  if (value === undefined) return fallback
  if (typeof value === 'boolean') return value
  if (!strict && (value === 'true' || value === 'false')) return value === 'true'
  return report(`La opción «${field}» debe ser verdadera o falsa.`, fallback)
}

function normalizeEnum(value, field, allowed, fallback, strict, warnings) {
  const report = createReporter(strict, warnings)
  if (value === undefined) return fallback
  if (typeof value === 'string' && allowed.has(value)) return value
  return report(`La opción «${field}» no tiene un valor válido.`, fallback)
}

function normalizeColor(value, field, fallback, strict, warnings) {
  const report = createReporter(strict, warnings)
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value !== 'string') {
    return report(
      `El color «${field}» debe ser hexadecimal, por ejemplo #c2a251.`,
      fallback,
    )
  }

  const color = value.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(color)) return color
  if (/^#[0-9a-f]{3}$/.test(color)) {
    return `#${color
      .slice(1)
      .split('')
      .map((part) => part + part)
      .join('')}`
  }

  return report(
    `El color «${field}» debe ser hexadecimal, por ejemplo #c2a251.`,
    fallback,
  )
}

function normalizeFontSize(value, field, fallback, strict, warnings) {
  const report = createReporter(strict, warnings)
  if (value === undefined) return fallback

  const number =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : Number.NaN

  if (!Number.isFinite(number)) {
    return report(`La opción «${field}» debe ser un número.`, fallback)
  }

  const rounded = Math.round(number / FONT_SIZE_STEP) * FONT_SIZE_STEP
  if (rounded < FONT_SIZE_MIN || rounded > FONT_SIZE_MAX) {
    const clamped = Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, rounded))
    return report(
      `La opción «${field}» debe estar entre ${FONT_SIZE_MIN} y ${FONT_SIZE_MAX}.`,
      clamped,
    )
  }

  return rounded
}

function normalizeAsset(value, field, strict, warnings) {
  const report = createReporter(strict, warnings)
  if (value === undefined || value === null) return null
  if (!isPlainObject(value)) {
    return report(`El recurso «${field}» no contiene una imagen válida.`, null)
  }

  const { dataUrl, ratio, name, width, height } = value
  if (typeof dataUrl !== 'string' || !DATA_IMAGE_RE.test(dataUrl)) {
    return report(`El recurso «${field}» no contiene una imagen válida.`, null)
  }
  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    return report(`El recurso «${field}» es demasiado grande.`, null)
  }
  if (ratio !== undefined && (!Number.isFinite(ratio) || ratio <= 0)) {
    return report(`El recurso «${field}» tiene proporciones no válidas.`, null)
  }

  const asset = { dataUrl }
  if (Number.isFinite(ratio)) asset.ratio = ratio
  if (Number.isFinite(width) && width > 0) asset.width = width
  if (Number.isFinite(height) && height > 0) asset.height = height
  if (typeof name === 'string' && name.trim()) asset.name = name.slice(0, 200)
  return asset
}

function normalizeAssetUrl(value, field, strict, warnings) {
  const report = createReporter(strict, warnings)
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') {
    return report(`El recurso «${field}» debe ser una URL o data URL.`, null)
  }

  const trimmed = value.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('data:')) {
    if (!DATA_IMAGE_RE.test(trimmed)) {
      return report(`El recurso «${field}» no contiene una imagen válida.`, null)
    }
    if (trimmed.length > MAX_DATA_URL_LENGTH) {
      return report(`El recurso «${field}» es demasiado grande.`, null)
    }
    return trimmed
  }

  if (trimmed.length > MAX_URL_LENGTH) {
    return report(`El recurso «${field}» supera la longitud máxima permitida.`, null)
  }
  if (REMOTE_ASSET_RE.test(trimmed)) return trimmed
  if (isSafeRelativeAsset(trimmed)) return trimmed

  return report(
    `El recurso «${field}» debe ser una imagen local, una data URL o una URL HTTPS.`,
    null,
  )
}

function normalizeImageBackground(value, strict, warnings) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value === 'string') {
    return normalizeAssetUrl(value, 'imageBackground', strict, warnings)
  }
  if (isPlainObject(value)) {
    return normalizeAsset(value, 'imageBackground', strict, warnings)
  }
  return createReporter(strict, warnings)(
    'El recurso «imageBackground» debe ser una imagen válida.',
    null,
  )
}

/**
 * Valida y normaliza opciones provenientes de localStorage o de un JSON
 * importado. En modo estricto lanza un error ante cualquier valor inválido; en
 * modo tolerante reemplaza solo los valores problemáticos y devuelve avisos.
 */
export function normalizeOptions(input, { strict = false } = {}) {
  const warnings = []
  if (!isPlainObject(input)) {
    if (strict) throw new Error('El formato de configuración no es válido.')
    return {
      options: { ...DEFAULT_OPTIONS },
      warnings: ['El formato de configuración guardada no es válido.'],
    }
  }

  const merged = { ...DEFAULT_OPTIONS, ...input }
  const options = {}

  for (const field of Object.keys(STRING_LIMITS)) {
    options[field] = normalizeString(
      merged[field],
      field,
      DEFAULT_OPTIONS[field] ?? '',
      strict,
      warnings,
    )
  }

  for (const field of BOOLEAN_FIELDS) {
    options[field] = normalizeBoolean(
      merged[field],
      field,
      DEFAULT_OPTIONS[field],
      strict,
      warnings,
    )
  }

  if (merged.defaultDocType === undefined) {
    options.defaultDocType = DEFAULT_OPTIONS.defaultDocType
  } else if (typeof merged.defaultDocType === 'string' && DOC_TYPE_VALUES.has(merged.defaultDocType)) {
    options.defaultDocType = merged.defaultDocType
  } else if (strict) {
    throw new Error('El tipo de documento predeterminado no es válido.')
  } else {
    warnings.push('El tipo de documento predeterminado no es válido; se usará el automático.')
    options.defaultDocType = DEFAULT_OPTIONS.defaultDocType
  }

  options.style = normalizeEnum(
    merged.style,
    'style',
    STYLE_IDS,
    DEFAULT_OPTIONS.style,
    strict,
    warnings,
  )
  options.caseMode = normalizeEnum(
    merged.caseMode,
    'caseMode',
    CASE_MODE_IDS,
    DEFAULT_OPTIONS.caseMode,
    strict,
    warnings,
  )
  options.nameFont = normalizeEnum(
    merged.nameFont,
    'nameFont',
    NAME_FONT_IDS,
    DEFAULT_OPTIONS.nameFont,
    strict,
    warnings,
  )
  for (const field of ['titleFont', 'subtitleFont', 'bodyFont']) {
    options[field] = normalizeEnum(
      merged[field],
      field,
      NAME_FONT_IDS,
      DEFAULT_OPTIONS[field],
      strict,
      warnings,
    )
  }
  // La escala global anterior se traslada a cada texto si no hay un valor propio.
  const legacyFontSize = Number(input.fontScale)
  const legacyScale = Number.isFinite(legacyFontSize) ? legacyFontSize : null
  for (const field of FONT_SIZE_FIELDS) {
    const value =
      input[field] === undefined && legacyScale !== null ? legacyScale : merged[field]
    options[field] = normalizeFontSize(
      value,
      field,
      DEFAULT_OPTIONS[field],
      strict,
      warnings,
    )
  }
  options.fileNameFormat = normalizeEnum(
    merged.fileNameFormat,
    'fileNameFormat',
    FILENAME_FORMAT_IDS,
    DEFAULT_OPTIONS.fileNameFormat,
    strict,
    warnings,
  )
  options.backgroundFit = normalizeEnum(
    merged.backgroundFit,
    'backgroundFit',
    BACKGROUND_FIT_IDS,
    DEFAULT_OPTIONS.backgroundFit,
    strict,
    warnings,
  )
  options.primaryColor = normalizeColor(
    merged.primaryColor,
    'primaryColor',
    DEFAULT_OPTIONS.primaryColor,
    strict,
    warnings,
  )
  options.secondaryColor = normalizeColor(
    merged.secondaryColor,
    'secondaryColor',
    DEFAULT_OPTIONS.secondaryColor,
    strict,
    warnings,
  )

  for (const field of ASSET_FIELDS) {
    options[field] = normalizeAsset(merged[field], field, strict, warnings)
  }
  options.imageBackground = normalizeImageBackground(
    merged.imageBackground,
    strict,
    warnings,
  )
  for (const field of URL_FIELDS) {
    options[field] = normalizeAssetUrl(merged[field], field, strict, warnings)
  }

  return { options, warnings }
}
