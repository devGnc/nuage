import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '../lib/id'
import type { Subtask, Task } from '../types'

interface TasksStore {
  tasks: Task[]
  add: (title: string) => void
  update: (id: string, patch: Partial<Task>) => void
  remove: (id: string) => void
  toggle: (id: string) => Task | undefined
  reorder: (activeIds: string[]) => void
  moveToTop: (id: string) => void
  addFocus: (id: string, ms: number) => void
  addSubtask: (id: string, title: string) => void
  updateSubtask: (id: string, sid: string, patch: Partial<Subtask>) => void
  removeSubtask: (id: string, sid: string) => void
  clearDone: () => void
  clearAll: () => void
  replaceAll: (tasks: Task[]) => void
}

export const useTasks = create<TasksStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      add: (title) => {
        const t = title.trim()
        if (!t) return
        const task: Task = {
          id: uid(), title: t, emoji: '', color: '', done: false, doneAt: null,
          estimateMin: null, focusedMs: 0, subtasks: [], createdAt: Date.now(),
        }
        set((s) => ({ tasks: [...s.tasks, task] }))
      },
      update: (id, patch) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      remove: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      toggle: (id) => {
        let result: Task | undefined
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t
            result = { ...t, done: !t.done, doneAt: !t.done ? Date.now() : null }
            return result
          }),
        }))
        return result
      },
      reorder: (activeIds) =>
        set((s) => {
          const byId = new Map(s.tasks.map((t) => [t.id, t]))
          const active = activeIds.map((id) => byId.get(id)).filter(Boolean) as Task[]
          const rest = s.tasks.filter((t) => !activeIds.includes(t.id))
          return { tasks: [...active, ...rest] }
        }),
      moveToTop: (id) =>
        set((s) => {
          const t = s.tasks.find((x) => x.id === id)
          if (!t) return s
          return { tasks: [t, ...s.tasks.filter((x) => x.id !== id)] }
        }),
      addFocus: (id, ms) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, focusedMs: t.focusedMs + ms } : t)) })),
      addSubtask: (id, title) => {
        const t = title.trim()
        if (!t) return
        set((s) => ({
          tasks: s.tasks.map((x) => (x.id === id ? { ...x, subtasks: [...x.subtasks, { id: uid(), title: t, done: false }] } : x)),
        }))
      },
      updateSubtask: (id, sid, patch) =>
        set((s) => ({
          tasks: s.tasks.map((x) =>
            x.id === id ? { ...x, subtasks: x.subtasks.map((st) => (st.id === sid ? { ...st, ...patch } : st)) } : x,
          ),
        })),
      removeSubtask: (id, sid) =>
        set((s) => ({
          tasks: s.tasks.map((x) => (x.id === id ? { ...x, subtasks: x.subtasks.filter((st) => st.id !== sid) } : x)),
        })),
      clearDone: () => set((s) => ({ tasks: s.tasks.filter((t) => !t.done) })),
      clearAll: () => set({ tasks: [] }),
      replaceAll: (tasks) => set({ tasks }),
    }),
    { name: 'nuage:tasks', version: 1 },
  ),
)

/** Première tâche non terminée : celle qu'on affiche au-dessus du timer. */
export function currentTask(tasks: Task[]): Task | undefined {
  return tasks.find((t) => !t.done)
}

/** Temps estimé restant (ms) pour une tâche. */
export function remainingMs(t: Task): number {
  if (!t.estimateMin) return 0
  return Math.max(0, t.estimateMin * 60000 - t.focusedMs)
}
