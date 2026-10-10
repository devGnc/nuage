import { Check } from 'lucide-react'
import { useT } from '../i18n'
import { celebrate } from '../lib/browser'
import { useSettings } from '../store/settings'
import { useStats } from '../store/stats'
import { currentTask, useTasks } from '../store/tasks'
import { useTimer } from '../store/timer'
import { useUI } from '../store/ui'
import { phaseLabelKey } from '../timer/engine'
import { PhaseTabs, Tallies, TimerControls } from './timer/TimerControls'
import { TimerDisplay, useTimerView } from './timer/TimerDisplay'
import { clockFontStyle } from './HomeView'

export function completeTask(id: string) {
  const task = useTasks.getState().toggle(id)
  if (!task) return
  if (task.done) {
    useStats.getState().logTaskDone(task.title)
    const s = useSettings.getState()
    if (s.confetti) celebrate(s.accent)
  } else useStats.getState().unlogTaskDone(task.title)
}

export function CurrentTask() {
  const t = useT()
  const tasks = useTasks((s) => s.tasks)
  const task = currentTask(tasks)
  const open = () => useUI.getState().togglePanel('tasks')
  if (!task) {
    return (
      <button type="button" className="current-task is-empty" onClick={open}>
        {t('focus.prompt')}
      </button>
    )
  }
  return (
    <div className="current-task">
      <button type="button" className="check" aria-label={t('focus.complete')} title={t('focus.complete')} onClick={() => completeTask(task.id)}>
        <Check size={16} strokeWidth={3} />
      </button>
      <button type="button" className="current-task-title" onClick={open}>
        {task.emoji && <span className="task-emoji">{task.emoji}</span>}
        <span>{task.title}</span>
        {task.color && <span className="task-color" style={{ background: task.color }} />}
      </button>
    </div>
  )
}

export function FocusView() {
  return (
    <div className="focus">
      <CurrentTask />
      <PhaseTabs />
      <Tallies />
      <TimerDisplay />
      <TimerControls />
    </div>
  )
}

function MiniPhase() {
  const t = useT()
  const mode = useSettings((s) => s.timerMode)
  const phase = useTimer((s) => s.phase)
  const key = mode === 'stopwatch' ? 'phase.stopwatch' : mode === 'countdown' ? 'phase.countdown' : phaseLabelKey(mode, phase)
  return <span className="mini-phase">{t(key)}</span>
}

export function AmbientView() {
  const { text } = useTimerView()
  const tasks = useTasks((s) => s.tasks)
  const font = useSettings((s) => s.clockFont)
  const task = currentTask(tasks)
  return (
    <div className="ambient">
      <div className="mini-timer">
        <div className="mini-info">
          <MiniPhase />
          {task && (
            <span className="mini-task">
              {task.emoji} {task.title}
            </span>
          )}
        </div>
        <span className="mini-time" style={clockFontStyle(font)}>{text}</span>
        <TimerControls compact />
      </div>
    </div>
  )
}
