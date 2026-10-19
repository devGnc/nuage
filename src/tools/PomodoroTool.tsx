import { Suspense, lazy } from 'react'
import { AmbientView, FocusView } from '../components/FocusView'
import { HomeView } from '../components/HomeView'
import { QuoteLine } from '../components/QuoteLine'
import { TasksPanel } from '../components/TasksPanel'
import { Toolbar } from '../components/Toolbar'
import { useMountedOnce } from '../shell/hooks'
import { useSettings } from '../store/settings'
import { useUI } from '../store/ui'

const NotesPanel = lazy(() => import('../components/NotesPanel').then((m) => ({ default: m.NotesPanel })))

/** Le Pomodoro : trois modes (Accueil, Focus, Ambiance), tâches et bloc-notes. */
export function PomodoroTool() {
  const mode = useSettings((s) => s.mode)
  const quotesFocus = useSettings((s) => s.quotesFocus)
  const quotesHome = useSettings((s) => s.quotesHome)
  const notesReady = useMountedOnce(useUI((s) => s.panel === 'notes'))
  const showQuote = (mode === 'focus' && quotesFocus) || (mode === 'home' && quotesHome)

  return (
    <>
      <main
        className="stage"
        onClick={(e) => {
          const el = e.target as HTMLElement
          if (el === e.currentTarget || el.classList.contains('center')) useUI.getState().closePanel()
        }}
      >
        <header className="top">{showQuote && <QuoteLine />}</header>
        <div className="center">
          {mode === 'home' && <HomeView />}
          {mode === 'focus' && <FocusView />}
          {mode === 'ambient' && <AmbientView />}
        </div>
        <Toolbar />
      </main>
      <TasksPanel />
      <Suspense fallback={null}>{notesReady && <NotesPanel />}</Suspense>
    </>
  )
}
