import { Cloud, House, Lightbulb, ListTodo, Maximize, Minimize, Music, PenLine, Settings } from 'lucide-react'
import { usePlayback } from '../audio/mixer'
import { useT } from '../i18n'
import { toggleFullscreen } from '../lib/browser'
import { currentStreak } from '../lib/stats'
import { useMusic } from '../music/store'
import { useSettings } from '../store/settings'
import { useStats } from '../store/stats'
import { useUI } from '../store/ui'
import type { Mode } from '../types'
import { openSettingsDefault } from './settings/tabs'

export function setMode(mode: Mode) {
  useSettings.getState().set({ mode })
}

/** Sons et musique : communs à toute la suite, ils continuent quand on change d'outil. */
export function SoundsButton() {
  const t = useT()
  const open = useUI((s) => s.panel === 'sounds')
  const playing = usePlayback((s) => s.playing)
  const hasMix = useSettings((s) => Object.keys(s.mix).length > 0)
  const musicOn = useMusic((s) => !!s.current)
  return (
    <button type="button" className={`tb-btn ${open ? 'active' : ''}`} onClick={() => useUI.getState().togglePanel('sounds')} aria-label={t('tb.sounds')} title={t('tb.sounds')}>
      <Music size={19} />
      {((playing && hasMix) || musicOn) && <span className="tb-dot" aria-label={t('tb.playing')} />}
    </button>
  )
}

/** Réglages et plein écran : la partie droite de la barre, identique dans tous les outils. */
export function SuiteButtons() {
  const t = useT()
  const fullscreen = useUI((s) => s.fullscreen)
  return (
    <div className="tb-group">
      <button type="button" className="tb-btn" onClick={openSettingsDefault} aria-label={t('tb.settings')} title={t('tb.settings')}>
        <Settings size={19} />
      </button>
      <button type="button" className="tb-btn hide-mobile" onClick={toggleFullscreen} aria-label={t('tb.fullscreen')} title={t('tb.fullscreen')}>
        {fullscreen ? <Minimize size={19} /> : <Maximize size={19} />}
      </button>
    </div>
  )
}

export function Toolbar() {
  const t = useT()
  const panel = useUI((s) => s.panel)
  const togglePanel = useUI((s) => s.togglePanel)
  const mode = useSettings((s) => s.mode)
  const showStreak = useSettings((s) => s.showStreak)
  const weekendsSafe = useSettings((s) => s.weekendsSafe)
  const activeDays = useStats((s) => s.activeDays)
  const streak = currentStreak(activeDays, weekendsSafe)
  const modes: { m: Mode; icon: React.ReactNode }[] = [
    { m: 'ambient', icon: <Cloud size={19} /> },
    { m: 'home', icon: <House size={19} /> },
    { m: 'focus', icon: <Lightbulb size={19} /> },
  ]
  return (
    <nav className="toolbar" aria-label={t('tool.pomodoro')}>
      <div className="tb-group">
        <button type="button" className={`tb-btn ${panel === 'tasks' ? 'active' : ''}`} onClick={() => togglePanel('tasks')} aria-label={t('tb.tasks')} title={t('tb.tasks')}>
          <ListTodo size={19} />
        </button>
        <SoundsButton />
        <button type="button" className={`tb-btn ${panel === 'notes' ? 'active' : ''}`} onClick={() => togglePanel('notes')} aria-label={t('tb.notes')} title={t('tb.notes')}>
          <PenLine size={19} />
        </button>
        {showStreak && mode === 'focus' && (
          <button type="button" className="tb-btn tb-streak" title={t('tb.streak')} aria-label={`${t('tb.streak')} : ${streak}`} onClick={() => useUI.getState().openSettings('stats')}>
            <span>🔥</span>
            <span>{streak}</span>
          </button>
        )}
      </div>
      <div className="tb-modes" role="tablist" aria-label="Modes">
        {modes.map(({ m, icon }) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} className={`tb-mode ${mode === m ? 'active' : ''}`} onClick={() => setMode(m)} aria-label={t(`mode.${m}`)} title={t(`mode.${m}`)}>
            {icon}
            {mode === m && <span className="tb-mode-label">{t(`mode.${m}`)}</span>}
          </button>
        ))}
      </div>
      <SuiteButtons />
    </nav>
  )
}
