import { getCurrentDate } from '../../../../certificates/defaults.js'
import SignaturePicker from '../../components/SignaturePicker'
import RangeField from '../components/RangeField'
import SettingsCard, {
  Field,
  GroupTitle,
  OptionalLocationField,
  inputClass,
} from '../components/SettingsCard'

export default function DateSignatureSettings({
  options,
  onChange,
  set,
  setChecked,
}) {
  return (
    <>
      <SettingsCard className="grid divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-3">
          <Field
            label="Fecha"
            hint="Si la planilla trae una fecha por fila, esa fecha tiene prioridad sobre esta fecha general."
          >
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
          <Field
            label="Firma izquierda"
            hint="Nombre o cargo que aparece debajo de la línea de firma izquierda."
          >
            <input
              className={inputClass}
              maxLength={100}
              value={options.signatureLeft}
              onChange={set('signatureLeft')}
            />
          </Field>
        </div>
        <div className="p-3">
          <Field
            label="Firma derecha"
            hint="Nombre o cargo que aparece debajo de la línea de firma derecha."
          >
            <input
              className={inputClass}
              maxLength={100}
              value={options.signatureRight}
              onChange={set('signatureRight')}
            />
          </Field>
        </div>
      </SettingsCard>

      <div className="grid gap-3 sm:grid-cols-2">
        <RangeField
          label="Tamaño de fecha y ubicación"
          hint="Ajusta en conjunto la fecha y la ubicación que se muestran debajo del cuerpo."
          value={options.dateSize}
          onChange={(value) => onChange({ ...options, dateSize: value })}
        />
        <RangeField
          label="Tamaño de las firmas"
          hint="Ajusta solo los nombres o cargos de las firmas."
          value={options.signatureSize}
          onChange={(value) => onChange({ ...options, signatureSize: value })}
        />
      </div>

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <GroupTitle hint="Las imágenes de firma deben ser PNG con fondo transparente y un máximo de 5 MB.">
          Imágenes de firmas
        </GroupTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <SignaturePicker
            label="Firma izquierda"
            value={options.signatureLeftImage}
            onChange={(image) =>
              onChange({ ...options, signatureLeftImage: image })
            }
          />
          <SignaturePicker
            label="Firma derecha"
            value={options.signatureRightImage}
            onChange={(image) =>
              onChange({ ...options, signatureRightImage: image })
            }
          />
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between gap-3">
          <GroupTitle hint="La ubicación se muestra debajo del cuerpo, alineada a la derecha, junto con la fecha.">
            Ubicación
          </GroupTitle>
          <span className="rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
            Opcional
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <OptionalLocationField
            label="Ciudad"
            hint="Activá esta opción para incluir la ciudad en el certificado."
            checked={options.showCity ?? true}
            value={options.city}
            onToggle={setChecked('showCity')}
            onChange={set('city')}
            placeholder="San Salvador de Jujuy"
          />
          <OptionalLocationField
            label="Provincia"
            hint="Activá esta opción para incluir la provincia en el certificado."
            checked={options.showProvince ?? false}
            value={options.province}
            onToggle={setChecked('showProvince')}
            onChange={set('province')}
            placeholder="Jujuy"
          />
          <OptionalLocationField
            label="País"
            hint="Activá esta opción para incluir el país en el certificado."
            checked={options.showCountry ?? false}
            value={options.country}
            onToggle={setChecked('showCountry')}
            onChange={set('country')}
            placeholder="Argentina"
          />
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Las fechas válidas se muestran como «12 de octubre de 2026». Si la
        planilla trae una fecha en la fila, esa fecha tiene prioridad sobre la
        fecha general.
      </p>
    </>
  )
}
