import { BookOpen, CalendarCheck, FileUp, Layers } from 'lucide-react'
import { useEffect } from 'react'
import { SoundsButton, SuiteButtons } from '../components/Toolbar'
import { useT, type TKey } from '../i18n'
import { loadStudy, useStudy } from '../study/store'
import { startStudySync } from '../study/sync'
import { useUI } from '../store/ui'
import { Cards } from './espagnol/Cards'
import { Import } from './espagnol/Import'
import { Notes } from './espagnol/Notes'
import { goSection, useSection, type Section } from './espagnol/sections'
import { Today } from './espagnol/Today'

const NAV: { id: Section; icon: React.ReactNode; label: TKey }[] = [
  { id: 'today', icon: <CalendarCheck size={19} />, label: 'es.today' },
  { id: 'cards', icon: <Layers size={19} />, label: 'es.cards' },
  { id: 'notes', icon: <BookOpen size={19} />, label: 'es.notes' },
  { id: 'import', icon: <FileUp size={19} />, label: 'es.import' },
]

/** Outil Espagnol : séance du jour, cartes, fiches et import. Les données restent sur l'appareil et se synchronisent. */
export default function EspagnolTool() {
  const t = useT()
  const ready = useStudy((s) => s.ready)
  const section = useSection()

  useEffect(() => {
    loadStudy().then(startStudySync)
  }, [])

  return (
    <main
      className="stage"
      onClick={(e) => {
        const el = e.target as HTMLElement
        if (el === e.currentTarget || el.classList.contains('center')) useUI.getState().closePanel()
      }}
    >
      <header className="top" />
      <div className="center es-center">
        <section className="surface es-panel" aria-label={t('tool.espagnol')}>
          {!ready ? null : section === 'today' ? <Today /> : section === 'cards' ? <Cards /> : section === 'notes' ? <Notes /> : <Import />}
        </section>
      </div>
      <nav className="toolbar" aria-label={t('tool.espagnol')}>
        <div className="tb-group">
          <SoundsButton />
        </div>
        <div className="tb-modes" role="tablist" aria-label={t('tool.espagnol')}>
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              role="tab"
              aria-selected={section === n.id}
              className={`tb-mode ${section === n.id ? 'active' : ''}`}
              onClick={() => goSection(n.id)}
              aria-label={t(n.label)}
              title={t(n.label)}
            >
              {n.icon}
              {section === n.id && <span className="tb-mode-label">{t(n.label)}</span>}
            </button>
          ))}
        </div>
        <SuiteButtons />
      </nav>
    </main>
  )
}
