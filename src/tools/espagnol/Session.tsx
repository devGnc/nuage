import { Undo2, Volume2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLang, useT } from '../../i18n'
import { previewDue, formatInterval, emptySrs } from '../../study/srs'
import type { Entry } from '../../study/queue'
import { answer, progressOf, undo, useStudy, type UndoToken } from '../../study/store'
import type { Grade, StudyItem } from '../../study/types'
import { useSettings } from '../../store/settings'
import { useUI } from '../../store/ui'
import { PosBadge } from './Badges'
import { speak, speechSupported } from './speech'

export const SKILL = 'recognize'

interface SessionState {
  queue: Entry[]
  learning: { itemId: string; due: number }[]
  current: Entry | null
  answered: number
}

function pickNext(s: Omit<SessionState, 'current'>, now: number): SessionState {
  const learning = [...s.learning].sort((a, b) => a.due - b.due)
  if (learning.length && learning[0].due <= now) {
    const [first, ...rest] = learning
    return { ...s, learning: rest, current: { itemId: first.itemId, kind: 'learning' } }
  }
  if (s.queue.length) {
    const [first, ...rest] = s.queue
    return { ...s, queue: rest, learning, current: first }
  }
  if (learning.length) {
    // plus rien d'autre : on montre la prochaine carte en apprentissage un peu en avance
    const [first, ...rest] = learning
    return { ...s, learning: rest, current: { itemId: first.itemId, kind: 'learning' } }
  }
  return { ...s, learning, current: null }
}

const GRADES: { g: Grade; key: 'es.again' | 'es.hard' | 'es.good' | 'es.easy'; cls: string }[] = [
  { g: 1, key: 'es.again', cls: 'again' },
  { g: 2, key: 'es.hard', cls: 'hard' },
  { g: 3, key: 'es.good', cls: 'good' },
  { g: 4, key: 'es.easy', cls: 'easy' },
]

