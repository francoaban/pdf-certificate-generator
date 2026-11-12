import InfoTip from '../../components/InfoTip'

export default function ConfigurationSettings({
  onExportConfiguration,
  onImportConfiguration,
  configurationStatus,
  configurationReady,
  importRef,
}) {
  return (
    <>
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        Exportá o importá opciones, imágenes y firmas para compartir entre
        dispositivos.
        <InfoTip text="El archivo JSON incluye las opciones, las imágenes y las firmas. Se valida antes de aplicarse." />
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onExportConfiguration}
          disabled={!configurationReady}
          className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Exportar JSON
        </button>
        <button
          type="button"
          onClick={() => importRef.current?.click()}
          disabled={!configurationReady}
          className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Importar JSON…
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            onImportConfiguration(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </div>
      {!configurationReady && (
        <p role="status" className="text-xs text-amber-700">
          Esperá a que se cargue la configuración guardada para transferir
          también las imágenes.
        </p>
      )}
      {configurationStatus && (
        <p role="status" className="text-xs text-slate-600">
          {configurationStatus}
        </p>
      )}
    </>
  )
}
