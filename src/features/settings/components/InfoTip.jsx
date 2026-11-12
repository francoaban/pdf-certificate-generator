export default function InfoTip({ text, id, className = '' }) {
  return (
    <span className={`group relative inline-flex align-middle ${className}`}>
      <span
        tabIndex={0}
        role="note"
        aria-label="Mostrar información"
        aria-describedby={id}
        onClick={(event) => event.preventDefault()}
        className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-300 bg-white text-[9px] font-bold leading-none text-slate-500 outline-none transition hover:border-indigo-300 hover:text-indigo-600 focus:border-indigo-400 focus:text-indigo-600"
      >
        ?
      </span>
      <span
        role="tooltip"
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-full z-40 mt-1.5 w-56 -translate-x-1/2 rounded-lg bg-slate-800 px-3 py-2 text-left text-[11px] font-normal normal-case leading-snug tracking-normal text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
      {id && (
        <span id={id} className="sr-only">
          {text}
        </span>
      )}
    </span>
  )
}
