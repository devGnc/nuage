import { Check, NotebookText, RotateCcw } from 'lucide-react'
import { useMemo } from 'react'
import { COURSE, LESSONS } from '../../course/es'
import { dueWords, lessonStatuses, nextLesson, todayActivity, type LessonStatus } from '../../course/progress'
import type { LessonKind, Unit } from '../../course/types'
import { useT, type TKey } from '../../i18n'
import { useStudy } from '../../study/store'
import { go, openLesson } from './sections'

const KIND: Record<LessonKind, TKey> = {
  vocab: 'es.kind.vocab',
  dialogue: 'es.kind.dialogue',
  grammar: 'es.kind.grammar',
  practice: 'es.kind.practice',
  review: 'es.kind.review',
}

/** Le cours : la leçon conseillée en tête, puis toutes les unités. Tout est ouvert, l'ordre n'est qu'un conseil. */
export function CourseHome() {
  const t = useT()
  const progress = useStudy((s) => s.progress)
  const reviews = useStudy((s) => s.reviews)
  const statuses = useMemo(() => lessonStatuses(progress, reviews), [progress, reviews])
  const next = nextLesson(statuses)
  const due = useMemo(() => dueWords(progress).length, [progress])
  const today = useMemo(() => todayActivity(reviews), [reviews])
  const current = COURSE.find((l) => l.units.length > 0) ?? COURSE[0]
  const resume = next ?? LESSONS[0]
  const lessonNo = resume ? resume.unit.lessons.indexOf(resume.lesson) + 1 : 0

  return (
    <div className="es-course">
      <ol className="es-levels" aria-label={t('es.levels')}>
        {COURSE.map((l) => (
          <li key={l.id} className={`${l === current ? 'current' : ''} ${l.units.length ? '' : 'soon'}`}>
            <b>{l.id}</b>
            <span>{l.units.length ? l.title : t('es.soon')}</span>
          </li>
        ))}
      </ol>

      {resume && (
        <section className="es-resume" aria-label={t('es.nextLesson')}>
          <div className="es-resume-main">
            <p className="es-resume-where">
              {next ? t('es.nextLesson') : t('es.allLessonsDone')} · {t('es.unitN', { n: resume.unit.number })}, {t('es.lessonN', { n: lessonNo })}
            </p>
            <h2>{resume.lesson.title}</h2>
            <p className="es-resume-goal">{resume.lesson.goal}</p>
            <button type="button" className="btn primary es-cta" onClick={() => openLesson(resume.lesson.id)}>
              {next ? t('es.startLesson') : t('es.redoLesson')}
            </button>
          </div>
          <div className="es-resume-side">
            <h3>{t('es.today.title')}</h3>
            <dl className="es-today">
              <div>
                <dt>{t('es.today.minutes')}</dt>
                <dd>{today.minutes}</dd>
              </div>
              <div>
                <dt>{t('es.today.lessons')}</dt>
                <dd>{today.lessons}</dd>
              </div>
              <div>
                <dt>{t('es.today.reviewed')}</dt>
                <dd>{today.reviewed}</dd>
              </div>
            </dl>
            {due > 0 && (
              <button type="button" className="es-due-link" onClick={() => go({ section: 'review' })}>
                <RotateCcw size={16} />
                <span>{t('es.dueWords', { n: due })}</span>
              </button>
            )}
          </div>
        </section>
      )}

      {current.units.map((u) => (
        <UnitBlock key={u.id} unit={u} statuses={statuses} nextId={next?.lesson.id} />
      ))}

      {COURSE.filter((l) => l.units.length === 0).length > 0 && <p className="es-soon-note">{t('es.soonNote')}</p>}
    </div>
  )
}

function UnitBlock({ unit, statuses, nextId }: { unit: Unit; statuses: Map<string, LessonStatus>; nextId?: string }) {
  const t = useT()
  const done = unit.lessons.filter((l) => statuses.get(l.id)?.done).length
  return (
    <section className="es-unit" aria-labelledby={`${unit.id}-title`}>
      <header className="es-unit-head">
        <span className="es-unit-num" aria-hidden>
          {unit.number}
        </span>
        <div className="es-unit-text">
          <h2 id={`${unit.id}-title`}>
            {unit.title} <span lang="es">{unit.titleEs}</span>
          </h2>
          <p>{unit.goal}</p>
        </div>
        <span className="es-unit-count" title={t('es.unitDone', { d: done, n: unit.lessons.length })}>
          {done}/{unit.lessons.length}
        </span>
      </header>
      <ol className="es-lessons">
        {unit.lessons.map((l, i) => {
          const s = statuses.get(l.id)
          return (
            <li key={l.id}>
              <button type="button" className={`es-lesson ${s?.done ? 'done' : ''} ${l.id === nextId ? 'next' : ''}`} onClick={() => openLesson(l.id)}>
                <span className="es-lesson-dot" aria-hidden>
                  {s?.done ? <Check size={15} strokeWidth={3} /> : i + 1}
                </span>
                <span className="es-lesson-text">
                  <b>{l.title}</b>
                  <small>
                    {t(KIND[l.kind])} · {l.goal}
                  </small>
                </span>
                {s?.best != null && <span className="es-best">{s.best} %</span>}
              </button>
            </li>
          )
        })}
      </ol>
      <button type="button" className="link-btn es-unit-notebook" onClick={() => go({ section: 'notebook', tab: 'notes' })}>
        <NotebookText size={15} />
        {t('es.unitNotebook')}
      </button>
    </section>
  )
}
