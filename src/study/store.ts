import { del, get, getMany, setMany } from 'idb-keyval'
import { create } from 'zustand'
import { uid } from '../lib/id'
import { emptySrs, nextSrs } from './srs'
import type { Grade, StudyItem, StudyProgress, StudyReview } from './types'

/** Données de révision, gardées sur l'appareil (IndexedDB) et synchronisées ligne par ligne.
 *  Les réponses sont rangées par mois : en ajouter une ne réécrit que le mois en cours. */

export type ProgressMap = Record<string, Record<string, StudyProgress>>

/** Lignes modifiées sur l'appareil et pas encore envoyées. */
export interface Dirty {
  items: Record<string, true>
  /** clé : itemId + SEP + skill */
  progress: Record<string, true>
  reviews: Record<string, true>
  reviewDeletes: Record<string, true>
}

export const SEP = '\u0000'

interface StudyState {
  ready: boolean
  items: Record<string, StudyItem>
  progress: ProgressMap
  reviews: StudyReview[]
  dirty: Dirty
}

const emptyDirty = (): Dirty => ({ items: {}, progress: {}, reviews: {}, reviewDeletes: {} })

export const useStudy = create<StudyState>(() => ({
  ready: false,
  items: {},
  progress: {},
  reviews: [],
  dirty: emptyDirty(),
}))

// ——— Enregistrement local ———

