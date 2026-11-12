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

  const runGeneration = async (generate, recordId = null) => {
    if (busyRef.current) return
    busyRef.current = true
    const controller = new AbortController()
    abortRef.current = controller
    setBusy(true)
    setGeneratingId(recordId)
    setError('')
    setProgress(null)
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
      setGeneratingId(null)
      setProgress(null)
    }
  }

  const generateOne = (record) =>
    runGeneration(async (signal) => {
      const { generateCertificate } = await import('../../../utils/pdfGenerator')
      await generateCertificate(record, options, { signal })
    }, record.id)

  const onProgress = (done, total) => setProgress({ done, total })

  const generateZip = () =>
    runGeneration(async (signal) => {
      const module = await import('../../../utils/pdfGenerator')
      return module.generateZip(batch, options, { onProgress, signal })
    })

  const generateSinglePdf = () =>
    runGeneration(async (signal) => {
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
