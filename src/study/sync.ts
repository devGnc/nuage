import type { SupabaseClient } from '@supabase/supabase-js'
import { supa } from '../sync/client'
import { registerSyncTask, useSync } from '../sync/sync'
import { clearSent, markAllDirty, mergeRemote, SEP, useStudy } from './store'
import type { StudyItem, StudyProgress, StudyReview } from './types'

/** Synchro des révisions avec Supabase, ligne par ligne :
 *  - on récupère ce qui est arrivé sur le serveur depuis la dernière fois (synced_at, posé par le serveur) ;
 *  - on envoie ce qui a changé sur l'appareil ; le serveur ignore une écriture plus ancienne que la sienne. */

const META = 'nuage:studySync'
type Table = 'study_items' | 'study_progress' | 'study_reviews'
interface Meta {
  userId: string
  cursors: Partial<Record<Table, string>>
}

function readMeta(): Meta {
  try {
    return { userId: '', cursors: {}, ...JSON.parse(localStorage.getItem(META) || '{}') }
  } catch {
    return { userId: '', cursors: {} }
  }
}
function saveMeta(m: Meta) {
  localStorage.setItem(META, JSON.stringify(m))
}

const iso = (ms: number) => new Date(ms).toISOString()
const ms = (s: string | null) => (s ? Date.parse(s) : null)

// ——— Conversion lignes ↔ objets ———

interface ItemRow { user_id: string; id: string; subject: string; kind: string; front: string; back: string; example: string | null; topic: string | null; source: string | null; extra: StudyItem['extra']; created_at: string; updated_at: string; deleted_at: string | null; synced_at?: string }
interface ProgressRow { user_id: string; item_id: string; skill: string; srs: StudyProgress['srs']; due_at: string | null; suspended: boolean; updated_at: string; synced_at?: string }
interface ReviewRow { user_id: string; id: string; item_id: string; skill: string; rating: number; answer: string | null; ms: number; reviewed_at: string; synced_at?: string }

const itemRow = (it: StudyItem, user: string): ItemRow => ({
  user_id: user, id: it.id, subject: it.subject, kind: it.kind, front: it.front, back: it.back, example: it.example, topic: it.topic,
  source: it.source, extra: it.extra, created_at: iso(it.createdAt), updated_at: iso(it.updatedAt), deleted_at: it.deletedAt ? iso(it.deletedAt) : null,
})
const fromItemRow = (r: ItemRow): StudyItem => ({
  id: r.id, subject: r.subject, kind: r.kind, front: r.front, back: r.back, example: r.example, topic: r.topic, source: r.source,
  extra: r.extra ?? {}, createdAt: ms(r.created_at)!, updatedAt: ms(r.updated_at)!, deletedAt: ms(r.deleted_at),
})
const progressRow = (p: StudyProgress, user: string): ProgressRow => ({
  user_id: user, item_id: p.itemId, skill: p.skill, srs: p.srs, due_at: p.due ? iso(p.due) : null, suspended: p.suspended, updated_at: iso(p.updatedAt),
})
const fromProgressRow = (r: ProgressRow): StudyProgress => ({
  itemId: r.item_id, skill: r.skill, srs: r.srs, due: ms(r.due_at), suspended: r.suspended, updatedAt: ms(r.updated_at)!,
})
const reviewRow = (r: StudyReview, user: string): ReviewRow => ({
  user_id: user, id: r.id, item_id: r.itemId, skill: r.skill, rating: r.rating, answer: r.answer, ms: r.ms, reviewed_at: iso(r.at),
})
const fromReviewRow = (r: ReviewRow): StudyReview => ({
  id: r.id, itemId: r.item_id, skill: r.skill, rating: r.rating as StudyReview['rating'], answer: r.answer, ms: r.ms, at: ms(r.reviewed_at)!,
})

const BATCH = 500

function chunks<T>(list: T[], n = BATCH): T[][] {
  const out: T[][] = []
  for (let i = 0; i < list.length; i += n) out.push(list.slice(i, i + n))
  return out
}

// ——— Réception ———

async function pullTable<R extends { synced_at?: string }>(c: SupabaseClient, table: Table, meta: Meta, apply: (rows: R[]) => void) {
  // quelques secondes de recouvrement : une écriture validée juste après notre dernière lecture n'est pas perdue
  const since = meta.cursors[table] ? iso(Date.parse(meta.cursors[table]!) - 5000) : '1970-01-01T00:00:00Z'
  let max = meta.cursors[table] ?? ''
  for (let from = 0; ; from += 1000) {
    const { data, error } = await c.from(table).select('*').gt('synced_at', since).order('synced_at').range(from, from + 999)
    if (error) throw error
    const rows = (data ?? []) as R[]
    if (rows.length) {
      apply(rows)
      const last = rows[rows.length - 1].synced_at
      if (last && (!max || Date.parse(last) > Date.parse(max))) max = last
    }
    if (rows.length < 1000) break
  }
  if (max) meta.cursors[table] = max
}

