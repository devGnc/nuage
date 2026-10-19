import { checkAnswer, normalize } from '../src/course/check'
import { COURSE, LESSONS, WORDS } from '../src/course/es'
import { validateCourse } from '../src/course/validate'

/** Vérification du cours, lancée avant chaque build : contenu cohérent et correction des réponses. */
export function run(): boolean {
  const { errors, warnings } = validateCourse(COURSE)
  const fails: string[] = []
  const expect = (label: string, got: unknown, want: unknown) => {
    if (got !== want) fails.push(`${label} : obtenu ${JSON.stringify(got)}, attendu ${JSON.stringify(want)}`)
  }
  expect('ponctuation ignorée', checkAnswer('cómo estás', ['¿Cómo estás?']).verdict, 'right')
  expect('majuscules ignorées', checkAnswer('BUENOS DÍAS', ['Buenos días']).verdict, 'right')
  expect('accent oublié signalé', checkAnswer('como estas', ['¿Cómo estás?']).verdict, 'accent')
  expect('ñ n’est pas un accent', checkAnswer('ano', ['año']).verdict, 'wrong')
  expect('faute de frappe signalée', checkAnswer('diecisiet', ['diecisiete']).verdict, 'typo')
  expect('mot court strict', checkAnswer('tre', ['tres']).verdict, 'wrong')
  expect('mauvaise réponse', checkAnswer('adiós', ['hola']).verdict, 'wrong')
  expect('sans tolérance', checkAnswer('como estas', ['¿Cómo estás?'], false).verdict, 'wrong')
  expect('réponse alternative', checkAnswer('Ella es mexicana', ['Es mexicana.', 'Ella es mexicana.']).verdict, 'right')
  expect('apostrophes', normalize('l’étudiant'), "l'étudiant")

  const units = COURSE.flatMap((l) => l.units)
  console.log(`Cours : ${units.length} unités, ${LESSONS.length} leçons, ${WORDS.size} mots, ${LESSONS.reduce((n, x) => n + x.lesson.steps.filter((s) => s.type === 'exercise').length, 0)} exercices.`)
  for (const w of warnings) console.log(`  avertissement : ${w}`)
  for (const e of errors) console.log(`  ERREUR : ${e}`)
  for (const f of fails) console.log(`  ÉCHEC : ${f}`)
  return errors.length === 0 && fails.length === 0
}