/** Une séance : on montre l'espagnol, on retourne la carte, on dit si on savait. */
export function Session({ start, onExit }: { start: { learning: Entry[]; main: Entry[] }; onExit: () => void }) {
  const t = useT()
  const lang = useLang()
  const items = useStudy((s) => s.items)
  const voice = useSettings((s) => s.esVoice)
  const autoSpeak = useSettings((s) => s.esAutoSpeak)
  const [state, setState] = useState<SessionState>(() =>
    pickNext({ queue: [...start.learning, ...start.main], learning: [], answered: 0 }, Date.now()),
  )
  const [revealed, setRevealed] = useState(false)
  const shownAt = useRef(Date.now())
  const history = useRef<{ token: UndoToken; before: SessionState }[]>([])
  // après une annulation, la carte revient déjà retournée
  const restoring = useRef(false)

  const item: StudyItem | undefined = state.current ? items[state.current.itemId] : undefined

  // carte supprimée entre-temps : on passe à la suivante
  useEffect(() => {
    if (state.current && !items[state.current.itemId]) setState((s) => pickNext(s, Date.now()))
  }, [state, items])

  useEffect(() => {
    shownAt.current = Date.now()
    setRevealed(restoring.current)
    if (item && autoSpeak && !restoring.current) speak(item.front, voice)
    restoring.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.current?.itemId, state.answered])

  const previews = useMemo(() => {
    if (!item || !revealed) return null
    const srs = progressOf(item.id, SKILL)?.srs ?? emptySrs()
    const now = Date.now()
    const due = previewDue(srs, now)
    return Object.fromEntries(GRADES.map(({ g }) => [g, formatInterval(due[g] - now, lang)])) as Record<Grade, string>
  }, [item, revealed, lang])

  const grade = useCallback(
    (g: Grade) => {
      if (!item || !revealed) return
      const before = state
      const token = answer(item.id, SKILL, g, Date.now() - shownAt.current)
      history.current.push({ token, before })
      const p = progressOf(item.id, SKILL)
      const now = Date.now()
      // une carte encore en apprentissage revient dans la séance à son échéance (1 min, 10 min…)
      const stillLearning = p && (p.srs.state === 1 || p.srs.state === 3) && (p.due ?? 0) - now < 60 * 60_000
      setState((s) =>
        pickNext({ queue: s.queue, learning: stillLearning ? [...s.learning, { itemId: item.id, due: p!.due ?? now }] : s.learning, answered: s.answered + 1 }, now),
      )
    },
    [item, revealed, state],
  )

  const back = useCallback(() => {
    const last = history.current.pop()
    if (!last) return
    undo(last.token)
    restoring.current = true
    setState({ ...last.before })
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ui = useUI.getState()
      if (ui.settingsOpen || ui.launcherOpen || ui.panel) return
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, select, [contenteditable="true"]')) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        back()
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        setRevealed(true)
      } else if (revealed && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault()
        grade(Number(e.key) as Grade)
      } else if (revealed && e.key === ' ') {
        e.preventDefault()
        grade(3)
      } else if (e.key.toLowerCase() === 'l' && item) speak(item.front, voice)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [revealed, grade, back, item, voice])

  const left = {
    new: state.queue.filter((e) => e.kind === 'new').length + (state.current?.kind === 'new' ? 1 : 0),
    learning: state.learning.length + state.queue.filter((e) => e.kind === 'learning').length + (state.current?.kind === 'learning' ? 1 : 0),
    review: state.queue.filter((e) => e.kind === 'review').length + (state.current?.kind === 'review' ? 1 : 0),
  }

  if (!state.current || !item) {
    return (
      <div className="es-done">
        <h2>{t('es.sessionDone')}</h2>
        <p>{t('es.sessionDoneDesc', { n: state.answered })}</p>
        <button type="button" className="btn primary" onClick={onExit}>
          {t('es.backToday')}
        </button>
      </div>
    )
  }

  return (
    <div className="es-session">
      <div className="es-session-bar">
        <div className="es-left" aria-label={t('es.left')}>
          <span className="es-count new" title={t('es.state.new')}>{left.new}</span>
          <span className="es-count learning" title={t('es.state.learning')}>{left.learning}</span>
          <span className="es-count review" title={t('es.state.review')}>{left.review}</span>
        </div>
        <div className="es-session-actions">
          <button type="button" className="icon-btn" onClick={back} disabled={!history.current.length} aria-label={t('es.undo')} title={t('es.undo')}>
            <Undo2 size={18} />
          </button>
          <button type="button" className="icon-btn" onClick={onExit} aria-label={t('es.quit')} title={t('es.quit')}>
            <X size={18} />
          </button>
        </div>
      </div>

      <div className={`es-card ${revealed ? 'is-revealed' : ''}`} key={item.id + state.answered}>
        <div className="es-front">
          <span className="es-word" lang="es">{item.front}</span>
          <div className="es-front-meta">
            <PosBadge item={item} />
            {speechSupported() && (
              <button type="button" className="icon-btn es-speak" onClick={() => speak(item.front, voice)} aria-label={t('es.listen')} title={t('es.listen')}>
                <Volume2 size={18} />
              </button>
            )}
          </div>
        </div>
        {revealed ? (
          <div className="es-back">
            <p className="es-meaning">
              {item.back}
              {item.extra.lang && item.extra.lang !== 'fr' && <span className="es-lang">{String(item.extra.lang).toUpperCase()}</span>}
            </p>
            {typeof item.extra.note === 'string' && <p className="es-note" lang="es">{item.extra.note}</p>}
            {item.example && <p className="es-example" lang="es">{item.example}</p>}
          </div>
        ) : (
          <button type="button" className="btn primary es-reveal" onClick={() => setRevealed(true)}>
            {t('es.reveal')}
          </button>
        )}
      </div>

      {revealed && previews && (
        <div className="es-grades" role="group" aria-label={t('es.howWell')}>
          {GRADES.map(({ g, key, cls }) => (
            <button key={g} type="button" className={`es-grade ${cls}`} onClick={() => grade(g)}>
              <span className="es-grade-label">{t(key)}</span>
              <span className="es-grade-when">{previews[g]}</span>
              <kbd>{g}</kbd>
            </button>
          ))}
        </div>
      )}
      <p className="es-keys">{revealed ? t('es.keysAnswer') : t('es.keysReveal')}</p>
    </div>
  )
}
