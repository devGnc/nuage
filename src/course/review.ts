import type { StudyProgress } from '../study/types'
import { shuffled } from './check'
import { UNIT_OF_WORD, WORDS } from './es'
import type { Exercise, Word } from './types'

/** Révision : chaque mot revient sous une forme qui dépend de ce que tu en sais déjà —
 *  reconnaître, puis l'entendre, puis le retrouver, puis l'écrire. */

/** Les formes qu'on accepte à l'écrit : « encantado / encantada » → l'une ou l'autre ; « la casa » → aussi « casa ». */
export function writtenForms(w: Word): string[] | null {
  if (/…/.test(w.es)) return null
  const forms = w.es.split(/\s\/\s/).map((s) => s.trim())
  // « el / la estudiante » : l'article est partagé
  if (forms.length === 2 && /^(el|la|los|las)$/i.test(forms[0])) {
    const noun = forms[1].replace(/^(el|la|los|las)\s+/i, '')
    return [forms[1], `${forms[0]} ${noun}`, noun]
  }
  const out = new Set<string>()
  for (const f of forms) {
    out.add(f)
    const bare = f.replace(/^(el|la|los|las)\s+/i, '')
    if (bare !== f) out.add(bare)
  }
  return [...out]
}

function distractors(w: Word, field: 'es' | 'fr', n: number, seed: string): string[] {
  const unit = UNIT_OF_WORD.get(w.id)
  const all = [...WORDS.values()].filter((x) => x.id !== w.id && x[field] !== w[field])
  const samePos = all.filter((x) => x.pos === w.pos && UNIT_OF_WORD.get(x.id) === unit)
  const pool = [...shuffled(samePos, seed), ...shuffled(all.filter((x) => !samePos.includes(x)), seed + '+')]
  const out: string[] = []
  for (const x of pool) {
    if (!out.includes(x[field])) out.push(x[field])
    if (out.length === n) break
  }
  return out
}

/** Le niveau d'un mot : une bonne réponse le fait monter d'un cran, un oubli le fait redescendre. */
export function wordLevel(p: StudyProgress | undefined): number {
  return Math.max(1, (p?.srs.reps ?? 0) - 2 * (p?.srs.lapses ?? 0))
}

export function reviewExercise(wordId: string, p: StudyProgress | undefined, seed: string): Exercise {
  const w = WORDS.get(wordId)!
  const level = wordLevel(p)
  const forms = writtenForms(w)
  if (level >= 4 && forms) return { kind: 'type', prompt: `Écris en espagnol : « ${w.fr} »`, answers: forms, words: [w.id] }
  if (level >= 3) return { kind: 'choice', prompt: `Comment dit-on « ${w.fr} » ?`, options: [w.es, ...distractors(w, 'es', 3, seed)], words: [w.id] }
  if (level === 2) return { kind: 'choice', prompt: 'Écoute et choisis la bonne traduction.', say: w.es, options: [w.fr, ...distractors(w, 'fr', 3, seed)], words: [w.id] }
  return { kind: 'choice', prompt: `Que veut dire « ${w.es} » ?`, options: [w.fr, ...distractors(w, 'fr', 3, seed)], words: [w.id] }
}
