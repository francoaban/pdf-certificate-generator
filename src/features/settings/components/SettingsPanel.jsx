import { useRef, useState } from 'react'
import {
  DEFAULT_OPTIONS,
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  FONT_SIZE_STEP,
  getCurrentDate,
} from '../../../certificates/defaults.js'
import { NAME_FONTS } from '../../../certificates/fonts.js'
import { CERTIFICATE_STYLES } from '../../../certificates/styles/index'
import { DOC_TYPES, DOC_TYPE_IDS } from '../../../utils/documents'
import { CASE_MODES } from '../../../utils/text'
import { FILENAME_FORMATS } from '../../../utils/records'
import BackgroundPicker from './BackgroundPicker'
import LogoPicker from './LogoPicker'
import SignaturePicker from './SignaturePicker'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  )
}

function SizeField({ label, value, onChange, disabled = false }) {
  const current = value ?? 100

  return (
    <label className={`block space-y-1 ${disabled ? 'opacity-50' : ''}`}>
      <span className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>{label}</span>
        <span className="text-indigo-700">{current}%</span>
      </span>
      <input
        type="range"
        min={FONT_SIZE_MIN}
        max={FONT_SIZE_MAX}
        step={FONT_SIZE_STEP}
        value={current}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-600 disabled:cursor-not-allowed"
        aria-label={label}
      />
    </label>
  )
}

