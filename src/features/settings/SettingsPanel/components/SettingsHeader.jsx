export default function SettingsHeader({ sections, openSection, onToggle }) {
  return (
    <>
      <header className="px-5 py-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800">
          Configuración del certificado
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Personalizá el diseño y el contenido de tus certificados.
        </p>
      </header>

      <nav
        aria-label="Secciones de configuración"
        className="flex flex-wrap gap-1.5 border-y border-slate-200 px-5 py-3"
      >
        {sections.map((section) => {
          const active = openSection === section.id
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onToggle(section.id)}
              aria-current={active ? 'true' : undefined}
              aria-expanded={active}
              aria-controls={section.id}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                active
                  ? 'border-indigo-300 bg-indigo-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'
              }`}
            >
              <span
                className={`font-mono text-[10px] ${
                  active ? 'text-indigo-100' : 'text-slate-400'
                }`}
              >
                {section.number}
              </span>
              {section.title}
            </button>
          )
        })}
      </nav>
    </>
  )
}
