import { useEffect, useRef, useState } from 'react'

export default function useCertificateGeneration({ options, batch }) {
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [generatingId, setGeneratingId] = useState(null)
  const [error, setError] = useState('')
  const busyRef = useRef(false)
  const abortRef = useRef(null)

  useEffect(
    () => () => {
      abortRef.current?.abort()
    },
    [],
  )

  const generateOne = async (record) => {
    if (busyRef.current) return
    setGeneratingId(record.id)
    setError('')
    try {
      const { generateCertificate } = await import('../../../utils/pdfGenerator')
      await generateCertificate(record, options)
    } catch (generationError) {
      setError(generationError.message || 'No se pudo generar el certificado.')
    } finally {
      setGeneratingId(null)
    }
  }

  const runBatch = async (generate) => {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setError('')
    setProgress(null)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      await generate(controller.signal)
    } catch (generationError) {
      setError(
        generationError?.name === 'AbortError'
          ? 'Generación cancelada.'
          : generationError.message || 'Ocurrió un error al generar los certificados.',
      )
    } finally {
      busyRef.current = false
      abortRef.current = null
      setBusy(false)
      setProgress(null)
    }
  }

  const onProgress = (done, total) => setProgress({ done, total })

  const generateZip = () =>
    runBatch(async (signal) => {
      const module = await import('../../../utils/pdfGenerator')
      return module.generateZip(batch, options, { onProgress, signal })
    })

  const generateSinglePdf = () =>
    runBatch(async (signal) => {
      const module = await import('../../../utils/pdfGenerator')
      return module.generateBulkPdf(batch, options, { onProgress, signal })
    })

  return {
    busy,
    progress,
    generatingId,
    error,
    generateOne,
    generateZip,
    generateSinglePdf,
    cancel: () => abortRef.current?.abort(),
  }
}
