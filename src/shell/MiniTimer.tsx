import { Pause, Play } from 'lucide-react'
import { useTimerView } from '../components/timer/TimerDisplay'
import { useT } from '../i18n'
import { useSettings } from '../store/settings'
import { phaseLabelKey, toggle } from '../timer/engine'
import { goTo } from './router'

/** Hors du Pomodoro : le timer en cours reste visible en haut à droite. Un clic ramène au Pomodoro. */
export function MiniTimer() {
  const t = useT()
  const { rt, text } = useTimerView()
  const timerMode = useSettings((s) => s.timerMode)
  if (rt.status === 'idle') return null
  const running = rt.status === 'running'
  const label = timerMode === 'stopwatch' ? t('phase.stopwatch') : timerMode === 'countdown' ? t('phase.countdown') : t(phaseLabelKey(timerMode, rt.phase))
  return (
    <div className={`suite-timer ${running ? '' : 'is-paused'}`}>
      <button type="button" className="suite-timer-open" onClick={() => goTo('pomodoro')} title={t('suite.openTimer')}>
        <span className={`suite-timer-dot phase-${rt.phase}`} aria-hidden="true" />
        <span className="suite-timer-label">{label}</span>
        <span className="suite-timer-time">{text}</span>
      </button>
      <button type="button" className="suite-timer-btn" onClick={toggle} aria-label={running ? t('ctl.pause') : t('ctl.start')} title={running ? t('ctl.pause') : t('ctl.start')}>
        {running ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
      </button>
    </div>
  )
}
