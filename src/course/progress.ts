import { studyDayEnd, studyDayStart } from '../study/day'
import { answer, ensureItems, type ProgressMap } from '../study/store'
import type { Grade, StudyItem, StudyReview } from '../study/types'
import { LESSONS, UNIT_OF_WORD, WORDS } from './es'
import type { Lesson, Unit, Word } from './types'

/** Progression dans le cours, enregistrée avec le moteur de révision (et donc synchronisée) :
 *  - chaque mot vu devient un élément « nuage:es:w:… » suivi en répétition espacée (compétence « recognize ») ;
 *  - chaque leçon terminée devient un élément « nuage:es:l:… » avec sa note (compétence « lesson »). */

export const SUBJECT = 'es'
export const WORD_SKILL = 'recognize'
export const LESSON_SKILL = 'lesson'
export const wordItemId = (id: string) => `nuage:es:w:${id}`
export const lessonItemId = (id: string) => `nuage:es:l:${id}`
export const isCourseItem = (it: StudyItem) => it.source === 'nuage' && it.subject === SUBJECT

function wordItem(w: Word, unit: Unit): StudyItem {
  return {
    id: wordItemId(w.id), subject: SUBJECT, kind: 'vocab', front: w.es, back: w.fr, example: w.example ? w.example[0] : null,
    topic: unit.title, source: 'nuage', extra: { word: w.id, unit: unit.id, ...(w.pos ? { pos: w.pos } : {}) }, createdAt: 0, updatedAt: 0, deletedAt: null,
  }
}

function lessonItem(l: Lesson, unit: Unit): StudyItem {
  return {
    id: lessonItemId(l.id), subject: SUBJECT, kind: 'lesson', front: l.title, back: l.goal, example: null,
    topic: unit.title, source: 'nuage', extra: { lesson: l.id, unit: unit.id }, createdAt: 0, updatedAt: 0, deletedAt: null,
  }
}

/** Tous les mots d'une leçon : ceux présentés et ceux travaillés dans les exercices. */
export function lessonWords(l: Lesson): string[] {
  const ids = new Set<string>()
  for (const s of l.steps) {
    if (s.type === 'words') s.words.forEach((w) => ids.add(w))
    if (s.type === 'exercise') s.exercise.words?.forEach((w) => ids.add(w))
  }
  return [...ids].filter((id) => WORDS.has(id))
}

export interface LessonResult {
  correct: number
  total: number
  /** mots liés à un exercice raté au premier essai */
  missed: Set<string>
  ms: number
}

/** Fin de leçon : les mots entrent en révision (plus tôt s'ils ont été ratés), la leçon est notée. */
export function completeLesson(lesson: Lesson, unit: Unit, r: LessonResult, progress: ProgressMap) {
  const ids = lessonWords(lesson)
  ensureItems([lessonItem(lesson, unit), ...ids.map((id) => wordItem(WORDS.get(id)!, UNIT_OF_WORD.get(id) ?? unit))])
  for (const id of ids) {
    const known = progress[wordItemId(id)]?.[WORD_SKILL]
    // un mot déjà connu et réussi garde son calendrier ; un mot raté revient vite
    if (known && known.srs.state !== 0 && !r.missed.has(id)) continue
    answer(wordItemId(id), WORD_SKILL, r.missed.has(id) ? 1 : 3, 0)
  }
  const pct = r.total ? r.correct / r.total : 1
  const grade: Grade = pct >= 0.9 ? 4 : pct >= 0.7 ? 3 : pct >= 0.5 ? 2 : 1
  answer(lessonItemId(lesson.id), LESSON_SKILL, grade, r.ms, JSON.stringify({ correct: r.correct, total: r.total }))
}

export interface LessonStatus {
  done: boolean
  /** meilleur score, en pourcentage */
  best: number | null
}

export function lessonStatuses(progress: ProgressMap, reviews: StudyReview[]): Map<string, LessonStatus> {
  const best = new Map<string, number>()
  for (const r of reviews) {
    if (r.skill !== LESSON_SKILL || !r.answer) continue
    try {
      const { correct, total } = JSON.parse(r.answer) as { correct: number; total: number }
      const pct = total ? Math.round((correct / total) * 100) : 100
      const id = r.itemId.replace('nuage:es:l:', '')
      best.set(id, Math.max(best.get(id) ?? 0, pct))
    } catch {
      /* ligne illisible : ignorée */
    }
  }
  const out = new Map<string, LessonStatus>()
  for (const { lesson } of LESSONS) {
    const p = progress[lessonItemId(lesson.id)]?.[LESSON_SKILL]
    out.set(lesson.id, { done: !!p && p.srs.reps > 0, best: best.get(lesson.id) ?? null })
  }
  return out
}

/** La prochaine leçon dans l'ordre conseillé : la première pas encore faite. */
export function nextLesson(statuses: Map<string, LessonStatus>) {
  return LESSONS.find(({ lesson }) => !statuses.get(lesson.id)?.done) ?? null
}

/** Mots du cours à revoir aujourd'hui, les plus en retard d'abord. */
export function dueWords(progress: ProgressMap, now = Date.now()): string[] {
  const end = studyDayEnd(now)
  const out: { id: string; due: number }[] = []
  for (const id of WORDS.keys()) {
    const p = progress[wordItemId(id)]?.[WORD_SKILL]
    if (!p || p.suspended || p.srs.state === 0) continue
    if ((p.due ?? 0) < end) out.push({ id, due: p.due ?? 0 })
  }
  return out.sort((a, b) => a.due - b.due).map((x) => x.id)
}

/** Mots déjà vus les plus fragiles (stabilité la plus faible), pour réviser même quand rien n'est dû. */
export function weakestWords(progress: ProgressMap, n: number): string[] {
  const out: { id: string; s: number }[] = []
  for (const id of WORDS.keys()) {
    const p = progress[wordItemId(id)]?.[WORD_SKILL]
    if (p && p.srs.state !== 0 && !p.suspended) out.push({ id, s: p.srs.stability })
  }
  return out.sort((a, b) => a.s - b.s).slice(0, n).map((x) => x.id)
}

export function seenWords(progress: ProgressMap): number {
  let n = 0
  for (const id of WORDS.keys()) if ((progress[wordItemId(id)]?.[WORD_SKILL]?.srs.state ?? 0) !== 0) n++
  return n
}

/** Temps et exercices du jour, toutes activités du cours confondues. */
export function todayActivity(reviews: StudyReview[], now = Date.now()) {
  const start = studyDayStart(now)
  let ms = 0
  let lessons = 0
  let reviewed = 0
  for (let i = reviews.length - 1; i >= 0; i--) {
    const r = reviews[i]
    if (r.at < start) break
    if (!r.itemId.startsWith('nuage:es:')) continue
    ms += r.ms
    if (r.skill === LESSON_SKILL) lessons++
    else if (r.ms > 0) reviewed++
  }
  return { minutes: Math.round(ms / 60000), lessons, reviewed }
}
