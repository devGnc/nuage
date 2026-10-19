import { REVIEWABLE_KINDS, type StudyItem, type StudyProgress, type StudyReview } from './types'
import type { ProgressMap } from './store'

/** La journée de révision commence à 4 h, comme dans Anki : une séance tardive compte pour la veille. */
export const DAY_START_HOUR = 4

export function studyDayStart(now = Date.now()): number {
  const d = new Date(now)
  if (d.getHours() < DAY_START_HOUR) d.setDate(d.getDate() - 1)
  d.setHours(DAY_START_HOUR, 0, 0, 0)
  return d.getTime()
}

export const studyDayEnd = (now = Date.now()) => studyDayStart(now) + 24 * 3600_000

/** Les cartes en apprentissage dont l'échéance tombe dans les 20 minutes sont montrées sans attendre. */
export const LEARN_AHEAD_MS = 20 * 60_000

export type EntryKind = 'new' | 'learning' | 'review'
export interface Entry {
  itemId: string
  kind: EntryKind
}

export interface DayCounts {
  /** nouvelles cartes vues aujourd'hui */
  newDone: number
  /** réponses aujourd'hui sur des cartes déjà connues avant aujourd'hui */
  reviewsDone: number
  /** toutes les réponses d'aujourd'hui */
  answers: number
  /** temps passé aujourd'hui */
  ms: number
}

export function dayCounts(subjectItems: Set<string>, progress: ProgressMap, reviews: StudyReview[], skill: string, now = Date.now()): DayCounts {
  const start = studyDayStart(now)
  const introducedToday = (id: string) => (progress[id]?.[skill]?.srs.introducedAt ?? 0) >= start
  let newDone = 0
  let reviewsDone = 0
  let answers = 0
  let ms = 0
  for (const [id, bySkill] of Object.entries(progress)) {
    if (subjectItems.has(id) && (bySkill[skill]?.srs.introducedAt ?? 0) >= start) newDone++
  }
  for (let i = reviews.length - 1; i >= 0; i--) {
    const r = reviews[i]
    if (r.at < start) break
    if (!subjectItems.has(r.itemId) || r.skill !== skill) continue
    answers++
    ms += r.ms
    if (!introducedToday(r.itemId)) reviewsDone++
  }
  return { newDone, reviewsDone, answers, ms }
}

export interface QueueOptions {
  subject: string
  skill: string
  newPerDay: number
  maxReviews: number
  /** nouvelles cartes ajoutées en plus aujourd'hui (« encore 10 ») */
  extraNew?: number
  now?: number
}

export interface DayQueue {
  learning: Entry[]
  reviews: Entry[]
  fresh: Entry[]
  /** cartes en retard au-delà du plafond, gardées pour les jours suivants */
  postponed: number
  /** nouvelles cartes encore jamais vues, au total */
  unseen: number
  counts: DayCounts
}

/** Ce qu'il y a à faire aujourd'hui : apprentissage en cours, révisions dues (plafonnées), nouvelles cartes. */
export function buildDayQueue(items: Record<string, StudyItem>, progress: ProgressMap, reviews: StudyReview[], o: QueueOptions): DayQueue {
  const now = o.now ?? Date.now()
  const end = studyDayEnd(now)
  const subjectItems = new Set<string>()
  const learning: { id: string; due: number }[] = []
  const due: { id: string; due: number }[] = []
  const fresh: StudyItem[] = []
  for (const it of Object.values(items)) {
    if (it.subject !== o.subject || it.deletedAt || !REVIEWABLE_KINDS.includes(it.kind)) continue
    subjectItems.add(it.id)
    const p: StudyProgress | undefined = progress[it.id]?.[o.skill]
    if (p?.suspended) continue
    if (!p || p.srs.state === 0) {
      fresh.push(it)
      continue
    }
    const at = p.due ?? 0
    if (p.srs.state === 1 || p.srs.state === 3) {
      if (at <= now + LEARN_AHEAD_MS) learning.push({ id: it.id, due: at })
    } else if (at < end) due.push({ id: it.id, due: at })
  }
  const counts = dayCounts(subjectItems, progress, reviews, o.skill, now)

  learning.sort((a, b) => a.due - b.due)
  due.sort((a, b) => a.due - b.due)
  const reviewRoom = Math.max(0, o.maxReviews - counts.reviewsDone)
  const takenReviews = due.slice(0, reviewRoom)

  // ordre des nouvelles cartes : dans chaque paquet, rang de fréquence puis ordre d'ajout ;
  // les paquets sont pris à tour de rôle, pour qu'un grand deck ne repousse pas les autres à plus tard
  fresh.sort((a, b) => (a.extra.rank ?? Infinity) - (b.extra.rank ?? Infinity) || a.createdAt - b.createdAt || a.front.localeCompare(b.front))
  const byDeck = new Map<string, StudyItem[]>()
  for (const it of fresh) {
    const k = String(it.extra.deck ?? it.source ?? '')
    if (!byDeck.has(k)) byDeck.set(k, [])
    byDeck.get(k)!.push(it)
  }
  const newRoom = Math.max(0, o.newPerDay + (o.extraNew ?? 0) - counts.newDone)
  const picked: StudyItem[] = []
  const lanes = [...byDeck.values()]
  for (let i = 0; picked.length < newRoom && lanes.some((l) => i < l.length); i++) {
    for (const lane of lanes) if (i < lane.length && picked.length < newRoom) picked.push(lane[i])
  }

  return {
    learning: learning.map((x) => ({ itemId: x.id, kind: 'learning' })),
    reviews: takenReviews.map((x) => ({ itemId: x.id, kind: 'review' })),
    fresh: picked.map((it) => ({ itemId: it.id, kind: 'new' })),
    postponed: due.length - takenReviews.length,
    unseen: fresh.length,
    counts,
  }
}

/** Mélange les nouvelles cartes parmi les révisions, à intervalles réguliers. */
export function interleave(reviews: Entry[], fresh: Entry[]): Entry[] {
  if (!fresh.length) return [...reviews]
  if (!reviews.length) return [...fresh]
  const out: Entry[] = []
  const step = (reviews.length + fresh.length) / fresh.length
  let r = 0
  let n = 0
  for (let i = 0; i < reviews.length + fresh.length; i++) {
    const wantNew = n < fresh.length && (r >= reviews.length || i + 1 >= Math.round((n + 1) * step))
    if (wantNew) out.push(fresh[n++])
    else out.push(reviews[r++])
  }
  return out
}
