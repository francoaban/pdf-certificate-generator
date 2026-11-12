import { useId } from 'react'
import InfoTip from '../../components/InfoTip'

export default function ToggleField({
  label,
  checked,
  onChange,
  hint,
  disabled = false,
}) {
  const hintId = useId()

  return (
    <div className={`flex items-center gap-1.5 ${disabled ? 'opacity-60' : ''}`}>
      <label
        className={`flex items-center gap-2 text-sm ${
          disabled
            ? 'cursor-not-allowed text-slate-400'
            : 'cursor-pointer text-slate-600'
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          aria-describedby={hint ? hintId : undefined}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 disabled:opacity-50"
        />
        {label}
      </label>
      {hint && <InfoTip text={hint} id={hintId} />}
    </div>
  )
}
