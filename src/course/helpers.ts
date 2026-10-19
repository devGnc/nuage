import type { Exercise, Step, Word } from './types'

/** Petites aides pour écrire le contenu du cours de façon lisible. */

export const word = (id: string, es: string, fr: string, extra: Partial<Omit<Word, 'id' | 'es' | 'fr'>> = {}): Word => ({ id, es, fr, ...extra })

export const words = (...ids: string[]): Step => ({ type: 'words', words: ids })
export const note = (id: string): Step => ({ type: 'note', note: id })
export const dialogue = (id: string): Step => ({ type: 'dialogue', dialogue: id })
export const ex = (exercise: Exercise): Step => ({ type: 'exercise', exercise })

type Extra = { words?: string[]; explain?: string }

/** Choix multiple : la bonne réponse en premier. */
export const choice = (prompt: string, options: string[], extra: Extra & { say?: string } = {}): Step => ex({ kind: 'choice', prompt, options, ...extra })
/** Écouter puis choisir : l'espagnol est lu, on choisit la traduction. */
export const listen = (say: string, options: string[], extra: Extra = {}): Step => ex({ kind: 'choice', prompt: 'Écoute et choisis la bonne traduction.', say, options, ...extra })
export const match = (pairs: [string, string][], extra: Extra & { prompt?: string } = {}): Step => ex({ kind: 'match', pairs, ...extra })
export const type = (prompt: string, answers: string[], extra: Extra & { say?: string } = {}): Step => ex({ kind: 'type', prompt, answers, ...extra })
export const cloze = (text: string, answers: (string | string[])[], extra: Extra & { options?: string[]; translation?: string; prompt?: string } = {}): Step =>
  ex({ kind: 'cloze', text, answers: answers.map((a) => (Array.isArray(a) ? a : [a])), ...extra })
export const order = (solution: string, translation: string, extra: Extra & { extra?: string[]; prompt?: string } = {}): Step => ex({ kind: 'order', solution, translation, ...extra })
export const dictation = (text: string, translation: string, extra: Extra = {}): Step => ex({ kind: 'dictation', text, translation, ...extra })
export const truefalse = (statement: string, answer: boolean, extra: Extra & { dialogue?: string; prompt?: string } = {}): Step => ex({ kind: 'truefalse', statement, answer, ...extra })
export const write = (prompt: string, model: string, checklist: string[]): Step => ex({ kind: 'write', prompt, model, checklist })
