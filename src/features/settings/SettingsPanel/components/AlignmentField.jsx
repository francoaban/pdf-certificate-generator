import { TEXT_ALIGNMENTS } from '../../../../certificates/alignment.js'
import { Field, inputClass } from './SettingsCard'

export default function AlignmentField({ label, hint, value, onChange }) {
  return (
    <Field label={label} hint={hint}>
      <select
        className={inputClass}
        value={value || 'auto'}
        onChange={(event) => onChange(event.target.value)}
      >
        {TEXT_ALIGNMENTS.map((alignment) => (
          <option key={alignment.id} value={alignment.id}>
            {alignment.label}
          </option>
        ))}
      </select>
    </Field>
  )
}
