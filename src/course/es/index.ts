import type { Dialogue, Lesson, Level, Note, Unit, Word } from '../types'
import { a1u1 } from './a1-u1'
import { a1u2 } from './a1-u2'

/** Le cours d'espagnol, dans l'ordre conseillé. Les niveaux sans unité sont affichés « à venir ». */
export const COURSE: Level[] = [
  { id: 'A1', title: 'Débutant', units: [a1u1, a1u2] },
  { id: 'A2', title: 'Élémentaire', units: [] },
  { id: 'B1', title: 'Intermédiaire', units: [] },
  { id: 'B1+', title: 'Intermédiaire avancé', units: [] },
]

export const UNITS: Unit[] = COURSE.flatMap((l) => l.units)
export const LESSONS: { lesson: Lesson; unit: Unit }[] = UNITS.flatMap((unit) => unit.lessons.map((lesson) => ({ lesson, unit })))

export const WORDS = new Map<string, Word>(UNITS.flatMap((u) => u.words.map((w) => [w.id, w] as const)))
export const NOTES = new Map<string, Note>(UNITS.flatMap((u) => u.notes.map((n) => [n.id, n] as const)))
export const DIALOGUES = new Map<string, Dialogue>(UNITS.flatMap((u) => u.dialogues.map((d) => [d.id, d] as const)))
export const UNIT_OF_WORD = new Map<string, Unit>(UNITS.flatMap((u) => u.words.map((w) => [w.id, u] as const)))

export function findLesson(id: string) {
  return LESSONS.find((x) => x.lesson.id === id)
}
