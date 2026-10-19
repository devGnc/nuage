import { createEmptyCard, fsrs, type Card, type CardInput } from 'ts-fsrs'
import type { Grade, SrsCard } from './types'

/** FSRS, 90 % de réussite visée, planifié en jours : un mot raté revient le lendemain, un mot su dans 3 jours, puis de plus en plus loin.
 *  Pas d'étapes de quelques minutes : la répétition immédiate se fait dans la séance (un exercice raté revient en fin de leçon). */
const scheduler = fsrs({ enable_fuzz: true, enable_short_term: false })

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
