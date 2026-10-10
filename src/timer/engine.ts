import { playAlert } from '../audio/alerts'
import { resumeAudio } from '../audio/engine'
import { t } from '../i18n'
import { celebrate, notify } from '../lib/browser'
import { fmtHuman } from '../lib/time'
import { useSettings } from '../store/settings'
import { useStats } from '../store/stats'
import { currentTask, remainingMs, useTasks } from '../store/tasks'
import { initialRuntime, useTimer, type TimerRuntime } from '../store/timer'
import { useUI } from '../store/ui'
import type { Phase, TimerMode } from '../types'

const MIN = 60000

export function phasesFor(mode: TimerMode): Phase[] {
  switch (mode) {
    case 'pomodoro': return ['focus', 'short', 'long']
    case 'animedoro': return ['focus', 'long']
    case 'fiftytwo': return ['focus', 'short']
    default: return ['focus']
  }
}

export function phaseLabelKey(mode: TimerMode, phase: Phase) {
  if (phase === 'focus') return 'phase.focus' as const
  if (mode === 'animedoro') return 'phase.watch' as const
  if (mode === 'fiftytwo') return 'phase.break' as const
  return phase === 'short' ? ('phase.short' as const) : ('phase.long' as const)
}

/** Durée prévue d'un segment, en ms. */
export function durationFor(phase: Phase): number {
  const s = useSettings.getState()
  const L = s.lengths
  if (s.taskEtaMode && phase === 'focus' && s.timerMode !== 'stopwatch') {
    const task = currentTask(useTasks.getState().tasks)
    if (task?.estimateMin) return Math.max(MIN, remainingMs(task))
  }
  switch (s.timerMode) {
    case 'pomodoro': return (phase === 'focus' ? L.focus : phase === 'short' ? L.short : L.long) * MIN
    case 'animedoro': return (phase === 'focus' ? L.animeFocus : L.animeWatch) * MIN
    case 'fiftytwo': return (phase === 'focus' ? L.ftFocus : L.ftBreak) * MIN
    case 'countdown': return L.countdown * MIN
    case 'stopwatch': return 0
  }
}

export const isStopwatch = () => useSettings.getState().timerMode === 'stopwatch'

/** Temps à afficher : restant (à rebours) ou écoulé (chronomètre). */
export function displayMs(rt: TimerRuntime): number {
  if (isStopwatch()) return rt.elapsed + (rt.status === 'running' && rt.runStart ? rt.now - rt.runStart : 0)
  if (rt.status === 'running' && rt.endAt) return Math.max(0, rt.endAt - rt.now)
  if (rt.status === 'paused') return rt.remaining
  return durationFor(rt.phase)
}

/** Avancement du segment entre 0 et 1. */
export function progressOf(rt: TimerRuntime): number {
  if (isStopwatch()) {
    // le chronomètre fait un tour de cadran par heure
    return (displayMs(rt) % (60 * MIN)) / (60 * MIN)
  }
  const total = rt.status === 'idle' ? durationFor(rt.phase) : rt.segRunMs + displayMs(rt) + (rt.status === 'running' && rt.runStart ? rt.now - rt.runStart : 0)
  if (total <= 0) return 0
  return Math.min(1, Math.max(0, 1 - displayMs(rt) / total))
}

function runMs(rt: TimerRuntime, now: number) {
  return rt.segRunMs + (rt.status === 'running' && rt.runStart ? now - rt.runStart : 0)
}

function logFocus(ms: number, completed: boolean, end: number) {
  if (ms <= 0) return
  const task = currentTask(useTasks.getState().tasks)
  useStats.getState().logSession({ type: 'focus', start: end - ms, end, ms, completed, taskTitle: task?.title })
  if (task) useTasks.getState().addFocus(task.id, ms)
}

function logBreak(ms: number, end: number) {
  if (ms <= 0) return
  useStats.getState().logSession({ type: 'break', start: end - ms, end, ms, completed: true })
}

/** Enregistre ce qui a été fait d'un segment interrompu (≥ 1 min de focus, ≥ 30 s de pause). */
function flushPartial(now = Date.now()) {
  const rt = useTimer.getState()
  if (rt.status === 'idle') return
  const ms = runMs(rt, now)
  if (isStopwatch()) {
    if (ms >= MIN) {
      logFocus(ms, ms >= 10 * MIN, now)
      useUI.getState().showToast(t('toast.sessionSaved', { time: fmtHuman(ms) }))
    }
    return
  }
  if (rt.phase === 'focus' && ms >= MIN) logFocus(ms, false, now)
  if (rt.phase !== 'focus' && ms >= 30000) logBreak(ms, now)
}

