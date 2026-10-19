import { Check, ChevronDown, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { checkAnswer, normalize, shuffled, type Verdict } from '../../course/check'
import { DIALOGUES } from '../../course/es'
import type { Exercise } from '../../course/types'
import { useT } from '../../i18n'
import { useSettings } from '../../store/settings'
import { DialogueView } from './DialogueView'
import { speak } from './speech'
import { AccentBar, insertInto, SpeakButton } from './ui'

/** Un exercice : la consigne, la réponse, puis la correction en bas avec « Continuer ».
 *  Choix et vrai/faux sont corrigés dès le clic ; les réponses écrites avec « Vérifier » ou Entrée. */

export interface ExerciseOutcome {
  /** false pour la production libre, qui n'est pas notée */
  graded: boolean
  correct: boolean
  verdict: Verdict
  typed: string | null
}

interface Answer {
  verdict: Verdict
  typed?: string
  /** la bonne réponse, montrée sous le verdict */
  expected?: string
  /** précision supplémentaire : traduction, texte entendu… */
  detail?: ReactNode
  /** espagnol à faire entendre une fois la réponse donnée */
  say?: string
  /** verdict formulé autrement que d'habitude */
  title?: string
}

type Of<K extends Exercise['kind']> = Extract<Exercise, { kind: K }>
interface KindProps<E> {
  e: E
  seed: string
  answer: Answer | null
  submit: (a: Answer) => void
}

const PRAISE = ['¡Muy bien!', '¡Perfecto!', '¡Genial!', '¡Eso es!', '¡Bravo!']

export function ExerciseView({ exercise, seed, onDone }: { exercise: Exercise; seed: string; onDone: (o: ExerciseOutcome) => void }) {
  const t = useT()
  const voice = useSettings((s) => s.esVoice)
  const autoSpeak = useSettings((s) => s.esAutoSpeak)
  const [answer, setAnswer] = useState<Answer | null>(null)
  const next = useRef<HTMLButtonElement>(null)

  const submit = (a: Answer) => {
    if (answer) return
    setAnswer(a)
    if (a.say && autoSpeak) speak(a.say, { voice })
  }

  useEffect(() => {
    if (answer) next.current?.focus({ preventScroll: true })
  }, [answer])

  const graded = exercise.kind !== 'write'
  const props = { seed, answer, submit }
  const e = exercise
  const body =
    e.kind === 'choice' ? <Choice e={e} {...props} />
    : e.kind === 'truefalse' ? <TrueFalse e={e} {...props} />
    : e.kind === 'match' ? <Match e={e} {...props} />
    : e.kind === 'type' ? <Typed e={e} {...props} />
    : e.kind === 'dictation' ? <Dictation e={e} {...props} />
    : e.kind === 'cloze' ? <Cloze e={e} {...props} />
    : e.kind === 'order' ? <Order e={e} {...props} />
    : <Write e={e} {...props} />

  const done = () => answer && onDone({ graded, correct: answer.verdict !== 'wrong', verdict: answer.verdict, typed: answer.typed ?? null })

  return (
    <div className="es-ex">
      {body}
      {answer && (
        <div className={`es-foot es-feedback ${graded ? `v-${answer.verdict}` : 'v-neutral'}`} role="status">
          <div className="es-feedback-text">
            {graded && (
              <strong className="es-verdict">
                {answer.verdict === 'wrong' ? <X size={18} /> : <Check size={18} />}
                {answer.title ?? (answer.verdict === 'right' ? PRAISE[seed.length % PRAISE.length] : t(`es.fb.${answer.verdict}`))}
              </strong>
            )}
            {answer.expected && answer.verdict !== 'right' && (
              <p className="es-expected">
                {t('es.fb.expected')} <b lang="es">{answer.expected}</b>
              </p>
            )}
            {answer.detail && <div className="es-fb-detail">{answer.detail}</div>}
            {e.explain && <p className="es-explain">{e.explain}</p>}
          </div>
          <button ref={next} type="button" className="btn primary es-next" onClick={done}>
            {t('es.continue')}
          </button>
        </div>
      )}
    </div>
  )
}

/** Barre du bas avant la réponse : le bouton « Vérifier ». */
function CheckBar({ disabled, onCheck, label }: { disabled?: boolean; onCheck: () => void; label?: string }) {
  const t = useT()
  return (
    <div className="es-foot">
      <span />
      <button type="button" className="btn primary es-next" disabled={disabled} onClick={onCheck}>
        {label ?? t('es.check')}
      </button>
    </div>
  )
}

/** Touches 1 à 9 pour les choix, hors champ de saisie. */
function useDigits(n: number, onPick: (i: number) => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    const on = (ev: KeyboardEvent) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return
      if ((ev.target as HTMLElement).closest('input, textarea, select')) return
      const i = Number(ev.key) - 1
      if (Number.isInteger(i) && i >= 0 && i < n) {
        ev.preventDefault()
        onPick(i)
      }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  })
}

