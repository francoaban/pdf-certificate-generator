export default function SettingsSection({
  number,
  title,
  description,
  id,
  open,
  onToggle,
  children,
}) {
  return (
    <section className="px-5 py-4">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="font-mono text-[11px] font-bold tracking-wider text-indigo-600">
          {number}
        </span>
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
          {title}
        </h3>
      </div>

      <div
        className={`rounded-xl border transition ${
          open ? 'border-indigo-200 shadow-sm' : 'border-slate-200'
        }`}
      >
        <button
          type="button"
          id={`${id}-trigger`}
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
          className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
            open
              ? 'rounded-t-xl bg-indigo-50/60'
              : 'rounded-xl bg-white hover:bg-slate-50'
          }`}
        >
          <span className="min-w-0 flex-1 text-sm font-medium text-slate-700">
            {description}
          </span>
          {open && (
            <span
              aria-hidden="true"
              className="hidden rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700 sm:inline"
            >
              Activa
            </span>
          )}
          <span
            aria-hidden="true"
            className={`shrink-0 text-xl leading-none transition-transform ${
              open ? 'rotate-90 text-indigo-500' : 'text-slate-400'
            }`}
          >
            ›
          </span>
        </button>

        {open && (
          <div
            id={id}
            role="region"
            aria-labelledby={`${id}-trigger`}
            className="space-y-6 rounded-b-xl border-t border-slate-100 bg-white p-4"
          >
            {children}
          </div>
        )}
      </div>
    </section>
  )
}
