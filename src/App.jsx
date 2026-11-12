import { useMemo, useState } from 'react'
import FileUploader from './features/import/components/FileUploader'
import DataTable from './features/records/components/DataTable'
import SettingsPanel from './features/settings/SettingsPanel'
import CertificatePreview from './features/certificates/components/CertificatePreview'
import UpdatePrompt from './components/UpdatePrompt'
import { computeIssues } from './utils/issues'
import useInstallPrompt from './hooks/useInstallPrompt'
import useWorkbook from './features/import/hooks/useWorkbook'
import useSettings from './features/settings/hooks/useSettings'
import useCertificateGeneration from './features/certificates/hooks/useCertificateGeneration'
import { regenerateDuplicateCodes } from './features/records/domain/codes'

export default function App() {
  const { canInstall, install, online } = useInstallPrompt()
  const [records, setRecords] = useState([])
  const [columns, setColumns] = useState(null)
  const [usedFallback, setUsedFallback] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [previewId, setPreviewId] = useState(null)
  const [datasetVersion, setDatasetVersion] = useState(0)
  const {
    options,
    setOptions,
    storageError,
    configurationStatus,
    storageReady,
    today,
    handleImportConfiguration,
    handleExportConfiguration,
  } = useSettings()

  const applySheet = (result) => {
    setRecords(result.records)
    setColumns(result.columns)
    setUsedFallback(result.usedFallback)
    setSelected(new Set())
    setPreviewId(result.records[0]?.id ?? null)
    setDatasetVersion((version) => version + 1)
  }

  const updateRecord = (id, patch) =>
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const selectMany = (ids, checked) =>
    setSelected((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)))
      return next
    })

  // Documentos inválidos/duplicados y códigos duplicados
  const { defaultDocType } = options
  const issues = useMemo(
    () => computeIssues(records, { defaultDocType }),
    [records, defaultDocType],
  )

  const invalidCount = [...issues.values()].filter((issue) => issue.invalid).length
  const duplicateCount = [...issues.values()].filter((issue) => issue.duplicate).length
  const codeDuplicateCount = [...issues.values()].filter(
    (issue) => issue.codeDuplicate,
  ).length

  const previewRecord = records.find((r) => r.id === previewId) || records[0] || null
  const effectiveDate = options.date || today
  const previewOptions = useMemo(
    () => ({ ...options, date: effectiveDate }),
    [options, effectiveDate],
  )

  // Lote = seleccionados; si no hay ninguno, todos
  const batch = selected.size > 0 ? records.filter((r) => selected.has(r.id)) : records
  const batchLabel = selected.size > 0 ? `seleccionados (${batch.length})` : `todos (${batch.length})`

  const generation = useCertificateGeneration({ options, batch })
  const workbookData = useWorkbook({
    disabled: generation.busy,
    onRecordsLoaded: applySheet,
    onLoadFailure: () => {
      setRecords([])
      setColumns(null)
    },
  })

  const regenerateDuplicates = () =>
    setRecords((previous) => regenerateDuplicateCodes(previous))

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-10">
      {window.location.protocol !== 'file:' && <UpdatePrompt />}
      <div className="mx-auto w-full max-w-[1440px]">
        <header className="relative mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
            Generador de certificados
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Subí una planilla con nombres y apellidos (documento opcional) y descargá los certificados en PDF.
          </p>
          {canInstall && (
            <button
              type="button"
              onClick={install}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Instalar aplicación
            </button>
          )}
        </header>

        {!online && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            Sin conexión a internet. La aplicación sigue funcionando en este dispositivo.
          </div>
        )}

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] 2xl:gap-8">
          <main className="min-w-0 space-y-5">
            <div className="space-y-2">
              <FileUploader
                onFile={workbookData.handleFile}
                loading={workbookData.loading}
                disabled={generation.busy}
              />
              <div className="px-1">
                <button
                  type="button"
                  onClick={workbookData.handleTemplate}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
                >
                  <svg aria-hidden="true" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/></svg>
                  <span>Descargar planilla de ejemplo</span>
                </button>
              </div>
            </div>

            <fieldset disabled={generation.busy} className="min-w-0 space-y-4">
              <SettingsPanel
                options={options}
                onChange={setOptions}
                onExportConfiguration={handleExportConfiguration}
                onImportConfiguration={handleImportConfiguration}
                configurationStatus={configurationStatus}
                configurationReady={storageReady}
              />
            </fieldset>

            {storageError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {storageError}
              </div>
            )}

            {workbookData.error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {workbookData.error}
              </div>
            )}

            {generation.error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {generation.error}
              </div>
            )}

            {usedFallback && records.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                No se detectaron encabezados «Nombre» / «Apellido». Se usaron las primeras columnas del
                archivo; revisá que los datos sean correctos.
              </div>
            )}

            {(invalidCount > 0 || duplicateCount > 0 || codeDuplicateCount > 0) && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {invalidCount > 0 && (
                  <span>
                    <strong>{invalidCount}</strong> documento(s) con formato dudoso (en rojo).{' '}
                  </span>
                )}
                {duplicateCount > 0 && (
                  <span>
                    <strong>{duplicateCount}</strong> fila(s) con documento repetido (en ámbar).{' '}
                  </span>
                )}
                {codeDuplicateCount > 0 && (
                  <span>
                    <strong>{codeDuplicateCount}</strong> fila(s) con código de certificado repetido.{' '}
                  </span>
                )}
                Podés corregirlos directo en la tabla; igual se pueden generar.
                {codeDuplicateCount > 0 && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={regenerateDuplicates}
                      className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                    >
                      Regenerar códigos repetidos
                    </button>
                  </div>
                )}
              </div>
            )}

            {records.length > 0 && (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                  <span>
                    <span className="font-semibold">{workbookData.fileName}</span> · {records.length} registros
                  </span>
                  {workbookData.workbook && workbookData.workbook.SheetNames.length > 1 && (
                    <select
                      value={workbookData.sheetName}
                      onChange={(e) => workbookData.handleSheetChange(e.target.value)}
                      disabled={generation.busy}
                      aria-label="Hoja del archivo"
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-60"
                      title="Hoja del archivo"
                    >
                      {workbookData.workbook.SheetNames.map((n) => (
                        <option key={n} value={n}>
                          Hoja: {n}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {columns && (
                  <p className="text-xs text-slate-400">
                    Columnas: Nombre «{columns.nameKey}»
                    {columns.lastKey ? ` · Apellido «${columns.lastKey}»` : ''}
                    {columns.docKey ? ` · Documento «${columns.docKey}»` : ' · sin columna de documento'}
                    {columns.docTypeKey ? ` · Tipo «${columns.docTypeKey}»` : ''}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={generation.generateZip}
                    disabled={generation.busy}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
                  >
                    Descargar ZIP · {batchLabel}
                  </button>
                  <button
                    type="button"
                    onClick={generation.generateSinglePdf}
                    disabled={generation.busy}
                    className="rounded-lg border border-indigo-200 bg-white px-4 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-wait disabled:opacity-60 inline-flex items-center gap-1"
                  >
                    <svg aria-hidden="true" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/></svg>
                    <span>Descargar un solo PDF · {batchLabel}</span>
                  </button>
                  {selected.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelected(new Set())}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Limpiar selección
                    </button>
                  )}
                </div>

                {generation.busy && (
                  <div>
                    <div
                      role="progressbar"
                      aria-label="Progreso de generación"
                      aria-valuemin={0}
                      aria-valuemax={generation.progress?.total ?? undefined}
                      aria-valuenow={generation.progress?.done ?? undefined}
                      className="h-2 overflow-hidden rounded-full bg-slate-100"
                    >
                      <div
                        className="h-full bg-indigo-500 transition-all"
                        style={{
                          width: generation.progress
                            ? `${(generation.progress.done / generation.progress.total) * 100}%`
                            : '100%',
                        }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3 text-xs text-slate-500">
                      <p aria-live="polite">
                        {generation.progress
                          ? `Generando ${generation.progress.done} de ${generation.progress.total}…`
                          : generation.generatingId !== null
                            ? 'Generando certificado…'
                            : 'Preparando archivo…'}
                      </p>
                      <button
                        type="button"
                        onClick={generation.cancel}
                        className="font-semibold text-red-600 hover:text-red-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DataTable
              key={datasetVersion}
              records={records}
              columns={columns}
              options={options}
              issues={issues}
              selected={selected}
              onToggle={toggle}
              onSelectMany={selectMany}
              onUpdate={updateRecord}
              onGenerate={generation.generateOne}
              generatingId={generation.generatingId}
              busy={generation.busy}
              previewId={previewRecord?.id ?? null}
              onPreview={setPreviewId}
            />
          </main>

          <aside className="min-w-0 xl:sticky xl:top-6">
            <CertificatePreview record={previewRecord} options={previewOptions} />
          </aside>
        </div>
      </div>
    </div>
  )
}