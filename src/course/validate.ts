import type { Exercise, Level } from './types'

/** Vérifie tout le contenu du cours : identifiants uniques, références existantes, exercices cohérents.
 *  Utilisé par le script de vérification (npm run check:course). Renvoie la liste des problèmes. */
export function validateCourse(levels: Level[]): { errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  const ids = new Map<string, string>()
  const seen = (kind: string, id: string) => {
    const prev = ids.get(id)
    if (prev) errors.push(`identifiant en double : ${id} (${prev} et ${kind})`)
    ids.set(id, kind)
  }
  const words = new Set<string>()
  const used = new Set<string>()
  const notes = new Set<string>()
  const dialogues = new Set<string>()
  for (const l of levels) for (const u of l.units) {
    seen('unité', u.id)
    for (const w of u.words) {
      seen('mot', `w:${w.id}`)
      words.add(w.id)
      checkSpanish(w.es, `mot ${w.id}`, warnings)
      if (w.example) checkSpanish(w.example[0], `exemple de ${w.id}`, warnings)
    }
    for (const n of u.notes) {
      seen('fiche', n.id)
      notes.add(n.id)
    }
    for (const d of u.dialogues) {
      seen('dialogue', d.id)
      dialogues.add(d.id)
      for (const line of d.lines) checkSpanish(line.es, `dialogue ${d.id}`, warnings)
    }
  }
  for (const l of levels) for (const u of l.units) for (const lesson of u.lessons) {
    seen('leçon', lesson.id)
    if (!lesson.steps.length) errors.push(`${lesson.id} : aucune étape`)
    if (!lesson.steps.some((s) => s.type === 'exercise')) warnings.push(`${lesson.id} : aucun exercice`)
    lesson.steps.forEach((s, i) => {
      const where = `${lesson.id} étape ${i + 1}`
      if (s.type === 'words') for (const w of s.words) {
        if (!words.has(w)) errors.push(`${where} : mot inconnu « ${w} »`)
        used.add(w)
      }
      if (s.type === 'note' && !notes.has(s.note)) errors.push(`${where} : fiche inconnue « ${s.note} »`)
      if (s.type === 'dialogue' && !dialogues.has(s.dialogue)) errors.push(`${where} : dialogue inconnu « ${s.dialogue} »`)
      if (s.type === 'exercise') checkExercise(s.exercise, where, words, dialogues, errors, warnings)
    })
  }
  for (const w of words) if (!used.has(w)) warnings.push(`mot jamais présenté dans une leçon : ${w}`)
  return { errors, warnings }
}

function checkExercise(e: Exercise, where: string, words: Set<string>, dialogues: Set<string>, errors: string[], warnings: string[]) {
  for (const w of e.words ?? []) if (!words.has(w)) errors.push(`${where} : mot inconnu « ${w} » dans l’exercice`)
  switch (e.kind) {
    case 'choice':
      if (e.options.length < 2) errors.push(`${where} : choix avec moins de deux options`)
      if (new Set(e.options).size !== e.options.length) errors.push(`${where} : options en double`)
      if (e.say) checkSpanish(e.say, where, warnings)
      break
    case 'match':
      if (e.pairs.length < 3) errors.push(`${where} : moins de trois paires`)
      if (new Set(e.pairs.map((p) => p[0])).size !== e.pairs.length || new Set(e.pairs.map((p) => p[1])).size !== e.pairs.length) errors.push(`${where} : paires en double`)
      break
    case 'type':
      if (!e.answers.length) errors.push(`${where} : aucune réponse acceptée`)
      break
    case 'cloze': {
      const holes = e.text.split('___').length - 1
      if (holes === 0) errors.push(`${where} : texte à trous sans trou`)
      if (holes !== e.answers.length) errors.push(`${where} : ${holes} trou(s) pour ${e.answers.length} réponse(s)`)
      if (e.options) for (const a of e.answers) if (!a.some((x) => e.options!.includes(x))) errors.push(`${where} : la réponse « ${a[0]} » n’est pas parmi les options`)
      checkSpanish(e.text.replace(/___/g, 'x'), where, warnings)
      break
    }
    case 'order': {
      const tokens = e.solution.split(/\s+/)
      if (tokens.length < 3) errors.push(`${where} : phrase à remettre trop courte`)
      checkSpanish(e.solution, where, warnings)
      break
    }
    case 'dictation':
      checkSpanish(e.text, where, warnings)
      break
    case 'truefalse':
      if (e.dialogue && !dialogues.has(e.dialogue)) errors.push(`${where} : dialogue inconnu « ${e.dialogue} »`)
      break
    case 'write':
      if (!e.checklist.length) warnings.push(`${where} : production sans liste de vérification`)
      checkSpanish(e.model, where, warnings)
      break
  }
}

/** Une question espagnole s'ouvre par ¿ et une exclamation par ¡. */
function checkSpanish(s: string, where: string, warnings: string[]) {
  const q = (s.match(/\?/g) ?? []).length
  const iq = (s.match(/¿/g) ?? []).length
  const x = (s.match(/!/g) ?? []).length
  const ix = (s.match(/¡/g) ?? []).length
  if (q !== iq) warnings.push(`${where} : « ${s} » — ¿ et ? ne vont pas par paires`)
  if (x !== ix) warnings.push(`${where} : « ${s} » — ¡ et ! ne vont pas par paires`)
}
