import { useId, useRef, useState } from 'react'
import { DEFAULT_LOGO_URL, processLogoFile } from '../../../utils/logo'
import InfoTip from './InfoTip'

export default function LogoPicker({ options, onChange }) {
  const inputRef = useRef(null)
  const watermarkInputRef = useRef(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [watermarkBusy, setWatermarkBusy] = useState(false)
  const logoHintId = useId()
  const watermarkHintId = useId()
  const customWatermarkHintId = useId()

  const custom = options.customLogo
  const watermark = options.watermarkImage
  const watermarkEnabled = Boolean(watermark)

  const handleFile = async (file) => {
    if (!file) return
    setError('')
    setBusy(true)
    try {
      const logo = await processLogoFile(file)
      const useCustomWatermark = Boolean(
        options.showWatermarkImage && options.watermarkImage,
      )
      // El primer logo personalizado activa la marca de agua salvo que ya haya
      // una imagen personalizada para el fondo; las dos opciones son excluyentes.
      const backgroundFromLogo = options.customLogo
        ? Boolean(options.backgroundFromLogo) && !useCustomWatermark
        : !useCustomWatermark
      onChange({
        ...options,
        customLogo: logo,
        useLogo: true,
        backgroundFromLogo,
        showWatermarkImage: backgroundFromLogo ? false : useCustomWatermark,
      })
    } catch (err) {
      setError(err.message || 'No se pudo cargar el logo.')
    } finally {
      setBusy(false)
    }
  }

  const handleWatermarkFile = async (file) => {
    if (!file) return
    setError('')
    setWatermarkBusy(true)
    try {
      const image = await processLogoFile(file)
      onChange({
        ...options,
        watermarkImage: image,
        showWatermarkImage: true,
        backgroundFromLogo: false,
      })
    } catch (err) {
      setError(err.message || 'No se pudo cargar la imagen de fondo.')
    } finally {
      setWatermarkBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start gap-4">
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
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 disabled:cursor-wait disabled:opacity-60"
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
                className="inline-flex min-h-10 items-center rounded-lg px-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
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
                  onChange={(e) => {
                    const enabled = e.target.checked
                    onChange({
                      ...options,
                      backgroundFromLogo: enabled,
                      showWatermarkImage: enabled
                        ? false
                        : Boolean(options.showWatermarkImage),
                    })
                  }}
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
                text="Agrega una marca de agua centrada con el logo. No se puede usar a la vez que la imagen personalizada; también podés dejar ambas desactivadas."
                id={watermarkHintId}
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">Marca de agua</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Usá el logo o elegí una imagen personalizada para el fondo.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white p-1 ${
              options.showWatermarkImage && watermarkEnabled ? '' : 'opacity-40'
            }`}
          >
            {watermark ? (
              <img
                src={watermark.dataUrl}
                alt="Imagen de marca de agua"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-[9px] leading-tight text-slate-400">Sin imagen</span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start gap-1.5">
              <label
                className={`flex items-start gap-2 text-sm ${
                  watermarkEnabled ? 'cursor-pointer text-slate-600' : 'text-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(options.showWatermarkImage) && watermarkEnabled}
                  onChange={(e) => {
                    const enabled = e.target.checked
                    onChange({
                      ...options,
                      showWatermarkImage: enabled,
                      backgroundFromLogo: enabled
                        ? false
                        : Boolean(options.backgroundFromLogo),
                    })
                  }}
                  disabled={!watermarkEnabled}
                  aria-describedby={customWatermarkHintId}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 disabled:opacity-40"
                />
                <span>
                  Imagen personalizada para el fondo
                  <span className="block text-xs text-slate-400">
                    Mismas reglas que la generada con el logo: centrada, opaca y de hasta un
                    tercio del ancho.
                  </span>
                </span>
              </label>
              <InfoTip
                text="Otra imagen como marca de agua, con las mismas reglas que la generada con el logo. Al activarla se desactiva la del logo, y al revés."
                id={customWatermarkHintId}
              />
            </div>
            <p className="truncate text-xs text-slate-400">
              {watermark ? watermark.name : 'Ninguna imagen personalizada'}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => watermarkInputRef.current?.click()}
                disabled={watermarkBusy}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 disabled:cursor-wait disabled:opacity-60"
              >
                {watermarkBusy
                  ? 'Cargando…'
                  : watermark
                    ? 'Cambiar imagen…'
                    : 'Elegir imagen…'}
              </button>
              {watermark && (
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...options,
                      watermarkImage: null,
                      showWatermarkImage: false,
                    })
                  }
                  className="inline-flex min-h-10 items-center rounded-lg px-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                >
                  Quitar imagen
                </button>
              )}
            </div>
          </div>
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
      <input
        ref={watermarkInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          handleWatermarkFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}