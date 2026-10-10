import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowUpToLine, Check, ChevronDown, ChevronRight, GripVertical, ListTodo, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useT } from '../i18n'
import { fmtHourMinute, fmtHuman } from '../lib/time'
import { useSettings } from '../store/settings'
import { remainingMs, useTasks } from '../store/tasks'
import { useUI } from '../store/ui'
import type { Task } from '../types'
import { completeTask } from './FocusView'
import { Panel } from './Panel'

const EMOJIS = ['📚', '✍️', '💻', '🧠', '📊', '📝', '🎯', '🔬', '🧪', '🎨', '🎧', '📞', '📧', '🏃', '🧘', '🍳', '🛒', '🧹', '💡', '🚀', '📖', '🗂️', '🧾', '⭐']
const COLORS = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#38d9a9', '#4dabf7', '#9775fa', '#f783ac']
const ESTIMATES = [15, 25, 30, 45, 60, 90, 120]

function TaskDetails({ task }: { task: Task }) {
  const t = useT()
  const { update, addSubtask, updateSubtask, removeSubtask, remove, moveToTop } = useTasks()
  const [sub, setSub] = useState('')
  const [custom, setCustom] = useState('')
  return (
    <div className="task-details">
      <div className="detail-row">
        <span className="detail-label">{t('tasks.estimate')}</span>
        <div className="chips">
          <button type="button" className={`chip ${!task.estimateMin ? 'active' : ''}`} onClick={() => update(task.id, { estimateMin: null })}>
            {t('tasks.noEstimate')}
          </button>
          {ESTIMATES.map((m) => (
            <button key={m} type="button" className={`chip ${task.estimateMin === m ? 'active' : ''}`} onClick={() => update(task.id, { estimateMin: m })}>
              {fmtHuman(m * 60000)}
            </button>
          ))}
          <input
            className="input tiny"
            type="number"
            min={1}
            max={1440}
            placeholder={t('tasks.custom')}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && Number(custom) > 0) {
                update(task.id, { estimateMin: Math.round(Number(custom)) })
                setCustom('')
              }
            }}
            aria-label={t('tasks.custom')}
          />
        </div>
      </div>
      <div className="detail-row">
        <span className="detail-label">{t('tasks.emoji')}</span>
        <div className="emoji-grid">
          <button type="button" className={`emoji-opt ${!task.emoji ? 'active' : ''}`} onClick={() => update(task.id, { emoji: '' })} aria-label={t('tasks.noColor')}>
            <X size={13} />
          </button>
          {EMOJIS.map((e) => (
            <button key={e} type="button" className={`emoji-opt ${task.emoji === e ? 'active' : ''}`} onClick={() => update(task.id, { emoji: e })}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <div className="detail-row">
        <span className="detail-label">{t('tasks.color')}</span>
        <div className="color-row">
          <button type="button" className={`color-opt none ${!task.color ? 'active' : ''}`} onClick={() => update(task.id, { color: '' })} aria-label={t('tasks.noColor')} />
          {COLORS.map((c) => (
            <button key={c} type="button" className={`color-opt ${task.color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => update(task.id, { color: c })} aria-label={c} />
          ))}
        </div>
      </div>
      <div className="detail-row column">
        <span className="detail-label">{t('tasks.subtasks')}</span>
        <ul className="subtasks">
          {task.subtasks.map((st) => (
            <li key={st.id} className={st.done ? 'done' : ''}>
              <button type="button" className={`check small ${st.done ? 'on' : ''}`} onClick={() => updateSubtask(task.id, st.id, { done: !st.done })} aria-label={st.title}>
                {st.done && <Check size={11} strokeWidth={3} />}
              </button>
              <input className="input bare" value={st.title} onChange={(e) => updateSubtask(task.id, st.id, { title: e.target.value })} />
              <button type="button" className="icon-btn tiny" onClick={() => removeSubtask(task.id, st.id)} aria-label={t('common.delete')}>
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
        <form
          className="sub-add"
          onSubmit={(e) => {
            e.preventDefault()
            addSubtask(task.id, sub)
            setSub('')
          }}
        >
          <Plus size={14} />
          <input className="input bare" value={sub} onChange={(e) => setSub(e.target.value)} placeholder={t('tasks.addSubtask')} />
        </form>
      </div>
      <div className="detail-actions">
        {task.focusedMs > 0 && <span className="muted">{t('tasks.focused', { time: fmtHuman(task.focusedMs) })}</span>}
        <span className="spacer" />
        {!task.done && (
          <button type="button" className="btn small ghost" onClick={() => moveToTop(task.id)}>
            <ArrowUpToLine size={14} /> {t('tasks.top')}
          </button>
        )}
        <button type="button" className="btn small danger" onClick={() => remove(task.id)}>
          <Trash2 size={14} /> {t('common.delete')}
        </button>
      </div>
    </div>
  )
}

function TaskRow({ task, index, sortable }: { task: Task; index: number; sortable: boolean }) {
  const t = useT()
  const update = useTasks((s) => s.update)
  const [open, setOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, disabled: !sortable })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const doneSubs = task.subtasks.filter((s) => s.done).length
  return (
    <li ref={setNodeRef} style={style} className={`task ${task.done ? 'done' : ''} ${isDragging ? 'dragging' : ''} ${index === 0 && !task.done ? 'current' : ''}`}>
      <div className="task-main">
        {sortable ? (
          <span className="drag" {...attributes} {...listeners} aria-label="drag">
            <GripVertical size={15} />
          </span>
        ) : (
          <span className="drag placeholder" />
        )}
        <button type="button" className={`check ${task.done ? 'on' : ''}`} style={task.color ? { borderColor: task.color } : undefined} onClick={() => completeTask(task.id)} aria-label={t('focus.complete')}>
          {task.done && <Check size={13} strokeWidth={3} />}
        </button>
        {task.emoji && <span className="task-emoji">{task.emoji}</span>}
        <input className="input bare task-title" value={task.title} onChange={(e) => update(task.id, { title: e.target.value })} aria-label={task.title} />
        <span className="task-meta">
          {task.subtasks.length > 0 && <span className="badge">{doneSubs}/{task.subtasks.length}</span>}
          {task.estimateMin ? <span className="badge">{fmtHuman(remainingMs(task) || task.estimateMin * 60000)}</span> : null}
          {task.color && <span className="task-color" style={{ background: task.color }} />}
        </span>
        <button type="button" className="icon-btn tiny" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={t('tasks.details')} title={t('tasks.details')}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
      {open && <TaskDetails task={task} />}
    </li>
  )
}

export function TasksPanel() {
  const t = useT()
  const open = useUI((s) => s.panel === 'tasks')
  const tasks = useTasks((s) => s.tasks)
  const add = useTasks((s) => s.add)
  const reorder = useTasks((s) => s.reorder)
  const clearDone = useTasks((s) => s.clearDone)
  const clearAll = useTasks((s) => s.clearAll)
  const h24 = useSettings((s) => s.clock24)
  const etaMode = useSettings((s) => s.taskEtaMode)
  const [title, setTitle] = useState('')
  const [showDone, setShowDone] = useState(false)
  const active = tasks.filter((x) => !x.done)
  const done = tasks.filter((x) => x.done)
  const remaining = active.reduce((sum, x) => sum + remainingMs(x), 0)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const onDragEnd = (e: DragEndEvent) => {
    const { active: a, over } = e
    if (!over || a.id === over.id) return
    const ids = active.map((x) => x.id)
    reorder(arrayMove(ids, ids.indexOf(String(a.id)), ids.indexOf(String(over.id))))
  }

  return (
    <Panel open={open} title={t('tasks.title')} icon={<ListTodo size={18} />} className="tasks-panel">
      <form
        className="task-add"
        onSubmit={(e) => {
          e.preventDefault()
          add(title)
          setTitle('')
        }}
      >
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('tasks.placeholder')} aria-label={t('tasks.placeholder')} />
        <button type="submit" className="btn primary" disabled={!title.trim()} aria-label={t('common.add')}>
          <Plus size={16} />
        </button>
      </form>
      {active.length > 0 && (
        <div className="task-summary">
          <span>{t('tasks.remaining', { n: active.length })}</span>
          {remaining > 0 && (
            <>
              <span>· {fmtHuman(remaining)}</span>
              <span>· {t('tasks.eta', { time: fmtHourMinute(Date.now() + remaining, h24) })}</span>
            </>
          )}
        </div>
      )}
      {etaMode && <p className="hint subtle">{t('tasks.etaHint')}</p>}
      {tasks.length === 0 && <p className="list-empty">{t('tasks.empty')}</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={active.map((x) => x.id)} strategy={verticalListSortingStrategy}>
          <ul className="task-list">
            {active.map((task, i) => (
              <TaskRow key={task.id} task={task} index={i} sortable />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {done.length > 0 && (
        <div className="done-section">
          <div className="done-head">
            <button type="button" className="link-btn" onClick={() => setShowDone(!showDone)}>
              {showDone ? <ChevronDown size={14} /> : <ChevronRight size={14} />} {t('tasks.done', { n: done.length })}
            </button>
            <button type="button" className="link-btn" onClick={clearDone}>
              {t('tasks.clearDone')}
            </button>
          </div>
          {showDone && (
            <ul className="task-list">
              {done.map((task, i) => (
                <TaskRow key={task.id} task={task} index={i} sortable={false} />
              ))}
            </ul>
          )}
        </div>
      )}
      {tasks.length > 0 && (
        <div className="panel-foot">
          <button
            type="button"
            className="link-btn danger"
            onClick={() => {
              if (window.confirm(t('tasks.confirmClear'))) clearAll()
            }}
          >
            {t('tasks.clearAll')}
          </button>
        </div>
      )}
    </Panel>
  )
}