// ——— Envoi ———

async function push(c: SupabaseClient, user: string) {
  // éléments d'abord : suivis et réponses y font référence
  {
    const s = useStudy.getState()
    const ids = Object.keys(s.dirty.items).filter((id) => s.items[id])
    for (const part of chunks(ids)) {
      const st = useStudy.getState()
      const stamps = part.map((id) => [id, st.items[id].updatedAt] as [string, number])
      const { error } = await c.from('study_items').upsert(part.map((id) => itemRow(st.items[id], user)), { onConflict: 'user_id,id' })
      if (error) throw error
      clearSent({ items: stamps })
    }
  }
  {
    const s = useStudy.getState()
    const keys = Object.keys(s.dirty.progress).filter((k) => {
      const [itemId, skill] = k.split(SEP)
      return s.progress[itemId]?.[skill] && s.items[itemId]
    })
    for (const part of chunks(keys)) {
      const st = useStudy.getState()
      const list = part.map((k) => {
        const [itemId, skill] = k.split(SEP)
        return st.progress[itemId][skill]
      })
      const { error } = await c.from('study_progress').upsert(list.map((p) => progressRow(p, user)), { onConflict: 'user_id,item_id,skill' })
      if (error) throw error
      clearSent({ progress: list.map((p, i) => [part[i], p.updatedAt] as [string, number]) })
    }
  }
  {
    const s = useStudy.getState()
    const byId = new Map(s.reviews.map((r) => [r.id, r]))
    const ids = Object.keys(s.dirty.reviews).filter((id) => byId.has(id) && s.items[byId.get(id)!.itemId])
    for (const part of chunks(ids)) {
      const { error } = await c.from('study_reviews').upsert(part.map((id) => reviewRow(byId.get(id)!, user)), { onConflict: 'user_id,id', ignoreDuplicates: true })
      if (error) throw error
      clearSent({ reviews: part })
    }
    const del = Object.keys(s.dirty.reviewDeletes)
    for (const part of chunks(del)) {
      const { error } = await c.from('study_reviews').delete().in('id', part)
      if (error) throw error
      clearSent({ reviewDeletes: part })
    }
  }
}

// ——— Orchestration ———

let running: Promise<void> | null = null
let lastRun = 0
let lastError: unknown = null

export function syncStudy(): Promise<void> {
  if (running) return running
  running = (async () => {
    const c = supa()
    const user = useSync.getState().user
    if (!c || !user || !useStudy.getState().ready) return
    let meta = readMeta()
    if (meta.userId !== user.id) {
      // premier envoi vers ce compte : tout ce qui est sur l'appareil part
      markAllDirty()
      meta = { userId: user.id, cursors: {} }
      saveMeta(meta)
    }
    await pullTable<ItemRow>(c, 'study_items', meta, (rows) => mergeRemote({ items: rows.map(fromItemRow) }))
    await pullTable<ProgressRow>(c, 'study_progress', meta, (rows) => mergeRemote({ progress: rows.map(fromProgressRow) }))
    await pullTable<ReviewRow>(c, 'study_reviews', meta, (rows) => mergeRemote({ reviews: rows.map(fromReviewRow) }))
    saveMeta(meta)
    await push(c, user.id)
    lastRun = Date.now()
    lastError = null
  })()
    .catch((e) => {
      lastError = e
      useSync.setState({ status: 'error', error: e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e) })
    })
    .finally(() => {
      running = null
    })
  return running
}

let timer: ReturnType<typeof setTimeout> | null = null

/** Envoi groupé quelques secondes après une modification. */
export function scheduleStudySync(delay = 4000) {
  if (!useSync.getState().user) return
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    syncStudy()
  }, delay)
}

let started = false

/** À l'ouverture de l'outil : synchro tout de suite, puis après chaque modification et au retour sur la page. */
export function startStudySync() {
  if (started) return
  started = true
  // dans la synchro générale (bouton « Synchroniser maintenant »), une erreur ici doit rester visible
  registerSyncTask(async () => {
    await syncStudy()
    if (lastError) throw lastError
  })
  useStudy.subscribe((s, p) => {
    if (s.dirty !== p.dirty && Object.keys(s.dirty.items).length + Object.keys(s.dirty.progress).length + Object.keys(s.dirty.reviews).length + Object.keys(s.dirty.reviewDeletes).length > 0) scheduleStudySync()
  })
  useSync.subscribe((s, p) => {
    if (s.user && s.user.id !== p.user?.id) syncStudy()
  })
  const onFocus = () => {
    if (Date.now() - lastRun > 30_000) syncStudy()
  }
  window.addEventListener('focus', onFocus)
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && onFocus())
  syncStudy()
}
