import { Clock, Earth, Target, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DIALOGUES, findLesson, LESSONS, NOTES, WORDS } from '../../course/es'
import { completeLesson, lessonWords, type LessonResult } from '../../course/progress'
import type { Exercise, Lesson, Unit } from '../../course/types'
import { useT } from '../../i18n'
import { flush, useStudy } from '../../study/store'
import { stopSpeaking } from './speech'
import { DialogueView } from './DialogueView'
import { ExerciseView, type ExerciseOutcome } from './ExerciseView'
import { go, openLesson } from './sections'
import { Markdown, PosLabel, SpeakButton } from './ui'

/** Une leçon, écran par écran : les mots un par un, la fiche, le dialogue, puis les exercices.
 *  Un exercice raté revient une fois en fin de leçon ; le score ne compte que le premier essai. */

type Entry =
  | { kind: 'word'; id: string }
  | { kind: 'note'; id: string }
  | { kind: 'dialogue'; id: string }
  | { kind: 'exercise'; ex: Exercise; key: string; retry: boolean }

function build(lesson: Lesson): Entry[] {
  return lesson.steps.flatMap((s, i): Entry[] => {
    switch (s.type) {
      case 'words':
        return s.words.map((id) => ({ kind: 'word', id }))
      case 'note':
        return [{ kind: 'note', id: s.note }]
      case 'dialogue':
        return [{ kind: 'dialogue', id: s.dialogue }]
      case 'exercise':
        return [{ kind: 'exercise', ex: s.exercise, key: `${lesson.id}:${i}`, retry: false }]
    }
  })
}

/** Au-delà, on considère que la leçon est restée ouverte sans qu'on y travaille. */
const MAX_MS = 45 * 60 * 1000

export function LessonPlayer({ id }: { id: string }) {
  const t = useT()
  const found = findLesson(id)
  if (!found)
    return (
      <div className="es-empty">
        <h2>{t('es.lessonMissing')}</h2>
        <button type="button" className="btn primary" onClick={() => go({ section: 'course' })}>
          {t('es.backCourse')}
        </button>
      </div>
    )
  return <Player key={id} lesson={found.lesson} unit={found.unit} />
}

function Player({ lesson, unit }: { lesson: Lesson; unit: Unit }) {
  const t = useT()
  const [queue, setQueue] = useState(() => build(lesson))
  const [pos, setPos] = useState(0)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const missed = useRef(new Set<string>())
  const start = useRef(Date.now())
  const [result, setResult] = useState<LessonResult | null>(null)
  const [quitting, setQuitting] = useState(false)
  const stage = useRef<HTMLDivElement>(null)

  useEffect(() => {
    stage.current?.closest('.es-panel')?.scrollTo({ top: 0 })
  }, [pos, result])
  useEffect(() => () => stopSpeaking(), [])

  const finish = (s: { correct: number; total: number }) => {
    const r: LessonResult = { ...s, missed: new Set(missed.current), ms: Math.min(Date.now() - start.current, MAX_MS) }
    completeLesson(lesson, unit, r, useStudy.getState().progress)
    // enregistré tout de suite : on ferme souvent l'app juste après le bilan
    void flush()
    setResult(r)
  }

  const advance = (q = queue, s = score) => {
    stopSpeaking()
    if (pos + 1 >= q.length) finish(s)
    else setPos(pos + 1)
  }

  const onExercise = (o: ExerciseOutcome) => {
    const entry = queue[pos] as Extract<Entry, { kind: 'exercise' }>
    let q = queue
    let s = score
    if (o.graded && !entry.retry) {
      s = { correct: score.correct + (o.correct ? 1 : 0), total: score.total + 1 }
      setScore(s)
      if (!o.correct) entry.ex.words?.forEach((w) => missed.current.add(w))
    }
    if (o.graded && !o.correct && !entry.retry) {
      q = [...queue, { ...entry, key: entry.key + ':r', retry: true }]
      setQueue(q)
    }
    advance(q, s)
  }

  const quit = () => {
    stopSpeaking()
    go({ section: 'course' })
  }

  if (result) return <Summary lesson={lesson} unit={unit} r={result} />

  const entry = queue[pos]
  const progress = pos / queue.length
  return (
    <div className="es-player" ref={stage}>
      <header className="es-player-bar">
        <button type="button" className="icon-btn" onClick={() => (pos === 0 ? quit() : setQuitting(true))} aria-label={t('es.quitLesson')} title={t('es.quitLesson')}>
          <X size={20} />
        </button>
        <div className="es-meter" role="progressbar" aria-valuemin={0} aria-valuemax={queue.length} aria-valuenow={pos} aria-label={t('es.lessonProgress')}>
          <span style={{ width: `${Math.max(3, progress * 100)}%` }} />
        </div>
        <span className="es-player-count">
          {pos + 1}/{queue.length}
        </span>
      </header>
      {quitting && (
        <div className="es-quit" role="alertdialog" aria-label={t('es.quitLesson')}>
          <p>{t('es.quitConfirm')}</p>
          <div className="btn-row">
            <button type="button" className="btn small danger" onClick={quit}>
              {t('es.quitYes')}
            </button>
            <button type="button" className="btn small primary" onClick={() => setQuitting(false)} autoFocus>
              {t('es.quitNo')}
            </button>
          </div>
        </div>
      )}
      <p className="es-player-title">
        {t('es.unitN', { n: unit.number })} · {lesson.title}
      </p>
      <div className="es-step" key={entry.kind === 'exercise' ? entry.key : `${entry.kind}:${entry.id}:${pos}`}>
        {entry.kind === 'word' ? (
          <WordCard id={entry.id} onNext={() => advance()} />
        ) : entry.kind === 'note' ? (
          <NoteStep id={entry.id} onNext={() => advance()} />
        ) : entry.kind === 'dialogue' ? (
          <DialogueStep id={entry.id} onNext={() => advance()} />
        ) : (
          <>
            {entry.retry && <p className="es-retry">{t('es.retry')}</p>}
            <ExerciseView exercise={entry.ex} seed={entry.key} onDone={onExercise} />
          </>
        )}
      </div>
    </div>
  )
}

