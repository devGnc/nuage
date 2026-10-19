import { create } from 'zustand'
import { defaultSettings, settingsSnapshot, useSettings, type Settings } from '../store/settings'
import { useNotes } from '../store/notes'
import { useStats } from '../store/stats'
import { useTasks } from '../store/tasks'
import type { Mode, Note, SessionLog, Task, TaskDoneLog } from '../types'
import { loadSupa, supa } from './client'

interface SyncState {
  user: { id: string; email: string } | null
  status: 'idle' | 'syncing' | 'error'
  error: string
  lastSync: number | null
}

export const useSync = create<SyncState>(() => ({
  user: null,
  status: 'idle',
  error: '',
  lastSync: Number(localStorage.getItem('nuage:lastSync')) || null,
}))

const META = 'nuage:syncMeta'
interface Meta {
  /** Dernière modification locale des données synchronisées. */
  localUpdatedAt: number
  /** updated_at distant connu lors de la dernière synchro. */
  remoteSeenAt: number
  /** Fin de la dernière session envoyée. */
  pushedUntil: number
  userId: string
}

function meta(): Meta {
  try {
    return { localUpdatedAt: 0, remoteSeenAt: 0, pushedUntil: 0, userId: '', ...JSON.parse(localStorage.getItem(META) || '{}') }
  } catch {
    return { localUpdatedAt: 0, remoteSeenAt: 0, pushedUntil: 0, userId: '' }
  }
}
function saveMeta(patch: Partial<Meta>) {
  localStorage.setItem(META, JSON.stringify({ ...meta(), ...patch }))
}

/** Réglages propres à l'appareil, jamais synchronisés. */
const LOCAL_ONLY: (keyof Settings)[] = ['mode', 'uploads']

interface StateData {
  settings: Partial<Settings>
  tasks: Task[]
  notes: Note[]
  activeDays: string[]
  tasksDone: TaskDoneLog[]
}

function collect(): StateData {
  const s = settingsSnapshot() as Partial<Settings>
  for (const k of LOCAL_ONLY) delete s[k]
  const st = useStats.getState()
  return { settings: s, tasks: useTasks.getState().tasks, notes: useNotes.getState().notes, activeDays: st.activeDays, tasksDone: st.tasksDone }
}

let applying = false

function apply(data: StateData) {
  applying = true
  try {
    if (data.settings) {
      const local = useSettings.getState()
      const themes = { ...defaultSettings.themes, ...(data.settings.themes || {}) }
      // un fond importé n'existe que sur l'appareil qui l'a importé
      for (const m of ['home', 'focus', 'ambient'] as Mode[]) if (themes[m] === 'upload' && !local.uploads[m]) themes[m] = local.themes[m]
      useSettings.setState({ ...data.settings, themes, mode: local.mode, uploads: local.uploads })
    }
    if (Array.isArray(data.tasks)) useTasks.getState().replaceAll(data.tasks)
    if (Array.isArray(data.notes)) useNotes.getState().replaceAll(data.notes)
    useStats.getState().merge({ activeDays: data.activeDays || [], tasksDone: data.tasksDone || [] })
  } finally {
    applying = false
  }
}

async function pushState() {
  const c = supa()
  const user = useSync.getState().user
  if (!c || !user) return
  const now = new Date().toISOString()
  const { error } = await c.from('user_state').upsert({ user_id: user.id, data: collect(), updated_at: now })
  if (error) throw error
  saveMeta({ remoteSeenAt: Date.parse(now), localUpdatedAt: Math.min(meta().localUpdatedAt, Date.parse(now)) })
}

async function pushSessions(all = false) {
  const c = supa()
  const user = useSync.getState().user
  if (!c || !user) return
  const since = all ? 0 : meta().pushedUntil
  const list = useStats.getState().sessions.filter((s) => s.end > since)
  for (let i = 0; i < list.length; i += 500) {
    const rows = list.slice(i, i + 500).map((s) => ({
      id: s.id, user_id: user.id, type: s.type, start_at: new Date(s.start).toISOString(), end_at: new Date(s.end).toISOString(),
      ms: s.ms, completed: s.completed, task_title: s.taskTitle ?? null,
    }))
    const { error } = await c.from('focus_sessions').upsert(rows)
    if (error) throw error
  }
  const maxEnd = list.reduce((m, s) => Math.max(m, s.end), since)
  saveMeta({ pushedUntil: maxEnd })
}

async function pullSessions() {
  const c = supa()
  if (!c) return
  const out: SessionLog[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await c.from('focus_sessions').select('id,type,start_at,end_at,ms,completed,task_title').order('end_at').range(from, from + 999)
    if (error) throw error
    for (const r of data || []) {
      out.push({ id: r.id, type: r.type, start: Date.parse(r.start_at), end: Date.parse(r.end_at), ms: r.ms, completed: r.completed, taskTitle: r.task_title ?? undefined })
    }
    if (!data || data.length < 1000) break
  }
  if (out.length) useStats.getState().merge({ sessions: out })
}

