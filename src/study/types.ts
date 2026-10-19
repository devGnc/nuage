/** Moteur de révision commun à toutes les matières (espagnol aujourd'hui, d'autres demain).
 *  Les formes reprennent les tables Supabase study_items, study_progress et study_reviews. */

export type Grade = 1 | 2 | 3 | 4

/** Un élément : mot, verbe, expression, fiche de cours… */
export interface StudyItem {
  id: string
  subject: string
  /** « vocab », « verb », « phrase » (révisés) ou « note » (fiche à lire, jamais planifiée) */
  kind: string
  /** pour une langue : le mot étranger ; pour une fiche : son titre */
  front: string
  /** la traduction ; pour une fiche : son contenu en Markdown */
  back: string
  example: string | null
  topic: string | null
  /** « anki », « csv », « markdown », « perso » */
  source: string | null
  extra: ItemExtra
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export interface ItemExtra {
  /** catégorie grammaticale : adj, adv, v, nm, nf… */
  pos?: string
  gender?: 'm' | 'f' | 'mf'
  /** rang de fréquence (deck classé) : sert à l'ordre des nouvelles cartes */
  rank?: number
  /** langue de la traduction quand ce n'est pas le français */
  lang?: string
  /** nom du paquet ou du fichier d'origine */
  deck?: string
  [key: string]: unknown
}

/** État FSRS d'une carte, tel que stocké (dates en ISO). */
export interface SrsCard {
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  learning_steps: number
  reps: number
  lapses: number
  /** 0 nouvelle · 1 apprentissage · 2 révision · 3 réapprentissage */
  state: 0 | 1 | 2 | 3
  last_review: string | null
  /** première réponse : sert à compter les nouvelles cartes du jour */
  introducedAt?: number
}

/** Suivi d'un élément pour une compétence (« recognize », « produce », « listen »…). */
export interface StudyProgress {
  itemId: string
  skill: string
  srs: SrsCard
  due: number | null
  suspended: boolean
  updatedAt: number
}

/** Une réponse. Jamais modifiée. */
export interface StudyReview {
  id: string
  itemId: string
  skill: string
  rating: Grade
  answer: string | null
  ms: number
  at: number
}

