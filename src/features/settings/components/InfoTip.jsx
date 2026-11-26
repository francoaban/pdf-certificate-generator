import { useLayoutEffect, useRef } from 'react'

export default function InfoTip({ text, id, className = '' }) {
  const wrapperRef = useRef(null)
  const triggerRef = useRef(null)
  const tooltipRef = useRef(null)

  useLayoutEffect(() => {
    const positionTooltip = () => {
      const wrapper = wrapperRef.current
      const trigger = triggerRef.current
      const tooltip = tooltipRef.current
      if (!wrapper || !trigger || !tooltip) return

      const tooltipWidth = tooltip.getBoundingClientRect().width
      const triggerBounds = trigger.getBoundingClientRect()
      const maximumLeft = window.innerWidth - tooltipWidth - 8
      const desiredLeft =
        triggerBounds.left + triggerBounds.width / 2 - tooltipWidth / 2
      const left = Math.max(8, Math.min(desiredLeft, maximumLeft))
      tooltip.style.left = `${left - wrapper.getBoundingClientRect().left}px`
      tooltip.style.transform = 'none'
    }

    positionTooltip()
    window.addEventListener('resize', positionTooltip)
    return () => window.removeEventListener('resize', positionTooltip)
  }, [])

  return (
    <span
      ref={wrapperRef}
      className={`group relative inline-flex align-middle ${className}`}
    >
      <span
        ref={triggerRef}
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
        ref={tooltipRef}
        role="tooltip"
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-full z-40 mt-1.5 w-56 max-w-[calc(100vw-1rem)] -translate-x-1/2 rounded-lg bg-slate-800 px-3 py-2 text-left text-[11px] font-normal normal-case leading-snug tracking-normal text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
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
