import { X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { WORDS } from '../../course/es'
import { dueWords, seenWords, todayActivity, weakestWords, WORD_SKILL, wordItemId } from '../../course/progress'
import { reviewExercise, wordLevel, writtenForms } from '../../course/review'
import { studyDayEnd, studyDayStart } from '../../study/day'
import { answer, useStudy } from '../../study/store'
import type { Grade } from '../../study/types'
import { useLang, useT, type TKey } from '../../i18n'
import { useSettings } from '../../store/settings'
import { ExerciseView, type ExerciseOutcome } from './ExerciseView'
import { go } from './sections'
import { stopSpeaking } from './speech'
import { SpeakButton } from './ui'

/** Révision : les mots des leçons reviennent au moment où on allait les oublier,
 *  sous une forme de plus en plus exigeante (reconnaître, entendre, retrouver, écrire). */

export function Review() {
  const [session, setSession] = useState<{ ids: string[]; n: number } | null>(null)
  if (session) return <ReviewSession key={session.n} ids={session.ids} onExit={() => setSession(null)} onMore={(ids) => setSession({ ids, n: session.n + 1 })} />
  return <ReviewHome onStart={(ids) => setSession({ ids, n: 0 })} />
}

function ReviewHome({ onStart }: { onStart: (ids: string[]) => void }) {
  const t = useT()
  const progress = useStudy((s) => s.progress)
  const reviews = useStudy((s) => s.reviews)
  const size = useSettings((s) => s.esReviewSize)
  const due = useMemo(() => dueWords(progress), [progress])
  const seen = useMemo(() => seenWords(progress), [progress])
  const today = useMemo(() => todayActivity(reviews), [reviews])
  const nextIn = useMemo(() => nextDueDays(progress), [progress])

  if (seen === 0)
    return (
      <div className="es-empty">
        <h1 className="es-title">{t('es.review')}</h1>
        <p>{t('es.rev.emptyDesc')}</p>
        <button type="button" className="btn primary" onClick={() => go({ section: 'course' })}>
          {t('es.rev.emptyCta')}
        </button>
      </div>
    )

  return (
    <div className="es-review-home">
      <div className="es-rev-main">
        <h1 className="es-title">{t('es.review')}</h1>
        {due.length > 0 ? (
          <div className="es-due-hero">
            <strong>{due.length}</strong>
            <span>{t('es.rev.due', { n: due.length })}</span>
            <p>{t('es.rev.how')}</p>
            <button type="button" className="btn primary es-cta" onClick={() => onStart(due.slice(0, size))} autoFocus>
              {t('es.rev.start', { n: Math.min(size, due.length) })}
            </button>
          </div>
        ) : (
          <div className="es-due-hero calm">
            <span>{t('es.rev.upToDate')}</span>
            <p>{nextIn === null ? t('es.rev.nextUnknown') : nextIn === 0 ? t('es.rev.nextToday') : nextIn === 1 ? t('es.rev.nextTomorrow') : t('es.rev.nextDays', { n: nextIn })}</p>
            <button type="button" className="btn es-cta" onClick={() => onStart(weakestWords(progress, size))}>
              {t('es.rev.anyway')}
            </button>
          </div>
        )}
        <dl className="es-stats">
          <div>
            <dt>{t('es.rev.seen')}</dt>
            <dd>{seen}</dd>
          </div>
          <div>
            <dt>{t('es.rev.today')}</dt>
            <dd>{today.reviewed}</dd>
          </div>
          <div>
            <dt>{t('es.rev.minutes')}</dt>
            <dd>{today.minutes}</dd>
          </div>
        </dl>
      </div>
      <div className="es-rev-side">
        <Stages progress={progress} />
        <Forecast progress={progress} />
      </div>
    </div>
  )
}

type Progress = ReturnType<typeof useStudy.getState>['progress']

const STAGES: { id: string; label: TKey }[] = [
  { id: 'recognize', label: 'es.rev.stage.recognize' },
  { id: 'listen', label: 'es.rev.stage.listen' },
  { id: 'recall', label: 'es.rev.stage.recall' },
  { id: 'write', label: 'es.rev.stage.write' },
  { id: 'solid', label: 'es.rev.stage.solid' },
]

/** Où en sont les mots appris : l'étape de leur prochain exercice, ou « bien ancrés » à 21 jours d'intervalle. */
function Stages({ progress }: { progress: Progress }) {
  const t = useT()
  const counts = useMemo(() => {
    const c: Record<string, number> = { recognize: 0, listen: 0, recall: 0, write: 0, solid: 0 }
    for (const [id, w] of WORDS) {
      const p = progress[wordItemId(id)]?.[WORD_SKILL]
      if (!p || p.srs.state === 0) continue
      const level = wordLevel(p)
      const stage = p.srs.scheduled_days >= 21 ? 'solid' : level >= 4 && writtenForms(w) ? 'write' : level >= 3 ? 'recall' : level === 2 ? 'listen' : 'recognize'
      c[stage]++
    }
    return c
  }, [progress])
  const max = Math.max(1, ...Object.values(counts))
  return (
    <section className="es-box">
      <h2>{t('es.rev.stages')}</h2>
      <p className="es-box-desc">{t('es.rev.stagesDesc')}</p>
      <ul className="es-stages">
        {STAGES.map((s) => (
          <li key={s.id} className={`st-${s.id}`}>
            <span>{t(s.label)}</span>
            <span className="es-stage-bar" aria-hidden>
              <span style={{ width: `${(counts[s.id] / max) * 100}%` }} />
            </span>
            <b>{counts[s.id]}</b>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Les mots qui reviennent chacun des sept prochains jours (aujourd'hui compte aussi les retards). */
function Forecast({ progress }: { progress: Progress }) {
  const t = useT()
  const lang = useLang()
  const days = useMemo(() => {
    const start = studyDayStart(Date.now())
    const out = Array.from({ length: 7 }, (_, d) => ({ at: start + d * 86400000, n: 0 }))
    for (const id of WORDS.keys()) {
      const p = progress[wordItemId(id)]?.[WORD_SKILL]
      if (!p || p.srs.state === 0 || p.suspended || p.due === null) continue
      const d = Math.max(0, Math.floor((p.due - start) / 86400000))
      if (d < 7) out[d].n++
    }
    return out
  }, [progress])
  const max = Math.max(1, ...days.map((d) => d.n))
  const fmt = new Intl.DateTimeFormat(lang, { weekday: 'short' })
  return (
    <section className="es-box">
      <h2>{t('es.rev.week')}</h2>
      <ol className="es-forecast">
        {days.map((d, i) => (
          <li key={d.at} className={i === 0 ? 'today' : ''}>
            <b>{d.n}</b>
            <span className="es-forecast-bar" aria-hidden>
              <span style={{ height: `${(d.n / max) * 100}%` }} />
            </span>
            <small>{i === 0 ? t('es.rev.todayShort') : fmt.format(d.at + 12 * 3600000)}</small>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** Dans combien de jours d'étude revient le prochain mot (0 : plus tard aujourd'hui). */
function nextDueDays(progress: Progress): number | null {
  let min = Infinity
  for (const id of WORDS.keys()) {
    const p = progress[wordItemId(id)]?.[WORD_SKILL]
    if (p && p.srs.state !== 0 && !p.suspended && p.due !== null) min = Math.min(min, p.due)
  }
  if (min === Infinity) return null
  const end = studyDayEnd(Date.now())
  if (min < end) return 0
  return Math.ceil((min - end) / 86400000) || 1
}

interface Entry {
  id: string
  retry: boolean
}

function ReviewSession({ ids, onExit, onMore }: { ids: string[]; onExit: () => void; onMore: (ids: string[]) => void }) {
  const t = useT()
  const size = useSettings((s) => s.esReviewSize)
  const [queue, setQueue] = useState<Entry[]>(() => ids.map((id) => ({ id, retry: false })))
  const [pos, setPos] = useState(0)
  const [missed, setMissed] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const shownAt = useRef(Date.now())
  const stage = useRef<HTMLDivElement>(null)

  const entry = queue[pos]
  const seed = `${entry?.id}:${pos}`
  // l'exercice dépend de ce que tu sais du mot au moment où il s'affiche
  const exercise = useMemo(() => (entry ? reviewExercise(entry.id, useStudy.getState().progress[wordItemId(entry.id)]?.[WORD_SKILL], seed) : null), [entry, seed])

  useEffect(() => {
    shownAt.current = Date.now()
    stage.current?.closest('.es-panel')?.scrollTo({ top: 0 })
  }, [pos, done])
  useEffect(() => () => stopSpeaking(), [])

  const onDone = (o: ExerciseOutcome) => {
    // seule la première réponse compte pour le calendrier ; le deuxième essai sert à fixer le mot
    if (!entry.retry) {
      const grade: Grade = o.verdict === 'right' ? 3 : o.verdict === 'wrong' ? 1 : 2
      answer(wordItemId(entry.id), WORD_SKILL, grade, Math.max(1, Math.min(Date.now() - shownAt.current, 120000)), o.typed)
    }
    let q = queue
    if (!o.correct && !entry.retry) {
      setMissed((m) => [...m, entry.id])
      q = [...queue, { id: entry.id, retry: true }]
      setQueue(q)
    }
    stopSpeaking()
    if (pos + 1 >= q.length) setDone(true)
    else setPos(pos + 1)
  }

  if (done) {
    const first = ids.length
    const right = first - missed.length
    const more = dueWords(useStudy.getState().progress)
    return (
      <div className="es-summary" ref={stage}>
        <h2>{t('es.rev.done')}</h2>
        <div className="es-score" style={{ ['--pct' as string]: `${Math.round((right / first) * 100)}%` }}>
          <strong>
            {right}/{first}
          </strong>
          <span>{t('es.rev.firstTry')}</span>
        </div>
        {missed.length > 0 && (
          <div className="es-sum-missed">
            <h3>{t('es.rev.missed')}</h3>
            <ul>
              {missed.map((id) => {
                const w = WORDS.get(id)!
                return (
                  <li key={id}>
                    <SpeakButton text={w.es} />
                    <b lang="es">{w.es}</b>
                    <span>{w.fr}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        <div className="es-foot">
          <button type="button" className="btn ghost" onClick={onExit}>
            {t('es.rev.back')}
          </button>
          {more.length > 0 ? (
            <button type="button" className="btn primary es-next" onClick={() => onMore(more.slice(0, size))} autoFocus>
              {t('es.rev.more', { n: Math.min(size, more.length) })}
            </button>
          ) : (
            <button type="button" className="btn primary es-next" onClick={() => go({ section: 'course' })} autoFocus>
              {t('es.backCourse')}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="es-player" ref={stage}>
      <header className="es-player-bar">
        <button type="button" className="icon-btn" onClick={onExit} aria-label={t('es.rev.quit')} title={t('es.rev.quit')}>
          <X size={20} />
        </button>
        <div className="es-meter" role="progressbar" aria-valuemin={0} aria-valuemax={queue.length} aria-valuenow={pos} aria-label={t('es.lessonProgress')}>
          <span style={{ width: `${Math.max(3, (pos / queue.length) * 100)}%` }} />
        </div>
        <span className="es-player-count">
          {pos + 1}/{queue.length}
        </span>
      </header>
      <p className="es-player-title">{t('es.review')}</p>
      <div className="es-step" key={seed}>
        {entry.retry && <p className="es-retry">{t('es.retry')}</p>}
        {exercise && <ExerciseView exercise={exercise} seed={seed} onDone={onDone} />}
      </div>
    </div>
  )
}
