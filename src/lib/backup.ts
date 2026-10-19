import { clear as clearIdb } from 'idb-keyval'
import { settingsSnapshot, useSettings, type Settings } from '../store/settings'
import { useNotes } from '../store/notes'
import { useStats } from '../store/stats'
import { useTasks } from '../store/tasks'
import type { Note, SessionLog, Task, TaskDoneLog } from '../types'
import type { ProgressMap } from '../study/store'
import type { StudyItem, StudyReview } from '../study/types'

export interface Backup {
  app: 'nuage'
  version: 1
  exportedAt: string
  settings: Partial<Settings>
  tasks: Task[]
  notes: Note[]
  stats: { sessions: SessionLog[]; activeDays: string[]; tasksDone: TaskDoneLog[] }
  /** révisions (toutes matières) */
  study?: { items: StudyItem[]; progress: ProgressMap; reviews: StudyReview[] }
}

export async function makeBackup(): Promise<Backup> {
  const st = useStats.getState()
  // les données de révision sont chargées à la demande : on les lit avant d'exporter
  const { loadStudy, useStudy } = await import('../study/store')
  await loadStudy()
  const study = useStudy.getState()
  return {
    app: 'nuage',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: settingsSnapshot(),
    tasks: useTasks.getState().tasks,
    notes: useNotes.getState().notes,
    stats: { sessions: st.sessions, activeDays: st.activeDays, tasksDone: st.tasksDone },
    study: { items: Object.values(study.items), progress: study.progress, reviews: study.reviews },
  }
}

export async function restoreBackup(raw: unknown): Promise<boolean> {
  const b = raw as Partial<Backup>
  if (!b || b.app !== 'nuage' || typeof b !== 'object') return false
  if (b.settings) {
    // le mode courant et la langue restent ceux de l'appareil
    const { mode, ...rest } = b.settings
    void mode
    useSettings.getState().replaceAll({ ...rest, mode: useSettings.getState().mode })
  }
  if (Array.isArray(b.tasks)) useTasks.getState().replaceAll(b.tasks)
  if (Array.isArray(b.notes)) useNotes.getState().replaceAll(b.notes)
  if (b.stats && Array.isArray(b.stats.sessions)) {
    useStats.getState().replaceAll({
      sessions: b.stats.sessions,
      activeDays: Array.isArray(b.stats.activeDays) ? b.stats.activeDays : [],
      tasksDone: Array.isArray(b.stats.tasksDone) ? b.stats.tasksDone : [],
    })
  }
  if (b.study && Array.isArray(b.study.items)) {
    // fusion : la version la plus récente de chaque ligne gagne, puis tout repart vers le compte
    const { loadStudy, mergeRemote, markAllDirty } = await import('../study/store')
    await loadStudy()
    const progress = Object.values(b.study.progress ?? {}).flatMap((bySkill) => Object.values(bySkill))
    mergeRemote({ items: b.study.items, progress, reviews: Array.isArray(b.study.reviews) ? b.study.reviews : [] })
    markAllDirty()
  }
  return true
}

export async function resetEverything() {
  for (const k of Object.keys(localStorage)) if (k.startsWith('nuage:')) localStorage.removeItem(k)
  await clearIdb()
  location.reload()
}
