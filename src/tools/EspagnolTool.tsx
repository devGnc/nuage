import { GraduationCap, NotebookText, RotateCcw } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { SoundsButton, SuiteButtons } from '../components/Toolbar'
import { dueWords } from '../course/progress'
import { useT, type TKey } from '../i18n'
import { loadStudy, useStudy } from '../study/store'
import { startStudySync } from '../study/sync'
import { useUI } from '../store/ui'
import { CourseHome } from './espagnol/CourseHome'
import { LessonPlayer } from './espagnol/LessonPlayer'
import { Notebook } from './espagnol/Notebook'
import { Review } from './espagnol/Review'
import { go, useRoute, type Route, type Section } from './espagnol/sections'

const NAV: { id: Section; icon: React.ReactNode; label: TKey; to: Route }[] = [
  { id: 'course', icon: <GraduationCap size={19} />, label: 'es.course', to: { section: 'course' } },
  { id: 'review', icon: <RotateCcw size={19} />, label: 'es.review', to: { section: 'review' } },
  { id: 'notebook', icon: <NotebookText size={19} />, label: 'es.notebook', to: { section: 'notebook', tab: 'notes' } },
]

/** Outil Espagnol : un cours en leçons, la révision des mots appris et le cahier.
 *  Tout le contenu est livré avec l'app ; la progression reste sur l'appareil et se synchronise. */
export default function EspagnolTool() {
  const t = useT()
  const ready = useStudy((s) => s.ready)
  const progress = useStudy((s) => s.progress)
  const route = useRoute()
  const due = useMemo(() => (ready ? dueWords(progress).length : 0), [ready, progress])

  useEffect(() => {
    loadStudy().then(startStudySync)
  }, [])

  const view = !ready ? null
    : route.section === 'course' ? (route.lesson ? <LessonPlayer id={route.lesson} /> : <CourseHome />)
    : route.section === 'review' ? <Review />
    : <Notebook tab={route.tab} note={route.note} />

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
          {view}
        </section>
      </div>
      <nav className="toolbar" aria-label={t('tool.espagnol')}>
        <div className="tb-group">
          <SoundsButton />
        </div>
        <div className="tb-modes" role="tablist" aria-label={t('tool.espagnol')}>
          {NAV.map((n) => {
            const active = route.section === n.id
            return (
              <button
                key={n.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`tb-mode ${active ? 'active' : ''}`}
                onClick={() => go(n.to)}
                aria-label={n.id === 'review' && due ? `${t(n.label)} (${due})` : t(n.label)}
                title={t(n.label)}
              >
                {n.icon}
                {active && <span className="tb-mode-label">{t(n.label)}</span>}
                {n.id === 'review' && due > 0 && !active && <span className="tb-badge">{due > 99 ? '99+' : due}</span>}
              </button>
            )
          })}
        </div>
        <SuiteButtons />
      </nav>
    </main>
  )
}