/** Synchros supplémentaires des outils (révisions…), lancées après celle du Pomodoro.
 *  Un outil chargé à la demande s'inscrit ici quand on l'ouvre. */
const extraTasks = new Set<() => Promise<void>>()
export function registerSyncTask(fn: () => Promise<void>) {
  extraTasks.add(fn)
  return () => extraTasks.delete(fn)
}

let running: Promise<void> | null = null

export function syncNow(): Promise<void> {
  if (running) return running
  running = (async () => {
    const c = supa()
    const user = useSync.getState().user
    if (!c || !user) return
    useSync.setState({ status: 'syncing', error: '' })
    try {
      for (let i = 0; i < 50 && !useStats.getState().hydrated; i++) await new Promise((r) => setTimeout(r, 50))
      const m = meta()
      const firstOnDevice = m.userId !== user.id
      if (firstOnDevice) saveMeta({ userId: user.id, remoteSeenAt: 0, pushedUntil: 0 })
      const { data, error } = await c.from('user_state').select('data, updated_at').eq('user_id', user.id).maybeSingle()
      if (error) throw error
      const remoteAt = data ? Date.parse(data.updated_at) : 0
      const localChanged = meta().localUpdatedAt > meta().remoteSeenAt
      if (data && (firstOnDevice || (remoteAt > meta().remoteSeenAt && (!localChanged || remoteAt > meta().localUpdatedAt)))) {
        apply(data.data as StateData)
        saveMeta({ remoteSeenAt: remoteAt, localUpdatedAt: remoteAt })
        if (firstOnDevice) await pushState() // ajoute ce qui existait déjà sur l'appareil (stats fusionnées)
      } else if (!data || localChanged) {
        await pushState()
      }
      await pullSessions()
      await pushSessions(firstOnDevice)
      for (const task of extraTasks) await task()
      const now = Date.now()
      localStorage.setItem('nuage:lastSync', String(now))
      useSync.setState({ status: 'idle', lastSync: now })
    } catch (e) {
      useSync.setState({ status: 'error', error: e instanceof Error ? e.message : String(e) })
    }
  })().finally(() => {
    running = null
  })
  return running
}

let pushTimer: ReturnType<typeof setTimeout> | null = null
function schedulePush() {
  if (applying) return
  saveMeta({ localUpdatedAt: Date.now() })
  if (!useSync.getState().user) return
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushState().catch((e) => useSync.setState({ status: 'error', error: String(e?.message || e) }))
  }, 2500)
}

let sessTimer: ReturnType<typeof setTimeout> | null = null
function scheduleSessions() {
  if (applying || !useSync.getState().user) return
  if (sessTimer) clearTimeout(sessTimer)
  sessTimer = setTimeout(() => {
    pushSessions().catch((e) => useSync.setState({ status: 'error', error: String(e?.message || e) }))
    pushState().catch(() => {})
  }, 2500)
}

let started = false

export async function initSync() {
  if (started) return
  const c = await loadSupa()
  if (!c || started) return
  started = true
  useSettings.subscribe((s, p) => {
    if (s === p) return
    // les changements de mode ou de thème importé restent locaux
    const changed = (Object.keys(defaultSettings) as (keyof Settings)[]).some((k) => !LOCAL_ONLY.includes(k) && s[k] !== p[k])
    if (changed) schedulePush()
  })
  useTasks.subscribe((s, p) => s.tasks !== p.tasks && schedulePush())
  useNotes.subscribe((s, p) => s.notes !== p.notes && schedulePush())
  useStats.subscribe((s, p) => {
    if (s.sessions !== p.sessions) scheduleSessions()
    else if (s.tasksDone !== p.tasksDone || s.activeDays !== p.activeDays) schedulePush()
  })

  const { data } = await c.auth.getSession()
  if (data.session?.user) {
    useSync.setState({ user: { id: data.session.user.id, email: data.session.user.email || '' } })
    syncNow()
  }
  c.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      const was = useSync.getState().user?.id
      useSync.setState({ user: { id: session.user.id, email: session.user.email || '' } })
      if (was !== session.user.id && event !== 'INITIAL_SESSION') syncNow()
    } else useSync.setState({ user: null })
  })
  const onFocus = () => {
    const last = useSync.getState().lastSync || 0
    if (useSync.getState().user && Date.now() - last > 30000) syncNow()
  }
  window.addEventListener('focus', onFocus)
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && onFocus())
}
