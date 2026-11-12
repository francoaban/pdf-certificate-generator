import { useRef, useState } from 'react'
import { DEFAULT_OPTIONS } from '../../../certificates/defaults.js'
import { CERTIFICATE_STYLES } from '../../../certificates/styles/index'
import SettingsHeader from './components/SettingsHeader'
import SettingsSection from './components/SettingsSection'
import ConfigurationSettings from './sections/ConfigurationSettings'
import ContentSettings from './sections/ContentSettings'
import DateSignatureSettings from './sections/DateSignatureSettings'
import DesignSettings from './sections/DesignSettings'
import ParticipantSettings from './sections/ParticipantSettings'

const SECTIONS = [
  {
    id: 'settings-content',
    number: '01',
    title: 'Contenido',
    description: 'Editar textos y tipografías',
  },
  {
    id: 'settings-participant',
    number: '02',
    title: 'Participante',
    description: 'Nombre, documento y formato',
  },
  {
    id: 'settings-design',
    number: '03',
    title: 'Diseño',
    description: 'Estilo, fondo, logo y colores',
  },
  {
    id: 'settings-date-signature',
    number: '04',
    title: 'Fecha y firmas',
    description: 'Configurar fecha, ubicación y firmas',
  },
  {
    id: 'settings-configuration',
    number: '05',
    title: 'Configuración',
    description: 'Importar y exportar configuración',
  },
]

export default function SettingsPanel({
  options,
  onChange,
  onExportConfiguration,
  onImportConfiguration,
  configurationStatus,
  configurationReady = true,
}) {
  const [openSection, setOpenSection] = useState(null)
  const importRef = useRef(null)
  const selectedStyle =
    CERTIFICATE_STYLES.find((style) => style.id === options.style) ||
    CERTIFICATE_STYLES[0]
  const set = (key) => (e) => onChange({ ...options, [key]: e.target.value })
  const setChecked = (key) => (e) =>
    onChange({ ...options, [key]: e.target.checked })

  const toggleSection = (id) =>
    setOpenSection((current) => (current === id ? null : id))

  const resetOptions = () => {
    if (
      typeof window === 'undefined' ||
      window.confirm(
        '¿Restaurar todos los valores por defecto? Se perderán los textos, el logo y las firmas actuales.',
      )
    ) {
      onChange({ ...DEFAULT_OPTIONS })
    }
  }

  const sectionProps = (section) => ({
    ...section,
    open: openSection === section.id,
    onToggle: () => toggleSection(section.id),
  })

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <SettingsHeader
        sections={SECTIONS}
        openSection={openSection}
        onToggle={toggleSection}
      />

      <div className="divide-y divide-slate-100">
        <SettingsSection {...sectionProps(SECTIONS[0])}>
          <ContentSettings options={options} onChange={onChange} set={set} />
        </SettingsSection>

        <SettingsSection {...sectionProps(SECTIONS[1])}>
          <ParticipantSettings
            options={options}
            onChange={onChange}
            set={set}
          />
        </SettingsSection>

        <SettingsSection {...sectionProps(SECTIONS[2])}>
          <DesignSettings
            options={options}
            onChange={onChange}
            set={set}
            setChecked={setChecked}
            selectedStyle={selectedStyle}
          />
        </SettingsSection>

        <SettingsSection {...sectionProps(SECTIONS[3])}>
          <DateSignatureSettings
            options={options}
            onChange={onChange}
            set={set}
            setChecked={setChecked}
          />
        </SettingsSection>

        <SettingsSection {...sectionProps(SECTIONS[4])}>
          <ConfigurationSettings
            onExportConfiguration={onExportConfiguration}
            onImportConfiguration={onImportConfiguration}
            configurationStatus={configurationStatus}
            configurationReady={configurationReady}
            importRef={importRef}
          />
        </SettingsSection>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-slate-200 bg-slate-50/70 px-5 py-3">
        <p className="text-xs text-slate-500">
          Los cambios se guardan automáticamente en este dispositivo.
        </p>
        <button
          type="button"
          onClick={resetOptions}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <span aria-hidden="true">↺</span>
          Restaurar configuración
        </button>
      </footer>
    </div>
  )
}
