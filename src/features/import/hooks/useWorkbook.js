import { useState } from 'react'

const MAX_FILE_BYTES = 20 * 1024 * 1024
const ACCEPTED_FILE = /\.(xlsx|xls|csv)$/i

const isEmptySheetError = (error) =>
  /no contiene registros|No se encontraron nombres válidos/i.test(error?.message || '')

export default function useWorkbook({ disabled = false, onRecordsLoaded, onLoadFailure }) {
  const [workbook, setWorkbook] = useState(null)
  const [sheetName, setSheetName] = useState('')
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const applySheet = (result) => {
    onRecordsLoaded(result)
    setSheetName(result.sheetName)
  }

  const handleFile = async (file) => {
    if (disabled) return
    setError('')

    if (!ACCEPTED_FILE.test(file?.name || '')) {
      setError('Formato no admitido. Usá un archivo .xlsx, .xls o .csv.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('El archivo supera el límite de 20 MB.')
      return
    }

    setLoading(true)
    try {
      const { readWorkbook, parseSheet } = await import('../../../utils/excelParser')
      const nextWorkbook = await readWorkbook(file)
      let result
      let sheet
      let lastError

      for (const name of nextWorkbook.SheetNames) {
        try {
          result = parseSheet(nextWorkbook, name)
          sheet = name
          break
        } catch (parseError) {
          lastError = parseError
          if (!isEmptySheetError(parseError)) throw parseError
        }
      }

      if (!result) {
        throw lastError || new Error('El archivo no contiene hojas con datos.')
      }

      setWorkbook(nextWorkbook)
      setFileName(file.name)
      applySheet({ ...result, sheetName: sheet })
    } catch (loadError) {
      setWorkbook(null)
      onLoadFailure()
      setError(loadError.message || 'No se pudo leer el archivo.')
    } finally {
      setLoading(false)
    }
  }

  const handleSheetChange = async (name) => {
    if (!workbook) return
    try {
      const { parseSheet } = await import('../../../utils/excelParser')
      applySheet({ ...parseSheet(workbook, name), sheetName: name })
      setError('')
    } catch (loadError) {
      setError(loadError.message || 'No se pudo leer la hoja.')
    }
  }

  const handleTemplate = async () => {
    setError('')
    try {
      const { downloadTemplate } = await import('../../../utils/excelParser')
      downloadTemplate()
    } catch (loadError) {
      setError(loadError.message || 'No se pudo descargar la plantilla.')
    }
  }

  return {
    workbook,
    sheetName,
    fileName,
    loading,
    error,
    handleFile,
    handleSheetChange,
    handleTemplate,
  }
}
