import { useEffect, useRef, useState } from 'react'
import { getCurrentDate } from '../../../certificates/defaults.js'
import { downloadConfiguration, readConfiguration } from '../../../utils/configuration'
import { hydrateOptionAssets, readOptions, saveOptions } from '../../../utils/optionsStorage'

const ASSET_FIELDS = [
  'customLogo',
  'imageBackground',
  'background',
  'signatureLeftImage',
  'signatureRightImage',
]

export default function useSettings() {
  const [initialOptions] = useState(readOptions)
  const [options, setOptions] = useState(() => initialOptions.options)
  const [storageError, setStorageError] = useState(initialOptions.error?.message || '')
  const [configurationStatus, setConfigurationStatus] = useState('')
  const [storageReady, setStorageReady] = useState(false)
  const [assetsStorageAvailable, setAssetsStorageAvailable] = useState(false)
  const [today, setToday] = useState(getCurrentDate)
  const saveQueue = useRef(Promise.resolve())
  const persistedAssets = useRef(null)

  useEffect(() => {
    let active = true
    hydrateOptionAssets(initialOptions.options)
      .then((assets) => {
        if (active) {
          setOptions((current) => ({ ...current, ...assets }))
          setAssetsStorageAvailable(true)
        }
      })
      .catch((error) => {
        if (active) setStorageError(`No se pudieron cargar las imágenes guardadas: ${error.message}`)
      })
      .finally(() => {
        if (active) setStorageReady(true)
      })
    return () => {
      active = false
    }
  }, [initialOptions])

  useEffect(() => {
    if (!storageReady) return
    saveQueue.current = saveQueue.current
      .then(async () => {
        const assets = Object.fromEntries(ASSET_FIELDS.map((field) => [field, options[field]]))
        const saveAssets =
          assetsStorageAvailable &&
          (!persistedAssets.current ||
            ASSET_FIELDS.some((field) => persistedAssets.current[field] !== assets[field]))

        await saveOptions(options, {
          saveAssets,
          assetsStored: assetsStorageAvailable && !!persistedAssets.current,
        })
        if (saveAssets) persistedAssets.current = assets
      })
      .then(() => {
        if (assetsStorageAvailable) setStorageError('')
      })
      .catch((error) => setStorageError(`No se pudo guardar la configuración: ${error.message}`))
  }, [options, storageReady, assetsStorageAvailable])

  useEffect(() => {
    const interval = setInterval(() => setToday(getCurrentDate()), 30_000)
    return () => clearInterval(interval)
  }, [])

  const handleImportConfiguration = async (file) => {
    try {
      const imported = await readConfiguration(file)
      setOptions(imported)
      setConfigurationStatus('Configuración importada. Se está guardando en este dispositivo.')
    } catch (error) {
      setConfigurationStatus(error.message || 'No se pudo importar la configuración.')
    }
  }

  const handleExportConfiguration = () => {
    try {
      downloadConfiguration(options)
      setConfigurationStatus('Configuración exportada.')
    } catch (error) {
      setConfigurationStatus(error.message || 'No se pudo exportar la configuración.')
    }
  }

  return {
    options,
    setOptions,
    storageError,
    configurationStatus,
    storageReady,
    today,
    handleImportConfiguration,
    handleExportConfiguration,
  }
}