export function start() {
  const now = Date.now()
  const rt = useTimer.getState()
  if (rt.status === 'running') return
  resumeAudio()
  if (isStopwatch()) {
    useTimer.setState({ status: 'running', runStart: now, segStartedAt: rt.segStartedAt ?? now, now })
  } else if (rt.status === 'paused') {
    useTimer.setState({ status: 'running', runStart: now, endAt: now + rt.remaining, now })
  } else {
    useTimer.setState({ status: 'running', runStart: now, endAt: now + durationFor(rt.phase), segRunMs: 0, segStartedAt: now, now })
  }
  if (rt.phase === 'focus') useStats.getState().markActive(now)
}

export function pause() {
  const now = Date.now()
  const rt = useTimer.getState()
  if (rt.status !== 'running' || !rt.runStart) return
  const add = now - rt.runStart
  if (isStopwatch()) {
    useTimer.setState({ status: 'paused', elapsed: rt.elapsed + add, segRunMs: rt.segRunMs + add, runStart: null, now })
  } else {
    useTimer.setState({ status: 'paused', remaining: Math.max(0, (rt.endAt ?? now) - now), segRunMs: rt.segRunMs + add, runStart: null, endAt: null, now })
  }
}

export function toggle() {
  if (useTimer.getState().status === 'running') pause()
  else start()
}

function idleAt(phase: Phase, extra: Partial<TimerRuntime> = {}) {
  useTimer.setState({ phase, status: 'idle', endAt: null, remaining: 0, elapsed: 0, runStart: null, segRunMs: 0, segStartedAt: null, ...extra })
}

export function reset() {
  flushPartial()
  idleAt(useTimer.getState().phase)
}

/** Termine et enregistre une session de chronomètre. */
export function finishStopwatch() {
  reset()
}

function nextPhase(after: Phase, completedFocus: boolean): { phase: Phase; cycle: number } {
  const s = useSettings.getState()
  const rt = useTimer.getState()
  let cycle = rt.cycle
  switch (s.timerMode) {
    case 'pomodoro':
      if (after === 'focus') {
        if (completedFocus) cycle += 1
        return cycle > 0 && cycle % Math.max(1, s.lengths.longEvery) === 0 && completedFocus ? { phase: 'long', cycle } : { phase: 'short', cycle }
      }
      if (after === 'long') return { phase: 'focus', cycle: 0 }
      return { phase: 'focus', cycle }
    case 'animedoro':
      if (after === 'focus') return { phase: 'long', cycle: completedFocus ? cycle + 1 : cycle }
      return { phase: 'focus', cycle }
    case 'fiftytwo':
      if (after === 'focus') return { phase: 'short', cycle: completedFocus ? cycle + 1 : cycle }
      return { phase: 'focus', cycle }
    default:
      return { phase: 'focus', cycle: completedFocus ? cycle + 1 : cycle }
  }
}

export function skip() {
  if (isStopwatch()) return
  flushPartial()
  const rt = useTimer.getState()
  const { phase, cycle } = nextPhase(rt.phase, false)
  idleAt(phase, { cycle })
}

export function setPhase(phase: Phase) {
  const rt = useTimer.getState()
  if (rt.phase === phase && rt.status === 'idle') return
  flushPartial()
  idleAt(phase)
}

/** À appeler quand le mode de timer change dans les réglages. */
export function changeMode() {
  flushPartial()
  idleAt('focus', { cycle: 0 })
}

function complete(now: number) {
  const rt = useTimer.getState()
  const s = useSettings.getState()
  const end = rt.endAt ?? now
  const ms = runMs(rt, end)
  const wasFocus = rt.phase === 'focus'
  if (wasFocus) logFocus(ms, true, end)
  else logBreak(ms, end)

  playAlert(s.alertSound, s.alertVolume)
  if (s.notifications) {
    if (wasFocus) notify(t('notif.focusDone'), t('notif.focusBody'))
    else notify(t('notif.breakDone'), t('notif.breakBody'))
  }
  if (wasFocus && s.confetti && document.visibilityState === 'visible') celebrate(s.accent)

  const { phase, cycle } = nextPhase(rt.phase, wasFocus)
  idleAt(phase, { cycle, now })
  if (s.autoStart) start()
}

/** Appelé plusieurs fois par seconde par le ticker. */
export function tick(now = Date.now()) {
  const rt = useTimer.getState()
  if (rt.status === 'running' && rt.endAt && !isStopwatch() && now >= rt.endAt) {
    complete(now)
    return
  }
  useTimer.setState({ now })
}

export function hardReset() {
  useTimer.setState({ ...initialRuntime, now: Date.now() })
}
