import { NAME_FONTS } from '../../../../certificates/fonts.js'
import RangeField from '../components/RangeField'
import SettingsCard, { Field, inputClass } from '../components/SettingsCard'

export default function ContentSettings({ options, onChange, set }) {
  return (
    <>
      <p className="rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
        Podés usar <code className="font-mono font-semibold">**texto**</code> en
        cualquier campo para aplicar negrita.
      </p>
      <p className="text-xs text-slate-500">
        Cada texto tiene su propio tamaño. Ajustá el porcentaje debajo de cada
        campo.
      </p>

      <SettingsCard className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="space-y-3 p-3">
          <Field
            label="Título"
            hint="Es el encabezado principal del certificado. Podés usar **texto** para negrita."
          >
            <input
              className={inputClass}
              maxLength={100}
              value={options.title}
              onChange={set('title')}
            />
          </Field>
          <Field
            label="Tipografía del título"
            hint="«Automática» conserva la tipografía definida por el estilo del certificado."
          >
            <select
              className={inputClass}
              value={options.titleFont}
              onChange={set('titleFont')}
            >
              {NAME_FONTS.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.label}
                </option>
              ))}
            </select>
          </Field>
          <RangeField
            label="Tamaño del título"
            hint="Porcentaje respecto del tamaño original del estilo. El rango va de 80 % a 150 %."
            value={options.titleSize}
            onChange={(value) => onChange({ ...options, titleSize: value })}
          />
        </div>

        <div className="space-y-3 p-3">
          <Field
            label="Subtítulo"
            hint="Texto secundario que acompaña al título. También admite **negrita**."
          >
            <input
              className={inputClass}
              maxLength={100}
              value={options.subtitle}
              onChange={set('subtitle')}
            />
          </Field>
          <Field
            label="Tipografía del subtítulo"
            hint="Podés elegir una tipografía distinta a la del título y del cuerpo."
          >
            <select
              className={inputClass}
              value={options.subtitleFont}
              onChange={set('subtitleFont')}
            >
              {NAME_FONTS.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.label}
                </option>
              ))}
            </select>
          </Field>
          <RangeField
            label="Tamaño del subtítulo"
            hint="Ajusta solo el subtítulo, sin afectar el título ni el cuerpo."
            value={options.subtitleSize}
            onChange={(value) => onChange({ ...options, subtitleSize: value })}
          />
        </div>
      </SettingsCard>

      <div className="grid gap-3 sm:grid-cols-[1fr_180px] sm:items-end">
        <Field
          label="Texto previo al nombre"
          hint="Frase que introduce el nombre del participante, por ejemplo «Se otorga el presente certificado a»."
        >
          <input
            className={inputClass}
            maxLength={200}
            value={options.preText}
            onChange={set('preText')}
          />
        </Field>
        <RangeField
          label="Tamaño del texto previo"
          hint="Porcentaje independiente para el texto previo al nombre."
          value={options.preTextSize}
          onChange={(value) => onChange({ ...options, preTextSize: value })}
        />
      </div>

      <div className="space-y-3">
        <Field
          label="Cuerpo del certificado"
          hint="Texto descriptivo del certificado. Podés resaltar una parte con **texto**."
        >
          <textarea
            rows={3}
            maxLength={2000}
            className={inputClass}
            value={options.bodyText}
            onChange={set('bodyText')}
          />
        </Field>
        <Field
          label="Tipografía del cuerpo"
          hint="Tipografía independiente para el texto descriptivo del certificado."
        >
          <select
            className={inputClass}
            value={options.bodyFont}
            onChange={set('bodyFont')}
          >
            {NAME_FONTS.map((font) => (
              <option key={font.id} value={font.id}>
                {font.label}
              </option>
            ))}
          </select>
        </Field>
        <RangeField
          label="Tamaño del cuerpo"
          hint="Ajusta solo el cuerpo del certificado. El texto se adapta al ancho disponible."
          value={options.bodySize}
          onChange={(value) => onChange({ ...options, bodySize: value })}
        />
        <p className="text-xs text-slate-400">
          Para destacar solo el final del cuerpo, escribí por ejemplo:
          «...su dedicación.{' '}
          <span className="font-semibold">**Gracias por participar.**</span>»
        </p>
      </div>
    </>
  )
}
