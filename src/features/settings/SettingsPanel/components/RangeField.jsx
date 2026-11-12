import { useId } from 'react'
import {
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  FONT_SIZE_STEP,
} from '../../../../certificates/defaults.js'
import InfoTip from '../../components/InfoTip'

export default function RangeField({
  label,
  value,
  onChange,
  disabled = false,
  hint,
}) {
  const current = value ?? 100
  const hintId = useId()

  return (
    <div className={`space-y-1 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>{label}</span>
          {hint && <InfoTip text={hint} id={hintId} />}
        </span>
        <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-xs font-semibold text-indigo-700">
          {current}%
        </span>
      </div>
      <input
        type="range"
        min={FONT_SIZE_MIN}
        max={FONT_SIZE_MAX}
        step={FONT_SIZE_STEP}
        value={current}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full cursor-pointer accent-indigo-600 disabled:cursor-not-allowed"
        aria-label={label}
        aria-describedby={hint ? hintId : undefined}
        aria-valuetext={`${current} por ciento`}
      />
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{FONT_SIZE_MIN}%</span>
        <span>{FONT_SIZE_MAX}%</span>
      </div>
    </div>
  )
}
