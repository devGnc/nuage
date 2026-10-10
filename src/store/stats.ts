import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { idbStorage } from '../lib/idb'
import { uid } from '../lib/id'
import { dayKey } from '../lib/time'
import type { SessionLog, TaskDoneLog } from '../types'

interface StatsStore {
  sessions: SessionLog[]
  activeDays: string[]
  tasksDone: TaskDoneLog[]
  hydrated: boolean
  logSession: (s: Omit<SessionLog, 'id'>) => void
  markActive: (ts?: number) => void
  logTaskDone: (title: string) => void
  unlogTaskDone: (title: string) => void
  merge: (data: { sessions?: SessionLog[]; activeDays?: string[]; tasksDone?: TaskDoneLog[] }) => void
  replaceAll: (data: { sessions: SessionLog[]; activeDays: string[]; tasksDone: TaskDoneLog[] }) => void
  clear: () => void
}

export const useStats = create<StatsStore>()(
  persist(
    (set) => ({
      sessions: [],
      activeDays: [],
      tasksDone: [],
      hydrated: false,
      logSession: (s) => set((st) => ({ sessions: [...st.sessions, { ...s, id: uid() }] })),
      markActive: (ts = Date.now()) =>
        set((st) => {
          const k = dayKey(ts)
          return st.activeDays.includes(k) ? st : { activeDays: [...st.activeDays, k].sort() }
        }),
      logTaskDone: (title) => set((st) => ({ tasksDone: [...st.tasksDone, { id: uid(), at: Date.now(), title }] })),
      unlogTaskDone: (title) =>
        set((st) => {
          // Annule la dernière complétion du jour pour cette tâche (si on la décoche).
          const today = dayKey()
          for (let i = st.tasksDone.length - 1; i >= 0; i--) {
            const t = st.tasksDone[i]
            if (t.title === title && dayKey(t.at) === today) {
              const copy = st.tasksDone.slice()
              copy.splice(i, 1)
              return { tasksDone: copy }
            }
          }
          return st
        }),
      merge: (data) =>
        set((st) => {
          const sess = new Map(st.sessions.map((s) => [s.id, s]))
          for (const s of data.sessions || []) sess.set(s.id, s)
          const done = new Map(st.tasksDone.map((t) => [t.id, t]))
          for (const t of data.tasksDone || []) done.set(t.id, t)
          const days = new Set([...st.activeDays, ...(data.activeDays || [])])
          return {
            sessions: [...sess.values()].sort((a, b) => a.start - b.start),
            tasksDone: [...done.values()].sort((a, b) => a.at - b.at),
            activeDays: [...days].sort(),
          }
        }),
      replaceAll: (data) => set({ sessions: data.sessions, activeDays: data.activeDays, tasksDone: data.tasksDone }),
      clear: () => set({ sessions: [], activeDays: [], tasksDone: [] }),
    }),
    {
      name: 'nuage:stats',
      version: 1,
      storage: idbStorage,
      partialize: (s) => ({ sessions: s.sessions, activeDays: s.activeDays, tasksDone: s.tasksDone }),
      onRehydrateStorage: () => () => {
        useStats.setState({ hydrated: true })
      },
    },
  ),
)
