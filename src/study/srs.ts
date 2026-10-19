import { createEmptyCard, fsrs, type Card, type CardInput } from 'ts-fsrs'
import type { Grade, SrsCard } from './types'

/** FSRS avec ses réglages par défaut : 90 % de réussite visée, étapes d'apprentissage 1 min puis 10 min. */
const scheduler = fsrs({ enable_fuzz: true, enable_short_term: true })

export function emptySrs(now = Date.now()): SrsCard {
  return fromCard(createEmptyCard(new Date(now)))
}

function toInput(s: SrsCard): CardInput {
  return { ...s, last_review: s.last_review ?? undefined }
}

function fromCard(c: Card, introducedAt?: number): SrsCard {
  return {
    due: new Date(c.due).toISOString(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state as SrsCard['state'],
    last_review: c.last_review ? new Date(c.last_review).toISOString() : null,
    ...(introducedAt ? { introducedAt } : {}),
  }
}

/** Nouvel état après une réponse. */
export function nextSrs(s: SrsCard, grade: Grade, now = Date.now()): SrsCard {
  const { card } = scheduler.next(toInput(s), new Date(now), grade)
  return fromCard(card, s.introducedAt ?? now)
}

/** Prochaine échéance pour chacune des quatre réponses, pour l'afficher sous les boutons. */
export function previewDue(s: SrsCard, now = Date.now()): Record<Grade, number> {
  const r = scheduler.repeat(toInput(s), new Date(now))
  return { 1: +r[1].card.due, 2: +r[2].card.due, 3: +r[3].card.due, 4: +r[4].card.due }
}

/** Intervalle lisible : « 1 min », « 10 min », « 3 j », « 2 mois », « 1,5 an ». */
export function formatInterval(ms: number, lang: 'fr' | 'en'): string {
  const min = ms / 60000
  const fr = lang === 'fr'
  if (min < 1) return fr ? '< 1 min' : '< 1 min'
  if (min < 60) return `${Math.round(min)} min`
  const h = min / 60
  if (h < 24) return `${Math.round(h)} h`
  const d = h / 24
  if (d < 30) return fr ? `${Math.round(d)} j` : `${Math.round(d)} d`
  const mo = d / 30.44
  if (mo < 12) return fr ? `${Math.round(mo)} mois` : `${Math.round(mo)} mo`
  const y = d / 365.25
  const n = y < 10 ? Math.round(y * 10) / 10 : Math.round(y)
  return fr ? `${String(n).replace('.', ',')} an${n >= 2 ? 's' : ''}` : `${n} yr`
}

/** « Maîtrisé » : réussi à un intervalle d'au moins 21 jours (le seuil qu'Anki appelle carte mature). */
export const MATURE_DAYS = 21

export function isMature(s: SrsCard | undefined): boolean {
  return !!s && s.state === 2 && s.scheduled_days >= MATURE_DAYS
}
