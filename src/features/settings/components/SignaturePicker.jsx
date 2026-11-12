import { useId, useState } from 'react'
import InfoTip from './InfoTip'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export default function SignaturePicker({ label, value, onChange }) {
  const [error, setError] = useState('')
  const hintId = useId()

  const handleFile = async (file) => {
    if (!file) return
    setError('')
    if (file.type !== 'image/png') {
      setError('La firma debe estar en formato PNG transparente.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('La firma no puede superar los 5 MB.')
      return
    }

    const url = URL.createObjectURL(file)
    try {
      const image = new Image()
      await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = () => reject(new Error('No se pudo leer la imagen PNG.'))
        image.src = url
      })
      if (
        image.naturalWidth > 4096 ||
        image.naturalHeight > 4096 ||
        image.naturalWidth * image.naturalHeight > 4_000_000
      ) {
        throw new Error('La firma tiene demasiados píxeles. Reducila antes de cargarla.')
      }
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) throw new Error('No se pudo validar la transparencia de la firma.')
      context.drawImage(image, 0, 0)
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
      let hasTransparency = false
      for (let alpha = 3; alpha < pixels.length; alpha += 4) {
        if (pixels[alpha] < 255) {
          hasTransparency = true
          break
        }
      }
      canvas.width = 0
      canvas.height = 0
      if (!hasTransparency) throw new Error('El PNG debe tener el fondo transparente.')

      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(new Error('No se pudo leer el archivo de firma.'))
        reader.readAsDataURL(file)
      })
      onChange({
        dataUrl,
        ratio: image.naturalWidth / image.naturalHeight,
        name: file.name,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 p-3">
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-semibold text-slate-600">{label}</p>
        <InfoTip
          text="La firma debe ser un PNG con fondo transparente, de hasta 5 MB. Se muestra encima de la línea de firma."
          id={hintId}
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-28 items-center justify-center overflow-hidden rounded border border-dashed border-slate-300 bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%,transparent_75%,#f1f5f9_75%),linear-gradient(45deg,#f1f5f9_25%,white_25%,white_75%,#f1f5f9_75%)] bg-[size:12px_12px] bg-[position:0_0,6px_6px]">
          {value?.dataUrl ? (
            <img src={value.dataUrl} alt={label} className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-[10px] text-slate-400">Sin imagen</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <label className="inline-flex cursor-pointer rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
            Elegir PNG…
            <input
              type="file"
              accept="image/png"
              aria-label={`Elegir imagen de ${label.toLowerCase()}`}
              aria-describedby={hintId}
              className="hidden"
              onChange={(event) => {
                handleFile(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </label>
          <p className="mt-1 truncate text-xs text-slate-400">
            {value?.name || 'PNG · máximo 5 MB'}
          </p>
        </div>
        {value?.dataUrl && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            Quitar
          </button>
        )}
      </div>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
