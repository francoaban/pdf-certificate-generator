import { CERTIFICATE_STYLES } from '../../../../certificates/styles/index'
import BackgroundPicker from '../../components/BackgroundPicker'
import LogoPicker from '../../components/LogoPicker'
import ToggleField from '../components/ToggleField'
import { Field, GroupTitle, inputClass } from '../components/SettingsCard'

export default function DesignSettings({
  options,
  onChange,
  set,
  setChecked,
  selectedStyle,
}) {
  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <GroupTitle>Estilo del certificado</GroupTitle>

        <Field label="Estilo">
          <select
            className={inputClass}
            value={options.style}
            onChange={set('style')}
          >
            {CERTIFICATE_STYLES.map((style) => (
              <option key={style.id} value={style.id}>
                {style.name}
              </option>
            ))}
          </select>
        </Field>

        <p className="text-xs leading-relaxed text-slate-500">
          {selectedStyle.description}
        </p>
      </section>

      <section className="space-y-3 border-t border-slate-100 pt-4">
        <GroupTitle>Imagen de fondo</GroupTitle>
        <BackgroundPicker
          options={options}
          onChange={onChange}
          defaultBackground={selectedStyle.background}
          styleName={selectedStyle.name}
        />
      </section>

      <section className="space-y-3 border-t border-slate-100 pt-4">
        <GroupTitle>Escudo / logo</GroupTitle>
        <LogoPicker options={options} onChange={onChange} />
      </section>

      <section className="space-y-3 border-t border-slate-100 pt-4">
        <GroupTitle>Verificación</GroupTitle>
        <div className="space-y-2 rounded-lg border border-slate-200 p-3">
          <ToggleField
            label="QR y código de verificación"
            checked={options.showVerificationQr !== false}
            onChange={setChecked('showVerificationQr')}
          />
          <p className="text-xs leading-relaxed text-slate-500">
            El QR contiene los datos del certificado para consulta offline. No
            valida autenticidad contra un servidor.
          </p>
        </div>
      </section>
    </div>
  )
}
