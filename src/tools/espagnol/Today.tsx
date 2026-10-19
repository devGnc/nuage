import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLang, useT } from '../../i18n'
import { buildDayQueue, interleave, studyDayStart, type DayQueue } from '../../study/queue'
import { isMature } from '../../study/srs'
import { useStudy } from '../../study/store'
import { REVIEWABLE_KINDS } from '../../study/types'
import { useSettings } from '../../store/settings'
import { goSection } from './sections'
import { Session, SKILL } from './Session'

const EXTRA_KEY = 'nuage:esExtraNew'

/** Nouvelles cartes ajoutées en plus aujourd'hui (« encore 10 »), remises à zéro chaque jour. */
function readExtra(): number {
  try {
    const v = JSON.parse(localStorage.getItem(EXTRA_KEY) || '{}') as { day?: number; n?: number }
    return v.day === studyDayStart() ? (v.n ?? 0) : 0
  } catch {
    return 0
  }
}
function writeExtra(n: number) {
  try {
    localStorage.setItem(EXTRA_KEY, JSON.stringify({ day: studyDayStart(), n }))
  } catch {
    /* stockage indisponible */
  }
}

export function Today() {
  const t = useT()
  const lang = useLang()
  const items = useStudy((s) => s.items)
  const progress = useStudy((s) => s.progress)
  const reviews = useStudy((s) => s.reviews)
  const newPerDay = useSettings((s) => s.esNewPerDay)
  const maxReviews = useSettings((s) => s.esMaxReviews)
  const [extra, setExtra] = useState(readExtra)
  const [session, setSession] = useState<{ learning: DayQueue['learning']; main: DayQueue['reviews'] } | null>(null)

  const q = useMemo(
    () => buildDayQueue(items, progress, reviews, { subject: 'es', skill: SKILL, newPerDay, maxReviews, extraNew: extra }),
    [items, progress, reviews, newPerDay, maxReviews, extra],
  )

  const totals = useMemo(() => {
    let all = 0
    let seen = 0
    let mature = 0
    for (const it of Object.values(items)) {
      if (it.subject !== 'es' || it.deletedAt || !REVIEWABLE_KINDS.includes(it.kind)) continue
      all++
      const p = progress[it.id]?.[SKILL]
      if (p && p.srs.state !== 0) seen++
      if (isMature(p?.srs)) mature++
    }
    return { all, seen, mature }
  }, [items, progress])

  if (session) return <Session start={session} onExit={() => setSession(null)} />

  const nf = (n: number) => n.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')
  const todo = q.learning.length + q.reviews.length + q.fresh.length
  const minutes = Math.round(q.counts.ms / 60000)

  if (!totals.all) {
    return (
      <div className="es-empty">
        <h2>{t('es.emptyTitle')}</h2>
        <p>{t('es.emptyDesc')}</p>
        <button type="button" className="btn primary" onClick={() => goSection('import')}>
          {t('es.importCta')}
        </button>
      </div>
    )
  }

  return (
    <div className="es-today">
      <h2 className="es-title">{t('es.today')}</h2>
      <div className="es-due">
        <div className="es-due-item review">
          <strong>{nf(q.reviews.length)}</strong>
          <span>{t('es.dueReviews')}</span>
        </div>
        <div className="es-due-item learning">
          <strong>{nf(q.learning.length)}</strong>
          <span>{t('es.dueLearning')}</span>
        </div>
        <div className="es-due-item new">
          <strong>{nf(q.fresh.length)}</strong>
          <span>{t('es.dueNew')}</span>
        </div>
      </div>

      {todo > 0 ? (
        <button
          type="button"
          className="btn primary es-start"
          onClick={() => setSession({ learning: q.learning, main: interleave(q.reviews, q.fresh) })}
        >
          {q.counts.answers ? t('es.continue') : t('es.start')}
        </button>
      ) : (
        <div className="es-nothing">
          <p>{q.counts.answers ? t('es.allDone') : t('es.nothingDue')}</p>
          {q.unseen > 0 && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                writeExtra(extra + 10)
                setExtra(extra + 10)
              }}
            >
              <Plus size={15} /> {t('es.moreNew')}
            </button>
          )}
        </div>
      )}

      {q.postponed > 0 && <p className="hint">{t('es.postponed', { n: nf(q.postponed), max: nf(maxReviews) })}</p>}

      <dl className="es-facts">
        <div>
          <dt>{t('es.factAnswers')}</dt>
          <dd>
            {nf(q.counts.answers)}
            {minutes > 0 && <span className="es-fact-sub"> ({minutes} min)</span>}
          </dd>
        </div>
        <div>
          <dt>{t('es.factSeen')}</dt>
          <dd>
            {nf(totals.seen)} <span className="es-fact-sub">/ {nf(totals.all)}</span>
          </dd>
        </div>
        <div>
          <dt>{t('es.factMature')}</dt>
          <dd>{nf(totals.mature)}</dd>
        </div>
      </dl>
    </div>
  )
}
