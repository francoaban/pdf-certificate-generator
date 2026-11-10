import { DEFAULT_OPTIONS } from '../certificates/defaults.js'
import { normalizeOptions } from './optionsSchema.js'

const STORAGE_KEY = 'certificados:options:v1'
const DATABASE_NAME = 'certificados'
const DATABASE_VERSION = 1
const STORE_NAME = 'settings'
const ASSETS_KEY = 'options-assets'
const ASSET_FIELDS = [
  'customLogo',
  'imageBackground',
  'background',
  'signatureLeftImage',
  'signatureRightImage',
]

export function migrateLegacyOptions(saved = {}) {
  const options = { ...saved }

  if (!Object.hasOwn(options, 'country') && Object.hasOwn(options, 'contry')) {
    options.country = options.contry
  }
  if (!Object.hasOwn(options, 'city')) {
    if (Object.hasOwn(options, 'location')) options.city = options.location
    else if (Object.hasOwn(options, 'locations')) options.city = options.locations
  }
  delete options.contry
  delete options.location
  delete options.locations

  return options
}

export function readOptions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
      throw new Error('El formato de la configuración guardada no es válido.')
    }

    const { options, warnings } = normalizeOptions(migrateLegacyOptions(saved))
    return {
      options,
      error: warnings.length
        ? new Error(`Se corrigieron opciones guardadas: ${warnings[0]}`)
        : null,
    }
  } catch (error) {
    return {
      options: { ...DEFAULT_OPTIONS },
      error: new Error(`No se pudo leer la configuración guardada: ${error.message}`),
    }
  }
}

export async function hydrateOptionAssets(options) {
  const storedAssets = await readAssets()
  const assets = { ...options }
  let hasLegacyAssets = false

  for (const field of ASSET_FIELDS) {
    if (storedAssets && Object.hasOwn(storedAssets, field)) {
      assets[field] = storedAssets[field]
    } else if (options[field] !== undefined) {
      hasLegacyAssets ||= options[field] !== null
    }
  }

  // IndexedDB puede contener datos antiguos o manipulados: se validan con el
  // mismo esquema que la configuración importada antes de usarlos.
  const { options: normalized } = normalizeOptions(
    Object.fromEntries(ASSET_FIELDS.map((field) => [field, assets[field]])),
  )
  for (const field of ASSET_FIELDS) {
    assets[field] = normalized[field]
  }

  if (!storedAssets && hasLegacyAssets) {
    await writeAssets(Object.fromEntries(ASSET_FIELDS.map((field) => [field, assets[field] ?? null])))
  }

  return Object.fromEntries(ASSET_FIELDS.map((field) => [field, assets[field] ?? null]))
}

export async function saveOptions(options, { saveAssets = true, assetsStored = false } = {}) {
  let assetError
  let assetsSafe = false

  if (saveAssets) {
    const assets = Object.fromEntries(ASSET_FIELDS.map((field) => [field, options[field] ?? null]))
    try {
      await writeAssets(assets)
      assetsSafe = true
    } catch (error) {
      assetError = error
    }
  } else {
    // Sin cambios en las imágenes: solo se pueden quitar de localStorage si
    // ya están guardadas de forma segura en IndexedDB.
    assetsSafe = assetsStored
  }

  const lightOptions = { ...options }
  if (assetsSafe) ASSET_FIELDS.forEach((field) => delete lightOptions[field])
  if (!lightOptions.date) delete lightOptions.date
  let optionsError
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lightOptions))
  } catch (error) {
    optionsError = error
  }

  if (assetError && optionsError) {
    throw new AggregateError([assetError, optionsError], 'No se pudieron guardar las opciones ni las imágenes.')
  }
  if (assetError) throw assetError
  if (optionsError) throw optionsError
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('Este navegador no permite guardar imágenes en IndexedDB.'))
      return
    }

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => {
      const database = request.result
      database.onversionchange = () => database.close()
      resolve(database)
    }
    request.onerror = () => reject(request.error || new Error('No se pudo abrir IndexedDB.'))
    request.onblocked = () => reject(new Error('IndexedDB está bloqueada por otra pestaña.'))
  })
}

async function readAssets() {
  const database = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly')
      const request = transaction.objectStore(STORE_NAME).get(ASSETS_KEY)
      let assets
      request.onsuccess = () => {
        assets = request.result
      }
      transaction.oncomplete = () => resolve(assets)
      transaction.onerror = () =>
        reject(transaction.error || new Error('No se pudieron leer las imágenes guardadas.'))
      transaction.onabort = () =>
        reject(transaction.error || new Error('Se canceló la lectura de las imágenes guardadas.'))
    })
  } finally {
    database.close()
  }
}

async function writeAssets(assets) {
  const database = await openDatabase()
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).put(assets, ASSETS_KEY)
      transaction.oncomplete = resolve
      transaction.onerror = () =>
        reject(transaction.error || new Error('No se pudieron guardar las imágenes.'))
      transaction.onabort = () =>
        reject(transaction.error || new Error('Se canceló el guardado de las imágenes.'))
    })
  } finally {
    database.close()
  }
}
