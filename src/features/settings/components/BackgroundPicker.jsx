import { useId, useRef, useState } from 'react'
import { BACKGROUND_PRESETS } from '../../../certificates/backgrounds'
import { publicUrl } from '../../../certificates/shared'
import { isRemoteAsset } from '../../../utils/optionsSchema'
import { DEFAULT_BACKGROUND_URL, processBackgroundFile } from '../../../utils/background'
import InfoTip from './InfoTip'

export default function BackgroundPicker({
  options,
  onChange,
  defaultBackground,
  styleName,
}) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const backgroundToggleId = useId()
  const backgroundToggleHintId = `${backgroundToggleId}-hint`
  const fitId = useId()
  const fitHintId = `${fitId}-hint`
  const primaryColorId = useId()
  const primaryColorHintId = `${primaryColorId}-hint`
  const secondaryColorId = useId()
  const secondaryColorHintId = `${secondaryColorId}-hint`

  const normalizeSource = (value) =>
    typeof value === 'string' ? value.replace(/^\.?\//, '') : null
  const custom = options.imageBackground
  const customSrc = typeof custom === 'string' ? custom : custom?.dataUrl
  const selectedPreset = BACKGROUND_PRESETS.find(
    (preset) => preset.src === normalizeSource(customSrc),
  )
  const configuredPreset = BACKGROUND_PRESETS.find(
    (preset) => preset.src === normalizeSource(options.background),
  )
  const stylePreset = BACKGROUND_PRESETS.find(
    (preset) => preset.src === normalizeSource(defaultBackground),
  )
  const activePreset =
    customSrc && options.showImageBackground
      ? selectedPreset
      : options.background
        ? configuredPreset
        : stylePreset
  const palette = activePreset?.palette
  const primaryValue = options.primaryColor || palette?.primary || '#6366f1'
  const secondaryValue = activePreset?.primaryOnly
    ? palette?.secondary || primaryValue
    : options.secondaryColor || palette?.secondary || '#0ea5e9'
  const colorizable = Boolean(activePreset?.palette)
  const secondaryColorizable = colorizable && !activePreset?.primaryOnly
  const hasCustomColors = Boolean(options.primaryColor || options.secondaryColor)
  const customName =
    custom?.name ||
    selectedPreset?.label ||
    (customSrc
      ? isRemoteAsset(custom)
        ? 'Imagen remota'
        : 'Imagen personalizada'
      : '')
  const previewSrc = publicUrl(
    customSrc || options.background || defaultBackground || DEFAULT_BACKGROUND_URL,
  )
  const customEnabled = Boolean(customSrc)

  const handleFile = async (file) => {
    if (!file) return
    setError('')
    setBusy(true)
    try {
      const background = await processBackgroundFile(file)
      onChange({
        ...options,
        imageBackground: background,
        showImageBackground: true,
      })
    } catch (err) {
      setError(err.message || 'No se pudo cargar la imagen de fondo.')
    } finally {
      setBusy(false)
    }
  }

  const clear = () => {
    setError('')
    onChange({
      ...options,
      imageBackground: null,
      showImageBackground: false,
    })
  }

  const applyPreset = (preset) => {
    setError('')
    onChange({
      ...options,
      imageBackground: preset.src,
      showImageBackground: true,
    })
  }

  const resetColors = () => {
    setError('')
    onChange({
      ...options,
      primaryColor: null,
      secondaryColor: null,
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-1 ${
            customEnabled && !options.showImageBackground ? 'opacity-40' : ''
          }`}
        >
          {previewSrc ? (
            <img
              src={previewSrc}
              alt="Imagen de fondo actual"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[10px] text-slate-400">Sin fondo</span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-1.5">
            <label
              className={`flex items-center gap-2 text-sm ${
                customEnabled ? 'cursor-pointer text-slate-600' : 'text-slate-400'
              }`}
            >
              <input
                id={backgroundToggleId}
                type="checkbox"
                checked={options.showImageBackground && customEnabled}
                onChange={(e) =>
                  onChange({ ...options, showImageBackground: e.target.checked })
                }
                disabled={!customEnabled}
                aria-describedby={backgroundToggleHintId}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 disabled:opacity-40"
              />
              Incluir imagen de fondo
            </label>
            <InfoTip
              text="Si está desactivado, se usa el fondo del estilo seleccionado en lugar de la imagen personalizada."
              id={backgroundToggleHintId}
            />
          </div>
          <p className="truncate text-xs text-slate-400">
            {customName
              ? `Fondo seleccionado: ${customName}`
              : `Fondo del estilo ${styleName || 'seleccionado'} (predeterminado)`}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? 'Cargando…' : customSrc ? 'Cambiar fondo…' : 'Elegir fondo…'}
            </button>
            {customSrc && (
              <button
                type="button"
                onClick={clear}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Usar fondo del estilo
              </button>
            )}
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

      <div className="space-y-2 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Fondos predeterminados
          </p>
          <InfoTip text="Elegí un fondo de la galería. Los fondos vectoriales permiten personalizar sus colores; el floral permite cambiar su color principal." />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BACKGROUND_PRESETS.map((preset) => {
            const active = normalizeSource(customSrc) === preset.src
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                aria-pressed={active}
                className={`overflow-hidden rounded-lg border text-left transition ${
                  active
                    ? 'border-indigo-400 ring-2 ring-indigo-100'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <img
                  src={publicUrl(preset.src)}
                  alt=""
                  aria-hidden="true"
                  className="aspect-[297/210] w-full object-cover"
                />
                <span className="block truncate px-2 py-1 text-[11px] font-medium text-slate-600">
                  {preset.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-1 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <label htmlFor={fitId}>Ajuste de la imagen</label>
          <InfoTip
            text="«Cubrir» llena toda la hoja y recorta el excedente. «Ajustar» muestra la imagen completa con márgenes."
            id={fitHintId}
          />
        </div>
        <select
          id={fitId}
          value={options.backgroundFit || 'cover'}
          onChange={(e) => onChange({ ...options, backgroundFit: e.target.value })}
          aria-describedby={fitHintId}
          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="cover">Cubrir la página (recorta si hace falta)</option>
          <option value="contain">Ajustar sin recortar (con márgenes)</option>
        </select>
      </div>
      <p className="text-xs text-slate-400">
        Las imágenes conservan su proporción y se centran automáticamente.
      </p>

      <div className="space-y-2 border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Colores del fondo
            </p>
            <InfoTip text="Se aplican solo a los fondos vectoriales predeterminados. El papel y los textos conservan su contraste." />
          </div>
          {hasCustomColors && (
            <button
              type="button"
              onClick={resetColors}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
            >
              Usar colores originales
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <label htmlFor={primaryColorId}>Principal</label>
              <InfoTip
                text="Color decorativo principal del fondo vectorial."
                id={primaryColorHintId}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id={primaryColorId}
                type="color"
                value={primaryValue}
                onChange={(e) => onChange({ ...options, primaryColor: e.target.value })}
                disabled={!colorizable}
                aria-describedby={primaryColorHintId}
                className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              />
              <span className="font-mono text-[11px] text-slate-500">{primaryValue}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <label htmlFor={secondaryColorId}>Secundario</label>
              <InfoTip
                text="Color decorativo secundario. En el fondo floral se usa el mismo color principal."
                id={secondaryColorHintId}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id={secondaryColorId}
                type="color"
                value={secondaryValue}
                onChange={(e) => onChange({ ...options, secondaryColor: e.target.value })}
                disabled={!secondaryColorizable}
                aria-describedby={secondaryColorHintId}
                className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              />
              <span className="font-mono text-[11px] text-slate-500">{secondaryValue}</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          {activePreset?.primaryOnly
            ? 'El fondo floral permite personalizar su color principal; el papel y el diseño se conservan.'
            : colorizable
              ? 'Se aplican a los fondos vectoriales predeterminados; el papel y los textos mantienen su contraste.'
              : activePreset
                ? 'Este fondo es una imagen fija y conserva sus colores originales.'
                : 'Disponibles para fondos predeterminados. Una imagen subida conserva sus colores originales.'}
        </p>
      </div>

      {isRemoteAsset(custom) && (
        <p role="status" className="text-xs text-amber-700">
          La imagen actual es una URL externa. Para uso sin conexión, elegí un archivo
          local; se guardará en este dispositivo.
        </p>
      )}
      {isRemoteAsset(options.background) && (
        <p role="status" className="text-xs text-amber-700">
          La configuración incluye un fondo externo en «background». Conviene reemplazarlo
          por un archivo local para que el certificado funcione sin conexión.
        </p>
      )}
      <p className="text-xs text-slate-400">
        PNG, JPG o WebP · máximo 5 MB. El fondo se reduce y se guarda localmente igual que el logo.
      </p>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
