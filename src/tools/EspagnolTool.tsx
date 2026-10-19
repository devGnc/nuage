import { useT } from '../i18n'
import { SoundsButton, SuiteButtons } from '../components/Toolbar'
import { ToolIcon } from '../shell/tools'
import { useUI } from '../store/ui'

/** Outil Espagnol. Pour l'instant une page d'attente : le moteur de révision arrive à l'étape suivante. */
export default function EspagnolTool() {
  const t = useT()
  return (
    <main
      className="stage"
      onClick={(e) => {
        const el = e.target as HTMLElement
        if (el === e.currentTarget || el.classList.contains('center')) useUI.getState().closePanel()
      }}
    >
      <header className="top" />
      <div className="center">
        <section className="surface tool-soon" aria-labelledby="es-title">
          <ToolIcon id="espagnol" large />
          <h1 id="es-title">{t('tool.espagnol')}</h1>
          <p>{t('es.soon')}</p>
          <ul>
            <li>{t('es.soon.session')}</li>
            <li>{t('es.soon.import')}</li>
            <li>{t('es.soon.goals')}</li>
          </ul>
        </section>
      </div>
      <nav className="toolbar" aria-label={t('tool.espagnol')}>
        <div className="tb-group">
          <SoundsButton />
        </div>
        <SuiteButtons />
      </nav>
    </main>
  )
}
