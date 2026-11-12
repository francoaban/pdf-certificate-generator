import { NAME_FONTS } from '../../../../certificates/fonts.js'
import { DOC_TYPES, DOC_TYPE_IDS } from '../../../../utils/documents'
import { CASE_MODES } from '../../../../utils/text'
import { FILENAME_FORMATS } from '../../../../utils/records'
import RangeField from '../components/RangeField'
import ToggleField from '../components/ToggleField'
import {
  Field,
  FieldGroup,
  inputClass,
} from '../components/SettingsCard'

export default function ParticipantSettings({ options, onChange, set }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup
          label="Nombre y apellido"
          hint="Define si el nombre se muestra tal cual, en MAYÚSCULAS o capitalizado."
        >
          <div className="inline-flex max-w-full overflow-hidden rounded-lg border border-slate-300">
            {CASE_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onChange({ ...options, caseMode: m.id })}
                className={`px-3 py-1.5 text-xs font-semibold transition ${
                  options.caseMode === m.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </FieldGroup>

        <Field
          label="Tipografía del nombre"
          hint="«Automática» usa la caligrafía del estilo. Las fuentes con archivo se cargan desde el dispositivo."
        >
          <select
            className={inputClass}
            value={options.nameFont}
            onChange={set('nameFont')}
          >
            {NAME_FONTS.map((font) => (
              <option key={font.id} value={font.id}>
                {font.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Tipo de documento"
          hint="«Automático» deduce el tipo según el número. Elegí un tipo fijo si la planilla no trae la columna «Tipo de documento»."
        >
          <select
            className={inputClass}
            value={options.defaultDocType}
            onChange={set('defaultDocType')}
          >
            <option value="auto">Automático (según el número)</option>
            {DOC_TYPE_IDS.map((id) => (
              <option key={id} value={id}>
                {DOC_TYPES[id].label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Formato del archivo"
          hint="Define cómo se nombran los PDF descargados: nombre, apellido o documento."
        >
          <select
            className={inputClass}
            value={options.fileNameFormat}
            onChange={set('fileNameFormat')}
          >
            {FILENAME_FORMATS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </Field>

        <RangeField
          label="Tamaño del nombre"
          hint="Ajusta solo el nombre y apellido del participante."
          value={options.nameSize}
          onChange={(value) => onChange({ ...options, nameSize: value })}
        />

        <RangeField
          label="Tamaño del documento"
          hint="Ajusta solo la línea del documento. Se desactiva si ocultás el documento."
          value={options.documentSize}
          disabled={options.showDocument === false}
          onChange={(value) => onChange({ ...options, documentSize: value })}
        />
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-4">
        <ToggleField
          label="Mostrar documento"
          hint="Si lo desactivás, el documento no aparece en el certificado, pero se conserva en la tabla y en el nombre del archivo."
          checked={options.showDocument !== false}
          onChange={(e) =>
            onChange({ ...options, showDocument: e.target.checked })
          }
        />
        <ToggleField
          label="Mostrar documento con puntos"
          hint="Ejemplo: 12.345.678 en lugar de 12345678."
          checked={options.docDots}
          onChange={(e) => onChange({ ...options, docDots: e.target.checked })}
          disabled={options.showDocument === false}
        />
        <p className="text-xs text-slate-400">
          «Automática» usa la caligrafía del estilo seleccionado. El nombre y el
          apellido se dibujan completos con la fuente elegida.
        </p>
      </div>
    </>
  )
}