/** Barre du bas pour les écrans sans réponse : un seul bouton, qui prend le focus pour qu'Entrée suffise. */
function NextBar({ onNext, label }: { onNext: () => void; label?: string }) {
  const t = useT()
  return (
    <div className="es-foot">
      <span />
      <button type="button" className="btn primary es-next" onClick={onNext} autoFocus>
        {label ?? t('es.continue')}
      </button>
    </div>
  )
}

export function WordCard({ id, onNext }: { id: string; onNext: () => void }) {
  const t = useT()
  const w = WORDS.get(id)
  if (!w) return <NextBar onNext={onNext} />
  return (
    <>
      <div className="es-word-card">
        <p className="es-kicker">{t('es.newWord')}</p>
        <div className="es-word-main">
          <h2 className="es-word" lang="es">
            {w.es}
          </h2>
          <SpeakButton text={w.es} big auto />
        </div>
        <PosLabel pos={w.pos} />
        <p className="es-meaning">{w.fr}</p>
        {w.example && (
          <div className="es-example">
            <div className="es-example-es">
              <span lang="es">{w.example[0]}</span>
              <SpeakButton text={w.example[0]} />
            </div>
            <p>{w.example[1]}</p>
          </div>
        )}
        {w.note && <p className="es-word-note">{w.note}</p>}
        {w.latam && (
          <p className="es-latam">
            <Earth size={15} />
            <span>
              {t('es.latam')} <b lang="es">{w.latam}</b>
            </span>
          </p>
        )}
      </div>
      <NextBar onNext={onNext} />
    </>
  )
}

function NoteStep({ id, onNext }: { id: string; onNext: () => void }) {
  const t = useT()
  const n = NOTES.get(id)
  return (
    <>
      {n && (
        <article className="es-note-step">
          <p className="es-kicker">{t('es.noteKicker')}</p>
          <h2>{n.title}</h2>
          <Markdown text={n.body} />
        </article>
      )}
      <NextBar onNext={onNext} label={t('es.understood')} />
    </>
  )
}

function DialogueStep({ id, onNext }: { id: string; onNext: () => void }) {
  const d = DIALOGUES.get(id)
  return (
    <>
      {d && <DialogueView d={d} />}
      <NextBar onNext={onNext} />
    </>
  )
}

function Summary({ lesson, unit, r }: { lesson: Lesson; unit: Unit; r: LessonResult }) {
  const t = useT()
  const pct = r.total ? Math.round((r.correct / r.total) * 100) : 100
  const minutes = Math.max(1, Math.round(r.ms / 60000))
  const learned = lessonWords(lesson).length
  const missedWords = [...r.missed].map((id) => WORDS.get(id)).filter((w) => !!w)
  const next = useMemo(() => {
    const i = LESSONS.findIndex((x) => x.lesson.id === lesson.id)
    return LESSONS[i + 1] ?? null
  }, [lesson])
  const headline = pct >= 90 ? t('es.sum.great') : pct >= 70 ? t('es.sum.good') : t('es.sum.again')

  return (
    <div className="es-summary">
      <p className="es-kicker">
        {t('es.unitN', { n: unit.number })} · {lesson.title}
      </p>
      <h2>{headline}</h2>
      <div className="es-score" style={{ ['--pct' as string]: `${pct}%` }}>
        <strong>{pct}&nbsp;%</strong>
        <span>{t('es.sum.firstTry', { c: r.correct, n: r.total })}</span>
      </div>
      <ul className="es-sum-facts">
        <Fact icon={<Clock size={16} />}>{t('es.sum.minutes', { n: minutes })}</Fact>
        <Fact icon={<Target size={16} />}>{t('es.sum.words', { n: learned })}</Fact>
      </ul>
      {missedWords.length > 0 && (
        <div className="es-sum-missed">
          <h3>{t('es.sum.missed')}</h3>
          <ul>
            {missedWords.map((w) => (
              <li key={w.id}>
                <SpeakButton text={w.es} />
                <b lang="es">{w.es}</b>
                <span>{w.fr}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="es-foot">
        <button type="button" className="btn ghost" onClick={() => go({ section: 'course' })}>
          {t('es.backCourse')}
        </button>
        {next ? (
          <button type="button" className="btn primary es-next" onClick={() => openLesson(next.lesson.id)} autoFocus>
            {t('es.sum.next', { title: next.lesson.title })}
          </button>
        ) : (
          <button type="button" className="btn primary es-next" onClick={() => go({ section: 'review' })} autoFocus>
            {t('es.goReview')}
          </button>
        )}
      </div>
    </div>
  )
}

function Fact({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li>
      {icon}
      <span>{children}</span>
    </li>
  )
}
