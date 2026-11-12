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
    <>
      <div className="space-y-2">
        <Field
          label="Estilo del certificado"
          hint="Cambia la composición, las líneas decorativas y la tipografía base del certificado."
        >
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
        <p className="text-xs text-slate-400">{selectedStyle.description}</p>
      </div>

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <GroupTitle hint="Podés usar un fondo predeterminado, subir una imagen PNG, JPG o WebP, o cambiar los colores de los fondos vectoriales.">
          Imagen de fondo
        </GroupTitle>
        <BackgroundPicker
          options={options}
          onChange={onChange}
          defaultBackground={selectedStyle.background}
          styleName={selectedStyle.name}
        />
      </div>

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <GroupTitle hint="El logo se ubica arriba a la izquierda y ocupa hasta el 30 % del alto de la hoja.">
          Escudo / logo
        </GroupTitle>
        <LogoPicker options={options} onChange={onChange} />
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-4">
        <ToggleField
          label="Incluir QR y código único de verificación"
          hint="El QR contiene los datos del certificado para consulta local. No valida autenticidad contra un servidor."
          checked={options.showVerificationQr !== false}
          onChange={setChecked('showVerificationQr')}
        />
        <p className="text-xs text-slate-400">
          El QR contiene los datos del certificado para consulta offline; no
          valida autenticidad en un servidor.
        </p>
      </div>
    </>
  )
}