const K_ITEMS = 'study:items'
const K_PROGRESS = 'study:progress'
const K_MONTHS = 'study:reviewMonths'
const K_DIRTY = 'study:dirty'
const monthKey = (ts: number) => {
  const d = new Date(ts)
  return `study:reviews:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const pending = { items: false, progress: false, dirty: false, months: new Set<string>() }
let saveTimer: ReturnType<typeof setTimeout> | null = null

function touch(parts: { items?: boolean; progress?: boolean; months?: string[] }) {
  if (parts.items) pending.items = true
  if (parts.progress) pending.progress = true
  for (const m of parts.months ?? []) pending.months.add(m)
  pending.dirty = true
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(flush, 500)
}

/** Écrit sur l'appareil ce qui a changé. Appelé aussi quand la page passe en arrière-plan. */
export async function flush() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = null
  const s = useStudy.getState()
  if (!s.ready) return
  const entries: [string, unknown][] = []
  if (pending.items) entries.push([K_ITEMS, s.items])
  if (pending.progress) entries.push([K_PROGRESS, s.progress])
  if (pending.months.size) {
    const byMonth = new Map<string, StudyReview[]>()
    for (const r of s.reviews) {
      const k = monthKey(r.at)
      if (!pending.months.has(k)) continue
      if (!byMonth.has(k)) byMonth.set(k, [])
      byMonth.get(k)!.push(r)
    }
    for (const k of pending.months) entries.push([k, byMonth.get(k) ?? []])
    const all = new Set(s.reviews.map((r) => monthKey(r.at)))
    entries.push([K_MONTHS, [...all].sort()])
  }
  if (pending.dirty) entries.push([K_DIRTY, s.dirty])
  pending.items = pending.progress = pending.dirty = false
  pending.months.clear()
  if (entries.length) await setMany(entries)
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush())
  window.addEventListener('pagehide', () => flush())
}

let loading: Promise<void> | null = null

/** Charge les données de l'appareil (une seule fois). */
export function loadStudy(): Promise<void> {
  if (useStudy.getState().ready) return Promise.resolve()
  if (loading) return loading
  loading = (async () => {
    const [items, progress, months, dirty] = await getMany([K_ITEMS, K_PROGRESS, K_MONTHS, K_DIRTY])
    const monthKeys: string[] = Array.isArray(months) ? months : []
    const chunks = monthKeys.length ? await getMany(monthKeys) : []
    const reviews = (chunks as (StudyReview[] | undefined)[]).flatMap((c) => c ?? []).sort((a, b) => a.at - b.at)
    useStudy.setState({
      ready: true,
      items: items ?? {},
      progress: progress ?? {},
      reviews,
      dirty: { ...emptyDirty(), ...(dirty ?? {}) },
    })
  })()
  return loading
}

// ——— Lecture ———

export function progressOf(itemId: string, skill: string): StudyProgress | undefined {
  return useStudy.getState().progress[itemId]?.[skill]
}

// ——— Écriture ———

function withDirty(d: Dirty, patch: Partial<Record<keyof Dirty, string[]>>): Dirty {
  const out: Dirty = { items: { ...d.items }, progress: { ...d.progress }, reviews: { ...d.reviews }, reviewDeletes: { ...d.reviewDeletes } }
  for (const k of Object.keys(patch) as (keyof Dirty)[]) for (const id of patch[k] ?? []) out[k][id] = true
  return out
}

/** Ajoute des éléments importés. Ceux qui existent déjà sont laissés tels quels (tes modifications sont gardées) ;
 *  un élément supprimé puis réimporté revient. */
export function addItems(list: StudyItem[]): { added: number; existing: number } {
  const s = useStudy.getState()
  const items = { ...s.items }
  const changed: string[] = []
  let existing = 0
  const now = Date.now()
  for (const it of list) {
    const cur = items[it.id]
    if (cur && !cur.deletedAt) {
      existing++
      continue
    }
    items[it.id] = { ...it, createdAt: cur?.createdAt ?? it.createdAt, updatedAt: now, deletedAt: null }
    changed.push(it.id)
  }
  if (changed.length) {
    useStudy.setState({ items, dirty: withDirty(s.dirty, { items: changed }) })
    touch({ items: true })
  }
  return { added: changed.length, existing }
}

/** Contenu fourni avec l'app (cours) : ajoute ce qui manque et met à jour ce qui a changé dans une nouvelle version. */
export function ensureItems(list: StudyItem[]) {
  const s = useStudy.getState()
  const items = { ...s.items }
  const changed: string[] = []
  const now = Date.now()
  for (const it of list) {
    const cur = items[it.id]
    if (cur && !cur.deletedAt && cur.front === it.front && cur.back === it.back && cur.example === it.example && cur.topic === it.topic && cur.kind === it.kind && JSON.stringify(cur.extra) === JSON.stringify(it.extra)) continue
    items[it.id] = { ...it, createdAt: cur?.createdAt ?? now, updatedAt: now, deletedAt: null }
    changed.push(it.id)
  }
  if (changed.length) {
    useStudy.setState({ items, dirty: withDirty(s.dirty, { items: changed }) })
    touch({ items: true })
  }
}

/** Crée ou modifie un élément. */
export function saveItem(item: StudyItem) {
  const s = useStudy.getState()
  useStudy.setState({ items: { ...s.items, [item.id]: { ...item, updatedAt: Date.now() } }, dirty: withDirty(s.dirty, { items: [item.id] }) })
  touch({ items: true })
}

/** Supprime un élément. La suppression est enregistrée pour se propager aux autres appareils. */
export function deleteItem(id: string) {
  const it = useStudy.getState().items[id]
  if (!it) return
  const now = Date.now()
  saveItem({ ...it, deletedAt: now })
}

function putProgress(p: StudyProgress) {
  const s = useStudy.getState()
  const forItem = { ...(s.progress[p.itemId] ?? {}), [p.skill]: p }
  useStudy.setState({ progress: { ...s.progress, [p.itemId]: forItem }, dirty: withDirty(s.dirty, { progress: [p.itemId + SEP + p.skill] }) })
}

export function setSuspended(itemId: string, skill: string, suspended: boolean) {
  const cur = progressOf(itemId, skill)
  const now = Date.now()
  putProgress(cur ? { ...cur, suspended, updatedAt: now } : { itemId, skill, srs: emptySrs(now), due: null, suspended, updatedAt: now })
  touch({ progress: true })
}

export interface UndoToken {
  itemId: string
  skill: string
  prev: StudyProgress | undefined
  reviewId: string
}

/** Enregistre une réponse : nouvel état FSRS et ligne d'historique. */
export function answer(itemId: string, skill: string, grade: Grade, ms: number, typed: string | null = null): UndoToken {
  const now = Date.now()
  const prev = progressOf(itemId, skill)
  const srs = nextSrs(prev?.srs ?? emptySrs(now), grade, now)
  putProgress({ itemId, skill, srs, due: Date.parse(srs.due), suspended: prev?.suspended ?? false, updatedAt: now })
  const review: StudyReview = { id: uid(), itemId, skill, rating: grade, answer: typed, ms: Math.max(0, Math.round(ms)), at: now }
  const s = useStudy.getState()
  useStudy.setState({ reviews: [...s.reviews, review], dirty: withDirty(s.dirty, { reviews: [review.id] }) })
  touch({ progress: true, months: [monthKey(now)] })
  return { itemId, skill, prev, reviewId: review.id }
}

/** Annule la dernière réponse : l'état précédent revient, la réponse disparaît (aussi du serveur si elle y était). */
export function undo(t: UndoToken) {
  const now = Date.now()
  const s = useStudy.getState()
  const review = s.reviews.find((r) => r.id === t.reviewId)
  const prev: StudyProgress = t.prev
    ? { ...t.prev, updatedAt: now }
    : { itemId: t.itemId, skill: t.skill, srs: emptySrs(now), due: null, suspended: false, updatedAt: now }
  putProgress(prev)
  const after = useStudy.getState()
  const wasPushed = !after.dirty.reviews[t.reviewId]
  const reviews = after.dirty.reviews
  const { [t.reviewId]: _dropped, ...rest } = reviews
  void _dropped
  useStudy.setState({
    reviews: after.reviews.filter((r) => r.id !== t.reviewId),
    dirty: { ...after.dirty, reviews: rest, reviewDeletes: wasPushed ? { ...after.dirty.reviewDeletes, [t.reviewId]: true } : after.dirty.reviewDeletes },
  })
  touch({ progress: true, months: review ? [monthKey(review.at)] : [] })
}

// ——— Synchro ———

/** Fusionne ce qui vient du serveur. La version la plus récente gagne ; une modification locale plus récente
 *  et pas encore envoyée est gardée. */
export function mergeRemote(data: { items?: StudyItem[]; progress?: StudyProgress[]; reviews?: StudyReview[] }) {
  const s = useStudy.getState()
  let items = s.items
  let progress = s.progress
  let reviews = s.reviews
  const months = new Set<string>()
  if (data.items?.length) {
    items = { ...items }
    for (const it of data.items) {
      const cur = items[it.id]
      if (!cur || it.updatedAt > cur.updatedAt || (it.updatedAt === cur.updatedAt && !s.dirty.items[it.id])) items[it.id] = it
    }
  }
  if (data.progress?.length) {
    progress = { ...progress }
    for (const p of data.progress) {
      const cur = progress[p.itemId]?.[p.skill]
      if (!cur || p.updatedAt > cur.updatedAt || (p.updatedAt === cur.updatedAt && !s.dirty.progress[p.itemId + SEP + p.skill])) {
        progress[p.itemId] = { ...(progress[p.itemId] ?? {}), [p.skill]: p }
      }
    }
  }
  if (data.reviews?.length) {
    const known = new Set(reviews.map((r) => r.id))
    const fresh = data.reviews.filter((r) => !known.has(r.id) && !s.dirty.reviewDeletes[r.id])
    if (fresh.length) {
      reviews = [...reviews, ...fresh].sort((a, b) => a.at - b.at)
      for (const r of fresh) months.add(monthKey(r.at))
    }
  }
  useStudy.setState({ items, progress, reviews })
  touch({ items: items !== s.items, progress: progress !== s.progress, months: [...months] })
}

/** Ce qui reste à envoyer. */
export function snapshotDirty(): Dirty {
  return useStudy.getState().dirty
}

/** Retire des lignes envoyées, sauf si elles ont été modifiées entre-temps (même date de modification). */
export function clearSent(sent: { items?: [string, number][]; progress?: [string, number][]; reviews?: string[]; reviewDeletes?: string[] }) {
  const s = useStudy.getState()
  const d: Dirty = { items: { ...s.dirty.items }, progress: { ...s.dirty.progress }, reviews: { ...s.dirty.reviews }, reviewDeletes: { ...s.dirty.reviewDeletes } }
  for (const [id, at] of sent.items ?? []) if (s.items[id]?.updatedAt === at) delete d.items[id]
  for (const [key, at] of sent.progress ?? []) {
    const [itemId, skill] = key.split(SEP)
    if (s.progress[itemId]?.[skill]?.updatedAt === at) delete d.progress[key]
  }
  for (const id of sent.reviews ?? []) delete d.reviews[id]
  for (const id of sent.reviewDeletes ?? []) delete d.reviewDeletes[id]
  useStudy.setState({ dirty: d })
  touch({})
}

/** Marque tout comme à envoyer (premier envoi vers un compte). */
export function markAllDirty() {
  const s = useStudy.getState()
  const d = emptyDirty()
  for (const id of Object.keys(s.items)) d.items[id] = true
  for (const [itemId, bySkill] of Object.entries(s.progress)) for (const skill of Object.keys(bySkill)) d.progress[itemId + SEP + skill] = true
  for (const r of s.reviews) d.reviews[r.id] = true
  useStudy.setState({ dirty: d })
  touch({})
}

/** Efface toutes les données de révision de l'appareil (réinitialisation complète). */
export async function clearStudy() {
  const months = (await get<string[]>(K_MONTHS)) ?? []
  await Promise.all([K_ITEMS, K_PROGRESS, K_MONTHS, K_DIRTY, ...months].map((k) => del(k)))
  useStudy.setState({ items: {}, progress: {}, reviews: [], dirty: emptyDirty() })
}
