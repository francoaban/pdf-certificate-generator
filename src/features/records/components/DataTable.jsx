import { useMemo, useRef, useState } from 'react'
import { DOC_TYPES, DOC_TYPE_IDS, cleanDocument, effectiveDocType, formatDocument } from '../../../utils/documents'
import { generateCertificateCode } from '../../../utils/records'
import { normalizeDate } from '../../../utils/dates'
import { applyCase, normalizeText } from '../../../utils/text'

const PAGE_SIZE = 25

function EditableCell({ value, display, onCommit, invalid, warn, title, placeholder, mono }) {
  const [draft, setDraft] = useState(null)
  const cancelled = useRef(false)

  const tone = invalid
    ? 'border-red-300 bg-red-50 text-red-700'
    : warn
      ? 'border-amber-300 bg-amber-50 text-amber-800'
      : 'border-transparent bg-transparent text-slate-800 hover:border-slate-200'

  return (
    <input
      value={draft !== null ? draft : (display ?? value)}
      title={title}
      placeholder={placeholder}
      onFocus={() => {
        cancelled.current = false
        setDraft(value)
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (!cancelled.current && draft !== null && draft !== value) onCommit(draft)
        setDraft(null)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') {
          cancelled.current = true
          e.currentTarget.blur()
        }
      }}
      className={`w-full rounded-md border px-2 py-1 outline-none focus:border-indigo-500 focus:bg-white focus:text-slate-800 ${
        mono ? 'font-mono text-xs' : 'text-sm'
      } ${tone}`}
    />
  )
}

