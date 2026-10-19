/** Le cours d'espagnol : tout le contenu est écrit pour Nuage et livré avec l'app.
 *  Niveau → unité (un thème, un objectif) → leçon (10 à 15 min) → étapes. */

export type LevelId = 'A1' | 'A2' | 'B1' | 'B1+'

/** Catégorie grammaticale : nm/nf nom masculin/féminin, nmf les deux, expr expression toute faite. */
export type Pos = 'nm' | 'nf' | 'nmf' | 'npl' | 'adj' | 'v' | 'adv' | 'expr' | 'num' | 'pron' | 'prep' | 'conj' | 'det'

export interface Word {
  /** identifiant stable, unique dans tout le cours */
  id: string
  /** l'espagnol, avec l'article pour les noms : « la casa » */
  es: string
  fr: string
  pos?: Pos
  /** phrase d'exemple : espagnol, français */
  example?: [string, string]
  /** mot ou usage d'Amérique latine quand il diffère */
  latam?: string
  /** remarque d'usage, en français */
  note?: string
}

export interface Line {
  who: string
  es: string
  fr: string
}

export interface Dialogue {
  id: string
  title: string
  /** la situation, en une phrase */
  context: string
  lines: Line[]
}

/** Une page du cahier de cours, en Markdown (titres, tableaux, listes). */
export interface Note {
  id: string
  title: string
  /** en une phrase, ce que la fiche explique */
  summary: string
  body: string
}

interface ExerciseBase {
  /** mots travaillés par l'exercice : une erreur les fait revenir plus tôt en révision */
  words?: string[]
  /** explication montrée après la réponse */
  explain?: string
}

/** La bonne réponse est toujours écrite en premier : l'ordre est mélangé à l'affichage. */
export type Exercise =
  | (ExerciseBase & { kind: 'choice'; prompt: string; say?: string; options: string[] })
  | (ExerciseBase & { kind: 'match'; prompt?: string; pairs: [string, string][] })
  | (ExerciseBase & { kind: 'type'; prompt: string; say?: string; answers: string[] })
  /** « ___ » marque chaque trou ; avec options, on choisit, sinon on écrit */
  | (ExerciseBase & { kind: 'cloze'; prompt?: string; text: string; answers: string[][]; options?: string[]; translation?: string })
  /** mots à remettre dans l'ordre (la solution découpée aux espaces, plus d'éventuels intrus) */
  | (ExerciseBase & { kind: 'order'; prompt?: string; solution: string; translation: string; extra?: string[] })
  | (ExerciseBase & { kind: 'dictation'; text: string; translation: string })
  | (ExerciseBase & { kind: 'truefalse'; prompt?: string; statement: string; answer: boolean; dialogue?: string })
  /** production guidée : pas de note, on compare à un modèle */
  | (ExerciseBase & { kind: 'write'; prompt: string; model: string; checklist: string[] })

export type Step =
  | { type: 'words'; words: string[] }
  | { type: 'note'; note: string }
  | { type: 'dialogue'; dialogue: string }
  | { type: 'exercise'; exercise: Exercise }

export type LessonKind = 'vocab' | 'dialogue' | 'grammar' | 'practice' | 'review'

export interface Lesson {
  id: string
  title: string
  kind: LessonKind
  /** ce que tu sauras faire à la fin, en une phrase */
  goal: string
  steps: Step[]
}

export interface Unit {
  id: string
  level: LevelId
  number: number
  title: string
  /** titre en espagnol, affiché à côté */
  titleEs: string
  goal: string
  words: Word[]
  notes: Note[]
  dialogues: Dialogue[]
  lessons: Lesson[]
}

export interface Level {
  id: LevelId
  title: string
  units: Unit[]
}
