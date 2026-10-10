import { Check, Pause, PictureInPicture2, Play, RotateCcw, SkipForward } from 'lucide-react'
import { useT } from '../../i18n'
import { useSettings } from '../../store/settings'
import { useTimer } from '../../store/timer'
import { useUI } from '../../store/ui'
import { finishStopwatch, phaseLabelKey, phasesFor, reset, setPhase, skip, toggle } from '../../timer/engine'

export function TimerControls({ compact = false }: { compact?: boolean }) {
  const t = useT()
  const status = useTimer((s) => s.status)
  const mode = useSettings((s) => s.timerMode)
  const running = status === 'running'
  const pipOpen = useUI((s) => s.pipOpen)
  return (
    <div className={`controls ${compact ? 'compact' : ''}`}>
      <button type="button" className="ctl ctl-main" onClick={toggle} aria-label={running ? t('ctl.pause') : t('ctl.start')} title={running ? t('ctl.pause') : t('ctl.start')}>
        {running ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
      </button>
      {!compact && (
        <>
          <button type="button" className="ctl" onClick={reset} aria-label={t('ctl.reset')} title={t('ctl.reset')}>
            <RotateCcw size={19} />
          </button>
          {mode === 'stopwatch' ? (
            <button type="button" className="ctl" onClick={finishStopwatch} aria-label={t('ctl.finish')} title={t('ctl.finish')} disabled={status === 'idle'}>
              <Check size={20} />
            </button>
          ) : (
            <button type="button" className="ctl" onClick={skip} aria-label={t('ctl.skip')} title={t('ctl.skip')}>
              <SkipForward size={19} />
            </button>
          )}
          <button type="button" className={`ctl ${pipOpen ? 'active' : ''}`} onClick={() => useUI.setState({ pipOpen: !pipOpen })} aria-label={t('ctl.pip')} title={t('ctl.pip')}>
            <PictureInPicture2 size={19} />
          </button>
        </>
      )}
    </div>
  )
}

export function PhaseTabs() {
  const t = useT()
  const mode = useSettings((s) => s.timerMode)
  const phase = useTimer((s) => s.phase)
  const phases = phasesFor(mode)
  if (mode === 'stopwatch' || mode === 'countdown') {
    return <div className="phase-tabs single"><span className="phase-tab active">{t(mode === 'stopwatch' ? 'phase.stopwatch' : 'phase.countdown')}</span></div>
  }
  return (
    <div className="phase-tabs" role="tablist">
      {phases.map((p) => (
        <button key={p} type="button" role="tab" aria-selected={phase === p} className={`phase-tab ${phase === p ? 'active' : ''}`} onClick={() => setPhase(p)}>
          {t(phaseLabelKey(mode, p))}
        </button>
      ))}
    </div>
  )
}

export function Tallies() {
  const t = useT()
  const mode = useSettings((s) => s.timerMode)
  const every = useSettings((s) => s.lengths.longEvery)
  const icon = useSettings((s) => s.tallyIcon)
  const cycle = useTimer((s) => s.cycle)
  if (mode === 'stopwatch') return <div className="tallies" />
  if (mode !== 'pomodoro') {
    return <div className="tallies text">{t('phase.session', { n: cycle + 1 })}</div>
  }
  const filled = cycle % every === 0 && cycle > 0 ? every : cycle % every
  return (
    <div className="tallies" aria-label={`${filled}/${every}`}>
      {Array.from({ length: every }, (_, i) =>
        icon === 'dots' ? (
          <span key={i} className={`tally-dot ${i < filled ? 'on' : ''}`} />
        ) : (
          <span key={i} className={`tally-emoji ${i < filled ? 'on' : ''}`}>{icon}</span>
        ),
      )}
    </div>
  )
}