function OptionalLocationField({ label, checked, value, onToggle, onChange, placeholder }) {
  const isEnabled = checked ?? true

  return (
    <div className={`rounded-xl border p-3 transition ${isEnabled ? 'border-indigo-200 bg-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
      <label className="mb-3 flex cursor-pointer items-center justify-between gap-3 text-sm font-medium text-slate-700">
        <span>{label}</span>
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={onToggle}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600"
        />
      </label>
      <Field label="Detalle">
        <input
          className={`${inputClass} ${!isEnabled ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : ''}`}
          maxLength={100}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={!isEnabled}
        />
      </Field>
    </div>
  )
}

export default function SettingsPanel({
  options,
  onChange,
  onExportConfiguration,
  onImportConfiguration,
  configurationStatus,
  configurationReady = true,
}) {
  const [openText, setOpenText] = useState(false)
  const [openStyle, setOpenStyle] = useState(false)
  const [openSetting, setOpenSetting] = useState(false)
  const importRef = useRef(null)
  const selectedStyle =
    CERTIFICATE_STYLES.find((style) => style.id === options.style) || CERTIFICATE_STYLES[0]
  const set = (key) => (e) => onChange({ ...options, [key]: e.target.value })
  const setChecked = (key) => (e) => onChange({ ...options, [key]: e.target.checked })
  const resetOptions = () => {
    if (
      typeof window === 'undefined' ||
      window.confirm('¿Restaurar todos los valores por defecto? Se perderán los textos, el logo y las firmas actuales.')
    ) {
      onChange({ ...DEFAULT_OPTIONS })
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          aria-expanded={openText}
          aria-controls="settings-text-panel"
          onClick={() => setOpenText(!openText)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <span className="text-sm font-semibold text-slate-700">Personalizar Textos</span>
          <span aria-hidden="true" className="text-xs text-slate-400">{openText ? '▲' : '▼'}</span>
        </button>

        {openText && (
          <div id="settings-text-panel" className="space-y-6 border-t border-slate-100 p-5">
            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Textos del certificado
              </h3>
              <p className="rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                Podés usar <code className="font-mono font-semibold">**texto**</code> en
                cualquier campo para aplicar negrita.
              </p>
              <p className="text-xs text-slate-500">
                Cada texto tiene su propio tamaño. Ajustá el porcentaje debajo de cada
                campo.
              </p>
              <div className="grid overflow-hidden rounded-xl border border-slate-200 divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="space-y-3 p-3">
                  <Field label="Título">
                    <input className={inputClass} maxLength={100} value={options.title} onChange={set('title')} />
                  </Field>
                  <Field label="Tipografía del título">
                    <select className={inputClass} value={options.titleFont} onChange={set('titleFont')}>
                      {NAME_FONTS.map((font) => (
                        <option key={font.id} value={font.id}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <SizeField
                    label="Tamaño del título"
                    value={options.titleSize}
                    onChange={(value) => onChange({ ...options, titleSize: value })}
                  />
                </div>
                <div className="space-y-3 p-3">
                  <Field label="Subtítulo">
                    <input className={inputClass} maxLength={100} value={options.subtitle} onChange={set('subtitle')} />
                  </Field>
                  <Field label="Tipografía del subtítulo">
                    <select className={inputClass} value={options.subtitleFont} onChange={set('subtitleFont')}>
                      {NAME_FONTS.map((font) => (
                        <option key={font.id} value={font.id}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <SizeField
                    label="Tamaño del subtítulo"
                    value={options.subtitleSize}
                    onChange={(value) => onChange({ ...options, subtitleSize: value })}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_180px] sm:items-end">
                <Field label="Texto previo al nombre">
                  <input className={inputClass} maxLength={200} value={options.preText} onChange={set('preText')} />
                </Field>
                <SizeField
                  label="Tamaño del texto previo"
                  value={options.preTextSize}
                  onChange={(value) => onChange({ ...options, preTextSize: value })}
                />
              </div>
              <div className="space-y-3">
                <Field label="Cuerpo del certificado">
                  <textarea rows={3} maxLength={2000} className={inputClass} value={options.bodyText} onChange={set('bodyText')} />
                </Field>
                <Field label="Tipografía del cuerpo">
                  <select className={inputClass} value={options.bodyFont} onChange={set('bodyFont')}>
                    {NAME_FONTS.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <SizeField
                  label="Tamaño del cuerpo"
                  value={options.bodySize}
                  onChange={(value) => onChange({ ...options, bodySize: value })}
                />
                <p className="text-xs text-slate-400">
                  Para destacar solo el final del cuerpo, escribí por ejemplo:
                  «...su dedicación. <span className="font-semibold">**Gracias por participar.**</span>»
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Fecha y firmas</h3>
              <div className="grid overflow-hidden rounded-xl border border-slate-200 divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="p-3">
                  <Field label="Fecha">
                    <input
                      className={inputClass}
                      maxLength={100}
                      value={options.date || ''}
                      placeholder={getCurrentDate()}
                      onChange={set('date')}
                    />
                  </Field>
                </div>
                <div className="p-3">
                  <Field label="Firma izquierda">
                    <input className={inputClass} maxLength={100} value={options.signatureLeft} onChange={set('signatureLeft')} />
                  </Field>
                </div>
                <div className="p-3">
                  <Field label="Firma derecha">
                    <input className={inputClass} maxLength={100} value={options.signatureRight} onChange={set('signatureRight')} />
                  </Field>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <SizeField
                  label="Tamaño de fecha y ubicación"
                  value={options.dateSize}
                  onChange={(value) => onChange({ ...options, dateSize: value })}
                />
                <SizeField
                  label="Tamaño de las firmas"
                  value={options.signatureSize}
                  onChange={(value) => onChange({ ...options, signatureSize: value })}
                />
              </div>
              <p className="text-xs text-slate-500">
                Las fechas válidas se muestran como «12 de octubre de 2026». Si la planilla trae
                una fecha en la fila, esa fecha tiene prioridad sobre la fecha general.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Imágenes de firmas</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <SignaturePicker
                  label="Firma izquierda"
                  value={options.signatureLeftImage}
                  onChange={(image) => onChange({ ...options, signatureLeftImage: image })}
                />
                <SignaturePicker
                  label="Firma derecha"
                  value={options.signatureRightImage}
                  onChange={(image) => onChange({ ...options, signatureRightImage: image })}
                />
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Ubicación</h3>
                <span className="rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                  Opcional
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <OptionalLocationField
                  label="Ciudad"
                  checked={options.showCity ?? true}
                  value={options.city}
                  onToggle={setChecked('showCity')}
                  onChange={set('city')}
                  placeholder="San Salvador de Jujuy"
                />
                <OptionalLocationField
                  label="Provincia"
                  checked={options.showProvince ?? false}
                  value={options.province}
                  onToggle={setChecked('showProvince')}
                  onChange={set('province')}
                  placeholder="Jujuy"
                />
                <OptionalLocationField
                  label="País"
                  checked={options.showCountry ?? false}
                  value={options.country}
                  onToggle={setChecked('showCountry')}
                  onChange={set('country')}
                  placeholder="Argentina"
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Datos del participante
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre y apellido">
                  <div className="inline-flex max-w-full overflow-hidden rounded-lg border border-slate-300">
                    {CASE_MODES.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onChange({ ...options, caseMode: m.id })}
                        className={`px-3 py-1.5 text-xs font-semibold transition ${options.caseMode === m.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Tipo de documento">
                  <select className={inputClass} value={options.defaultDocType} onChange={set('defaultDocType')}>
                    <option value="auto">Automático (según el número)</option>
                    {DOC_TYPE_IDS.map((id) => (
                      <option key={id} value={id}>
                        {DOC_TYPES[id].label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Formato del archivo">
                  <select className={inputClass} value={options.fileNameFormat} onChange={set('fileNameFormat')}>
                    {FILENAME_FORMATS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <SizeField
                  label="Tamaño del nombre"
                  value={options.nameSize}
                  onChange={(value) => onChange({ ...options, nameSize: value })}
                />
              </div>

              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={options.showDocument !== false}
                    onChange={(e) => onChange({ ...options, showDocument: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />
                  Mostrar documento
                </label>
                <SizeField
                  label="Tamaño del documento"
                  value={options.documentSize}
                  disabled={options.showDocument === false}
                  onChange={(value) => onChange({ ...options, documentSize: value })}
                />
                <label
                  className={`flex items-center gap-2 text-sm ${options.showDocument === false
                    ? 'cursor-not-allowed text-slate-400'
                    : 'cursor-pointer text-slate-600'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={options.docDots}
                    onChange={(e) => onChange({ ...options, docDots: e.target.checked })}
                    disabled={options.showDocument === false}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 disabled:opacity-50"
                  />
                  Mostrar documento con puntos
                </label>
              </div>
            </section>

            <div className="flex justify-end border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={resetOptions}
                className="text-xs font-semibold uppercase tracking-wide text-indigo-600 hover:text-indigo-800"
              >
                Restaurar valores por defecto
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          aria-expanded={openStyle}
          aria-controls="settings-style-panel"
          onClick={() => setOpenStyle(!openStyle)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <span className="text-sm font-semibold text-slate-700">Cambiar estilo del Certificado</span>
          <span className="text-xs text-slate-400">{openStyle ? 'Ocultar ▲' : 'Ver ▼'}</span>
        </button>

        {openStyle && (
          <div id="settings-style-panel" className="space-y-5 border-t border-slate-100 px-5 py-5">
            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Diseño</h3>
              <Field label="Estilo del certificado">
                <select className={inputClass} value={options.style} onChange={set('style')}>
                  {CERTIFICATE_STYLES.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.name}
                    </option>
                  ))}
                </select>
              </Field>
              <p className="text-xs text-slate-400">
                {selectedStyle.description}
              </p>
              <Field label="Fuente del nombre y apellido">
                <select className={inputClass} value={options.nameFont} onChange={set('nameFont')}>
                  {NAME_FONTS.map((font) => (
                    <option key={font.id} value={font.id}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </Field>
              <p className="text-xs text-slate-400">
                «Automática» usa la caligrafía del estilo seleccionado. El nombre y el apellido
                se dibujan completos con la fuente elegida.
              </p>
              <section className="space-y-3 border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Imagen de fondo
                </h3>
                <BackgroundPicker
                  options={options}
                  onChange={onChange}
                  defaultBackground={selectedStyle.background}
                  styleName={selectedStyle.name}
                />
              </section>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={options.showVerificationQr !== false}
                  onChange={setChecked('showVerificationQr')}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                Incluir QR y código único de verificación
              </label>
              <p className="text-xs text-slate-400">
                El QR contiene los datos del certificado para consulta offline; no valida autenticidad en un servidor.
              </p>
            </section>

            <section className="space-y-3 border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Escudo / logo</h3>
              <LogoPicker options={options} onChange={onChange} />
            </section>

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={resetOptions}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Restaurar valores por defecto
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          aria-expanded={openSetting}
          aria-controls="settings-configuration-panel"
          onClick={() => setOpenSetting(!openSetting)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <span className="text-sm font-semibold text-slate-700">Guardar o Recuperar Configuración</span>
          <span className="text-xs text-slate-400">{openSetting ? 'Ocultar ▲' : 'Ver ▼'}</span>
        </button>
        {openSetting && (
          <div
            id="settings-configuration-panel"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            {/* <h3 className="text-sm font-semibold text-slate-700">Configuración</h3> */}
            <p className="mt-1 text-xs text-slate-500">
              Exportá o importá opciones, imágenes y firmas para compartir entre dispositivos.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onExportConfiguration}
                disabled={!configurationReady}
                className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                Exportar JSON
              </button>
              <button
                type="button"
                onClick={() => importRef.current?.click()}
                disabled={!configurationReady}
                className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                Importar JSON…
              </button>
              <input
                ref={importRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  onImportConfiguration(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
            </div>
            {!configurationReady && (
              <p role="status" className="mt-2 text-xs text-amber-700">
                Esperá a que se cargue la configuración guardada para transferir también las imágenes.
              </p>
            )}
            {configurationStatus && (
              <p role="status" className="mt-2 text-xs text-slate-600">
                {configurationStatus}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}