function Prompt({ children }: { children: ReactNode }) {
  return <h2 className="es-prompt">{children}</h2>
}

function Choice({ e, seed, answer, submit }: KindProps<Of<'choice'>>) {
  const options = useMemo(() => shuffled(e.options, seed), [e, seed])
  const right = e.options[0]
  const [picked, setPicked] = useState<string | null>(null)
  const pick = (o: string) => {
    if (answer) return
    setPicked(o)
    submit({ verdict: o === right ? 'right' : 'wrong', typed: o, expected: right, detail: e.say ? <p lang="es">« {e.say} »</p> : undefined })
  }
  useDigits(options.length, (i) => pick(options[i]), !answer)
  return (
    <>
      <Prompt>{e.prompt}</Prompt>
      {e.say && (
        <div className="es-listen">
          <SpeakButton text={e.say} big auto />
          <SpeakButton text={e.say} slow />
        </div>
      )}
      <div className={`es-options ${options.some((o) => o.length > 28) ? 'long' : ''}`}>
        {options.map((o, i) => {
          const state = !answer ? '' : o === right ? 'is-right' : o === picked ? 'is-wrong' : 'is-dim'
          return (
            <button key={o} type="button" className={`es-option ${state}`} disabled={!!answer} onClick={() => pick(o)}>
              <kbd>{i + 1}</kbd>
              <span>{o}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}

function TrueFalse({ e, answer, submit }: KindProps<Of<'truefalse'>>) {
  const t = useT()
  const [picked, setPicked] = useState<boolean | null>(null)
  const [showDlg, setShowDlg] = useState(false)
  const d = e.dialogue ? DIALOGUES.get(e.dialogue) : undefined
  const pick = (v: boolean) => {
    if (answer) return
    setPicked(v)
    submit({ verdict: v === e.answer ? 'right' : 'wrong', typed: v ? 'vrai' : 'faux', expected: e.answer ? t('es.true') : t('es.false') })
  }
  useDigits(2, (i) => pick(i === 0), !answer)
  return (
    <>
      <Prompt>{e.prompt ?? t('es.tfPrompt')}</Prompt>
      <p className="es-statement">{e.statement}</p>
      <div className="es-options two">
        {[true, false].map((v, i) => {
          const state = !answer ? '' : v === e.answer ? 'is-right' : v === picked ? 'is-wrong' : 'is-dim'
          return (
            <button key={String(v)} type="button" className={`es-option ${state}`} disabled={!!answer} onClick={() => pick(v)}>
              <kbd>{i + 1}</kbd>
              <span>{v ? t('es.true') : t('es.false')}</span>
            </button>
          )
        })}
      </div>
      {d && (
        <div className="es-dlg-peek">
          <button type="button" className="link-btn" aria-expanded={showDlg} onClick={() => setShowDlg(!showDlg)}>
            <ChevronDown size={15} className={showDlg ? 'flip' : ''} />
            {showDlg ? t('es.dlg.hide') : t('es.dlg.review')}
          </button>
          {showDlg && <DialogueView d={d} compact showTitle={false} />}
        </div>
      )}
    </>
  )
}

function Match({ e, seed, answer, submit }: KindProps<Of<'match'>>) {
  const t = useT()
  const voice = useSettings((s) => s.esVoice)
  const idx = useMemo(() => e.pairs.map((_, i) => i), [e])
  const left = useMemo(() => shuffled(idx, seed + 'L'), [idx, seed])
  const right = useMemo(() => shuffled(idx, seed + 'R'), [idx, seed])
  const [selL, setSelL] = useState<number | null>(null)
  const [selR, setSelR] = useState<number | null>(null)
  const [done, setDone] = useState<Set<number>>(new Set())
  const [miss, setMiss] = useState<[number, number] | null>(null)
  const [mistakes, setMistakes] = useState(0)

  const tryPair = (l: number, r: number) => {
    setSelL(null)
    setSelR(null)
    if (l === r) {
      const next = new Set(done).add(l)
      setDone(next)
      // une seule erreur (un doigt qui glisse) reste une réussite
      if (next.size === e.pairs.length)
        submit({
          verdict: mistakes === 0 ? 'right' : mistakes === 1 ? 'typo' : 'wrong',
          title: mistakes === 1 ? t('es.fb.almost') : undefined,
          detail: mistakes ? <p>{t('es.fb.matchMistakes', { n: mistakes })}</p> : undefined,
        })
    } else {
      setMistakes((m) => m + 1)
      setMiss([l, r])
      setTimeout(() => setMiss(null), 650)
    }
  }
  const clickL = (i: number) => {
    if (answer || done.has(i)) return
    speak(e.pairs[i][0], { voice })
    if (selR !== null) tryPair(i, selR)
    else setSelL(selL === i ? null : i)
  }
  const clickR = (i: number) => {
    if (answer || done.has(i)) return
    if (selL !== null) tryPair(selL, i)
    else setSelR(selR === i ? null : i)
  }
  const cls = (i: number, sel: number | null, side: 0 | 1) =>
    `es-tile ${done.has(i) ? 'is-done' : ''} ${sel === i ? 'is-sel' : ''} ${miss && miss[side] === i ? 'is-miss' : ''}`

  return (
    <>
      <Prompt>{e.prompt ?? t('es.matchPrompt')}</Prompt>
      <div className="es-match">
        <div className="es-match-col" lang="es">
          {left.map((i) => (
            <button key={i} type="button" className={cls(i, selL, 0)} disabled={done.has(i)} onClick={() => clickL(i)}>
              {e.pairs[i][0]}
            </button>
          ))}
        </div>
        <div className="es-match-col">
          {right.map((i) => (
            <button key={i} type="button" className={cls(i, selR, 1)} disabled={done.has(i)} onClick={() => clickR(i)}>
              {e.pairs[i][1]}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

/** Champ de réponse en espagnol, avec les touches pour les accents. */
function SpanishInput({
  value,
  set,
  answer,
  placeholder,
  onSubmit,
}: {
  value: string
  set: (v: string) => void
  answer: Answer | null
  placeholder: string
  onSubmit: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    if (value.trim()) onSubmit()
  }
  return (
    <form className="es-answer" onSubmit={submit}>
      <input
        ref={ref}
        className={`input es-input ${answer ? `v-${answer.verdict}` : ''}`}
        value={value}
        onChange={(ev) => set(ev.target.value)}
        readOnly={!!answer}
        placeholder={placeholder}
        lang="es"
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="done"
      />
      {!answer && <AccentBar onInsert={(ch) => insertInto(ref.current, value, ch, set)} />}
    </form>
  )
}

function useTolerant() {
  return useSettings((s) => s.esAccentTolerant)
}

function Typed({ e, answer, submit }: KindProps<Of<'type'>>) {
  const t = useT()
  const tolerant = useTolerant()
  const [value, set] = useState('')
  const check = () => {
    const r = checkAnswer(value, e.answers, tolerant)
    submit({ verdict: r.verdict, typed: value, expected: r.expected, say: r.expected })
  }
  return (
    <>
      <Prompt>{e.prompt}</Prompt>
      {e.say && (
        <div className="es-listen">
          <SpeakButton text={e.say} big auto />
        </div>
      )}
      <SpanishInput value={value} set={set} answer={answer} placeholder={t('es.typeHere')} onSubmit={check} />
      {!answer && <CheckBar disabled={!value.trim()} onCheck={check} />}
    </>
  )
}

function Dictation({ e, answer, submit }: KindProps<Of<'dictation'>>) {
  const t = useT()
  const tolerant = useTolerant()
  const [value, set] = useState('')
  const check = () => {
    const r = checkAnswer(value, [e.text], tolerant)
    submit({ verdict: r.verdict, typed: value, expected: r.expected, detail: <p className="es-translation">{e.translation}</p> })
  }
  return (
    <>
      <Prompt>{t('es.dictationPrompt')}</Prompt>
      <div className="es-listen">
        <SpeakButton text={e.text} big auto />
        <SpeakButton text={e.text} slow />
      </div>
      <SpanishInput value={value} set={set} answer={answer} placeholder={t('es.typeHere')} onSubmit={check} />
      {answer && answer.verdict === 'right' && (
        <p className="es-solution" lang="es">
          {e.text}
        </p>
      )}
      {!answer && <CheckBar disabled={!value.trim()} onCheck={check} />}
    </>
  )
}

const VERDICT_RANK: Record<Verdict, number> = { right: 0, accent: 1, typo: 2, wrong: 3 }

function Cloze({ e, seed, answer, submit }: KindProps<Of<'cloze'>>) {
  const t = useT()
  const tolerant = useTolerant()
  const parts = useMemo(() => e.text.split('___'), [e])
  const holes = parts.length - 1
  const options = useMemo(() => (e.options ? shuffled(e.options, seed) : null), [e, seed])
  // avec options : l'indice de l'option posée dans chaque trou ; sans : le texte tapé
  const [picks, setPicks] = useState<(number | null)[]>(() => Array(holes).fill(null))
  const [typed, setTyped] = useState<string[]>(() => Array(holes).fill(''))
  const [results, setResults] = useState<Verdict[] | null>(null)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const lastFocus = useRef(0)

  const solution = parts.map((p, i) => p + (i < holes ? e.answers[i][0] : '')).join('')
  const filled = options ? picks.every((p) => p !== null) : typed.every((v) => v.trim())

  const check = () => {
    if (!filled || answer) return
    const res: Verdict[] = []
    for (let i = 0; i < holes; i++) {
      if (options) {
        const got = normalize(options[picks[i]!])
        res.push(e.answers[i].some((a) => normalize(a) === got) ? 'right' : 'wrong')
      } else res.push(checkAnswer(typed[i], e.answers[i], tolerant).verdict)
    }
    setResults(res)
    const worst = res.reduce<Verdict>((w, v) => (VERDICT_RANK[v] > VERDICT_RANK[w] ? v : w), 'right')
    const mine = options ? picks.map((p) => options[p!]).join(' · ') : typed.join(' · ')
    submit({
      verdict: worst,
      typed: mine,
      expected: solution,
      say: solution,
      detail: e.translation ? <p className="es-translation">{e.translation}</p> : undefined,
    })
  }

  const placeOption = (oi: number) => {
    if (answer) return
    const at = picks.indexOf(null)
    if (at < 0) return
    const next = [...picks]
    next[at] = oi
    setPicks(next)
  }
  const clearHole = (i: number) => {
    if (answer) return
    const next = [...picks]
    next[i] = null
    setPicks(next)
  }

  return (
    <>
      <Prompt>{e.prompt ?? (options ? t('es.clozePick') : t('es.clozeType'))}</Prompt>
      <form
        className="es-cloze"
        lang="es"
        onSubmit={(ev) => {
          ev.preventDefault()
          check()
        }}
      >
        {parts.map((p, i) => (
          <span key={i}>
            {p}
            {i < holes &&
              (options ? (
                <button
                  type="button"
                  className={`es-hole ${picks[i] === null ? 'empty' : ''} ${results ? `v-${results[i]}` : ''}`}
                  onClick={() => clearHole(i)}
                  disabled={!!answer || picks[i] === null}
                  aria-label={t('es.hole', { n: i + 1 })}
                >
                  {picks[i] !== null ? options[picks[i]!] : ' '}
                </button>
              ) : (
                <input
                  ref={(el) => {
                    inputs.current[i] = el
                  }}
                  className={`es-hole-input ${results ? `v-${results[i]}` : ''}`}
                  style={{ width: `${Math.max(4, ...e.answers[i].map((a) => a.length)) + 1.5}ch` }}
                  value={typed[i]}
                  readOnly={!!answer}
                  autoFocus={i === 0}
                  onFocus={() => (lastFocus.current = i)}
                  onChange={(ev) => setTyped(typed.map((v, k) => (k === i ? ev.target.value : v)))}
                  aria-label={t('es.hole', { n: i + 1 })}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
              ))}
          </span>
        ))}
        <button type="submit" hidden />
      </form>
      {options && !answer && (
        <div className="es-bank">
          {options.map((o, oi) => (
            <button key={oi} type="button" className="es-token" disabled={picks.includes(oi)} onClick={() => placeOption(oi)} lang="es">
              {o}
            </button>
          ))}
        </div>
      )}
      {!options && !answer && (
        <AccentBar
          onInsert={(ch) => {
            const i = lastFocus.current
            insertInto(inputs.current[i], typed[i], ch, (v) => setTyped(typed.map((x, k) => (k === i ? v : x))))
          }}
        />
      )}
      {!answer && <CheckBar disabled={!filled} onCheck={check} />}
    </>
  )
}

function Order({ e, seed, answer, submit }: KindProps<Of<'order'>>) {
  const t = useT()
  const tokens = useMemo(() => [...e.solution.split(' '), ...(e.extra ?? [])], [e])
  const bank = useMemo(() => {
    const ids = tokens.map((_, i) => i)
    let s = shuffled(ids, seed)
    // jamais dans l'ordre de la solution dès le départ
    if (s.map((i) => tokens[i]).join(' ') === e.solution) s = [...s.slice(1), s[0]]
    return s
  }, [tokens, seed, e])
  const [placed, setPlaced] = useState<number[]>([])

  const check = () => {
    const mine = placed.map((i) => tokens[i]).join(' ')
    submit({ verdict: normalize(mine) === normalize(e.solution) ? 'right' : 'wrong', typed: mine, expected: e.solution, say: e.solution })
  }

  return (
    <>
      <Prompt>{e.prompt ?? t('es.orderPrompt')}</Prompt>
      <p className="es-translation big">« {e.translation} »</p>
      <div className={`es-built ${answer ? `v-${answer.verdict}` : ''}`} lang="es" aria-live="polite">
        {placed.length === 0 && <span className="es-built-empty">{t('es.orderEmpty')}</span>}
        {placed.map((i) => (
          <button key={i} type="button" className="es-token" disabled={!!answer} onClick={() => setPlaced(placed.filter((x) => x !== i))}>
            {tokens[i]}
          </button>
        ))}
      </div>
      {!answer && (
        <div className="es-bank" lang="es">
          {bank.map((i) => (
            <button key={i} type="button" className="es-token" disabled={placed.includes(i)} onClick={() => setPlaced([...placed, i])}>
              {tokens[i]}
            </button>
          ))}
        </div>
      )}
      {!answer && <CheckBar disabled={placed.length === 0} onCheck={check} />}
    </>
  )
}

function Write({ e, answer, submit }: KindProps<Of<'write'>>) {
  const t = useT()
  const [value, set] = useState('')
  const [ticks, setTicks] = useState<boolean[]>(() => e.checklist.map(() => false))
  const ref = useRef<HTMLTextAreaElement>(null)
  return (
    <>
      <Prompt>{e.prompt}</Prompt>
      <textarea
        ref={ref}
        className="input es-write"
        rows={5}
        value={value}
        readOnly={!!answer}
        onChange={(ev) => set(ev.target.value)}
        placeholder={t('es.writeHere')}
        lang="es"
        spellCheck={false}
      />
      {!answer && <AccentBar onInsert={(ch) => insertInto(ref.current, value, ch, set)} />}
      {answer && (
        <div className="es-model">
          <div className="es-model-head">
            <h3>{t('es.model')}</h3>
            <SpeakButton text={e.model} />
          </div>
          <p lang="es">{e.model}</p>
          <h3>{t('es.checklist')}</h3>
          <ul className="es-checklist">
            {e.checklist.map((c, i) => (
              <li key={i}>
                <label>
                  <input type="checkbox" checked={ticks[i]} onChange={() => setTicks(ticks.map((v, k) => (k === i ? !v : v)))} />
                  <span>{c}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!answer && <CheckBar onCheck={() => submit({ verdict: 'right', typed: value })} label={value.trim() ? t('es.compare') : t('es.showModel')} />}
    </>
  )
}