export default function DataTable({
  records,
  columns,
  options,
  issues,
  selected,
  onToggle,
  onSelectMany,
  onUpdate,
  onGenerate,
  generatingId,
  busy,
  previewId,
  onPreview,
}) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const q = normalizeText(query)
    const qDigits = query.replace(/\D/g, '')
    const items = records.map((r, i) => ({ r, i }))
    if (!q) return items
    return items.filter(({ r }) => {
      const hay = normalizeText(
        `${r.nombre} ${r.apellido} ${r.curso} ${r.horas} ${r.fecha} ${r.instructor} ${r.codigo}`,
      )
      return hay.includes(q) || (qDigits.length >= 3 && String(r.docNumber || '').includes(qDigits))
    })
  }, [records, query])

  if (!records.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-slate-500">Todavía no hay datos. Cargá un archivo para ver la previsualización.</p>
      </div>
    )
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, totalPages - 1)
  const pageItems = filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)
  const filteredIds = filtered.map(({ r }) => r.id)
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selected.has(id))
  const extraColumns = [
    { key: 'curso', header: 'Curso', source: columns?.courseKey },
    { key: 'horas', header: 'Horas', source: columns?.hoursKey },
    { key: 'fecha', header: 'Fecha', source: columns?.dateKey },
    { key: 'instructor', header: 'Instructor', source: columns?.instructorKey },
    { key: 'codigo', header: 'Código', source: true },
  ].filter((column) => column.source)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(0)
          }}
          placeholder="Buscar por nombre o documento…"
          aria-label="Buscar certificados"
          className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        <span className="text-xs text-slate-500">
          {filtered.length} de {records.length} · Podés editar las celdas
        </span>
      </div>

      <div className="max-h-[32rem] overflow-auto">
        <table className={`w-full ${extraColumns.length ? 'min-w-[70rem]' : 'min-w-[46rem]'} text-left text-sm`}>
          <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => onSelectMany(filteredIds, !allSelected)}
                  title="Seleccionar todos (según el filtro)"
                  aria-label="Seleccionar todos los certificados visibles"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
              </th>
              <th scope="col" className="px-2 py-3">#</th>
              <th scope="col" className="px-2 py-3">Nombre</th>
              <th scope="col" className="px-2 py-3">Apellido</th>
              <th scope="col" className="px-2 py-3">Tipo doc.</th>
              <th scope="col" className="px-2 py-3">Documento</th>
              {extraColumns.map((column) => (
                <th key={column.key} scope="col" className="px-2 py-3">{column.header}</th>
              ))}
              <th scope="col" className="px-4 py-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageItems.map(({ r, i }) => {
              const type = effectiveDocType(r, options)
              const issue = issues.get(r.id)
              const isPreview = previewId === r.id
              return (
                <tr
                  key={r.id}
                  className={isPreview ? 'bg-indigo-50' : selected.has(r.id) ? 'bg-indigo-50/50' : ''}
                >
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => onToggle(r.id)}
                      aria-label={`Seleccionar certificado de ${[r.nombre, r.apellido].filter(Boolean).join(' ')}`}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                    />
                  </td>
                  <td className="px-2 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-1 py-1">
                    <EditableCell
                      value={r.nombre}
                      display={applyCase(r.nombre, options.caseMode)}
                      onCommit={(v) => onUpdate(r.id, { nombre: v.trim() })}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <EditableCell
                      value={r.apellido}
                      display={applyCase(r.apellido, options.caseMode)}
                      onCommit={(v) => onUpdate(r.id, { apellido: v.trim() })}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <select
                      value={type}
                      onChange={(e) =>
                        onUpdate(r.id, {
                          docType: e.target.value,
                          docNumber: cleanDocument(r.docNumber, e.target.value),
                        })
                      }
                      aria-label={`Tipo de documento de ${[r.nombre, r.apellido].filter(Boolean).join(' ')}`}
                      className="w-full rounded-md border border-transparent bg-transparent px-1 py-1 text-sm text-slate-700 outline-none hover:border-slate-200 focus:border-indigo-500"
                    >
                      {DOC_TYPE_IDS.map((id) => (
                        <option key={id} value={id}>
                          {DOC_TYPES[id].label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-1 py-1">
                    <EditableCell
                      value={formatDocument(r.docNumber, type, { dots: options.docDots })}
                      placeholder="—"
                      invalid={!!issue?.invalid}
                      warn={!issue?.invalid && issue?.duplicate}
                      title={issue?.invalid || (issue?.duplicate ? 'Documento duplicado' : '')}
                      onCommit={(v) => onUpdate(r.id, { docNumber: cleanDocument(v, type) })}
                    />
                  </td>
                  {extraColumns.map((column) => (
                    <td key={column.key} className="px-1 py-1">
                      <EditableCell
                        value={column.key === 'codigo' ? r.codigo || '' : r[column.key] || ''}
                        display={
                          column.key === 'fecha' ? normalizeDate(r.fecha) : undefined
                        }
                        placeholder="—"
                        mono={column.key === 'codigo'}
                        warn={column.key === 'codigo' && issue?.codeDuplicate}
                        title={
                          column.key === 'codigo' && issue?.codeDuplicate
                            ? 'Código de certificado duplicado'
                            : undefined
                        }
                        onCommit={(value) =>
                          onUpdate(r.id, {
                            [column.key]:
                              column.key === 'codigo'
                                ? value.trim() || generateCertificateCode()
                                : value.trim(),
                          })
                        }
                      />
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-2 text-left">
                    <button
                      type="button"
                      onClick={() => onPreview(r.id)}
                      aria-label={`Ver certificado de ${[r.nombre, r.apellido].filter(Boolean).join(' ')}`}
                      className={`mr-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                        isPreview
                          ? 'border-indigo-300 bg-indigo-100 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Vista previa
                    </button>
                    <button
                      type="button"
                      onClick={() => onGenerate(r)}
                      disabled={busy || generatingId === r.id}
                      aria-label={`Descargar PDF de ${[r.nombre, r.apellido].filter(Boolean).join(' ')}`}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60 inline-flex items-center gap-1"
                    >
                      <svg aria-hidden="true" className="h-3 w-3 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/></svg>
                      <span>{generatingId === r.id ? 'Generando…' : 'Certificado'}</span>
                    </button>
                  </td>
                </tr>
              )
            })}
            {!pageItems.length && (
              <tr>
                <td colSpan={7 + extraColumns.length} className="px-4 py-8 text-center text-slate-400">
                  Sin resultados para «{query}».
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
          <button
            type="button"
            onClick={() => setPage(Math.max(0, current - 1))}
            disabled={current === 0}
            className="rounded-md px-2 py-1 font-semibold hover:bg-slate-100 disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span>
            Página {current + 1} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage(Math.min(totalPages - 1, current + 1))}
            disabled={current >= totalPages - 1}
            className="rounded-md px-2 py-1 font-semibold hover:bg-slate-100 disabled:opacity-40"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}