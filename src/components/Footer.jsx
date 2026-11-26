const CONTACT_EMAIL = 'francoaban@gmail.com'

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
      <p>
        Por Consultas o sugerencias escriba a {' '}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
      </p>
    </footer>
  )
}
