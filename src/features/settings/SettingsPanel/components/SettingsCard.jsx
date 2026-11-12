import { cloneElement, useId } from 'react'
import InfoTip from '../../components/InfoTip'

export const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

export function Field({ label, hint, children }) {
  const generatedId = useId()
  const controlId = children.props.id ?? generatedId
  const hintId = `${controlId}-hint`

  return (
    <div className="block">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <label htmlFor={controlId}>{label}</label>
        {hint && <InfoTip text={hint} id={hintId} />}
      </div>
      {cloneElement(children, {
        id: controlId,
        'aria-describedby': hint ? hintId : children.props['aria-describedby'],
      })}
    </div>
  )
}

export function FieldGroup({ label, hint, children }) {
  const labelId = useId()
  const hintId = `${labelId}-hint`

  return (
    <div
      className="block"
      role="group"
      aria-labelledby={labelId}
      aria-describedby={hint ? hintId : undefined}
    >
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span id={labelId}>{label}</span>
        {hint && <InfoTip text={hint} id={hintId} />}
      </div>
      {children}
    </div>
  )
}

export function GroupTitle({ children, hint }) {
  const titleId = useId()
  const hintId = `${titleId}-hint`

  return (
    <div className="flex items-center gap-1.5">
      <h4
        id={titleId}
        aria-describedby={hint ? hintId : undefined}
        className="text-xs font-bold uppercase tracking-wider text-indigo-600"
      >
        {children}
      </h4>
      {hint && <InfoTip text={hint} id={hintId} />}
    </div>
  )
}

export function OptionalLocationField({
  label,
  hint,
  checked,
  value,
  onToggle,
  onChange,
  placeholder,
}) {
  const isEnabled = checked ?? true
  const hintId = useId()

  return (
    <div
      className={`rounded-xl border p-3 transition ${
        isEnabled
          ? 'border-indigo-200 bg-white shadow-sm'
          : 'border-slate-200 bg-slate-50 text-slate-400'
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={onToggle}
            aria-describedby={hint ? hintId : undefined}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
          />
          <span>{label}</span>
        </label>
        {hint && <InfoTip text={hint} id={hintId} />}
      </div>
      <Field label="Detalle">
        <input
          aria-label={`Detalle de ${label.toLowerCase()}`}
          className={`${inputClass} ${
            !isEnabled
              ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
              : ''
          }`}
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

export default function SettingsCard({ children, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white ${className}`}>
      {children}
    </div>
  )
}
