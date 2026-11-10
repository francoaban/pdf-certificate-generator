import { migrateLegacyOptions } from './optionsStorage.js'
import { MAX_CONFIGURATION_BYTES, normalizeOptions } from './optionsSchema.js'

const FORMAT = 'certificados-config'
const FORMAT_VERSION = 1

export function downloadConfiguration(options) {
  const safeOptions = normalizeOptions(options).options
  const contents = JSON.stringify(
    { format: FORMAT, version: FORMAT_VERSION, options: safeOptions },
    null,
    2,
  )
  const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'configuracion-certificados.json'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function readConfiguration(file) {
  if (!file) throw new Error('Seleccioná un archivo JSON.')
  if (Number.isFinite(file.size) && file.size > MAX_CONFIGURATION_BYTES) {
    throw new Error('El archivo de configuración supera el límite de 30 MB.')
  }

  let text
  try {
    text = await file.text()
  } catch {
    throw new Error('No se pudo leer el archivo de configuración.')
  }
  if (text.length > MAX_CONFIGURATION_BYTES) {
    throw new Error('El archivo de configuración supera el límite de 30 MB.')
  }

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('El archivo no contiene un JSON válido.')
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('El formato de configuración no es válido.')
  }
  if (
    parsed.format === FORMAT &&
    parsed.version !== undefined &&
    Number(parsed.version) !== FORMAT_VERSION
  ) {
    throw new Error('La versión del archivo de configuración no es compatible.')
  }

  const imported = parsed.format === FORMAT ? parsed.options : parsed
  if (!imported || typeof imported !== 'object' || Array.isArray(imported)) {
    throw new Error('El archivo no contiene opciones de configuración.')
  }

  const { options } = normalizeOptions(
    migrateLegacyOptions(imported),
    { strict: true },
  )
  return options
}
