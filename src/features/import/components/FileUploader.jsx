import { useRef, useState } from 'react'

const ACCEPTED = [
  '.xlsx',
  '.xls',
  '.csv',
]

export default function FileUploader({ onFile, loading, disabled = false }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const blocked = loading || disabled

  const handleFiles = (files) => {
    const file = files?.[0]
    if (file) onFile(file)
  }

  const openPicker = () => {
    if (!blocked) inputRef.current?.click()
  }

  return (
    <div
      role="button"
      tabIndex={blocked ? -1 : 0}
      aria-disabled={blocked}
      aria-busy={loading}
      aria-label="Subir planilla Excel o CSV"
      onClick={openPicker}
      onKeyDown={(e) => {
        if (!blocked && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          openPicker()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        if (!blocked) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (!blocked) handleFiles(e.dataTransfer.files)
      }}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
        dragging
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50'
      } ${loading ? 'cursor-wait opacity-70' : ''} ${
        disabled && !loading ? 'cursor-not-allowed opacity-60' : ''
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        aria-label="Seleccionar planilla Excel o CSV"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {loading ? (
        <>
          <div aria-hidden="true" className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p role="status" className="text-sm font-medium text-slate-600">Procesando archivo…</p>
        </>
      ) : (
        <>
          <svg aria-hidden="true" className="mb-3 h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </svg>
          <p className="text-base font-semibold text-slate-700">
            Arrastrá tu archivo acá o hacé clic para seleccionarlo
          </p>
          <p className="mt-1 text-sm text-slate-500">Formatos admitidos: .xlsx, .xls, .csv</p>
        </>
      )}
    </div>
  )
}