import { useId, useRef, useState } from 'react'
import { DEFAULT_LOGO_URL, processLogoFile } from '../../../utils/logo'
import InfoTip from './InfoTip'

export default function LogoPicker({ options, onChange }) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const logoHintId = useId()
  const watermarkHintId = useId()

  const custom = options.customLogo

  const handleFile = async (file) => {
    if (!file) return
    setError('')
    setBusy(true)
    try {
      const logo = await processLogoFile(file)
      onChange({
        ...options,
        customLogo: logo,
        useLogo: true,
        // El primer logo personalizado activa la marca de agua; si el usuario
        // ya la había desactivado, se respeta esa preferencia al cambiarlo.
        backgroundFromLogo: options.customLogo
          ? Boolean(options.backgroundFromLogo)
          : true,
      })
    } catch (err) {
      setError(err.message || 'No se pudo cargar el logo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-1 ${
            options.useLogo ? '' : 'opacity-40'
          }`}
        >
          <img
            src={custom ? custom.dataUrl : DEFAULT_LOGO_URL}
            alt="Logo actual"
            className="max-h-full max-w-full object-contain"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-1.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={options.useLogo}
                onChange={(e) => onChange({ ...options, useLogo: e.target.checked })}
                aria-describedby={logoHintId}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              Incluir escudo / logo
            </label>
            <InfoTip
              text="El logo se ubica arriba a la izquierda y ocupa hasta el 30 % del alto de la hoja."
              id={logoHintId}
            />
          </div>
          <p className="truncate text-xs text-slate-400">
            {custom ? custom.name : 'Logo genérico (predeterminado)'}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? 'Cargando…' : 'Cambiar logo…'}
            </button>
            {custom && (
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...options,
                    customLogo: null,
                    backgroundFromLogo: false,
                  })
                }
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Usar logo genérico
              </button>
            )}
          </div>

          {custom && (
            <div className="flex items-start gap-1.5 rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2">
              <label className="flex items-start gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={Boolean(options.backgroundFromLogo)}
                  onChange={(e) =>
                    onChange({ ...options, backgroundFromLogo: e.target.checked })
                  }
                  aria-describedby={watermarkHintId}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                <span>
                  Generar fondo con el logo
                  <span className="block text-xs text-slate-400">
                    Marca de agua centrada; ocupa hasta un tercio del ancho de la hoja.
                  </span>
                </span>
              </label>
              <InfoTip
                text="Agrega una marca de agua centrada con el logo, con opacidad baja, para que no interfiera con los textos del certificado."
                id={watermarkHintId}
              />
            </div>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}