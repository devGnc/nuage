import { Check, ChevronDown, ChevronLeft, Earth, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { normalize, stripAccents } from '../../course/check'
import { LESSONS, NOTES, UNITS } from '../../course/es'
import { WORD_SKILL, wordItemId } from '../../course/progress'
import type { Unit } from '../../course/types'
import { useT, type TKey } from '../../i18n'
import { useStudy } from '../../study/store'
import { Segmented } from '../../components/ui'
import { DialogueView } from './DialogueView'
import { go, openLesson, type NotebookTab } from './sections'
import { Markdown, PosLabel, SpeakButton } from './ui'

/** Le cahier : tout ce que le cours explique, à relire quand on veut — fiches de grammaire, lexique, dialogues. */

const TABS: { value: NotebookTab; label: TKey }[] = [
  { value: 'notes', label: 'es.nb.notes' },
  { value: 'words', label: 'es.nb.words' },
  { value: 'dialogues', label: 'es.nb.dialogues' },
]

const fold = (s: string) => stripAccents(normalize(s))

export function Notebook({ tab, note }: { tab: NotebookTab; note?: string }) {
  const t = useT()
  const [q, setQ] = useState('')
  if (note) return <NoteReader id={note} />
  const query = fold(q)
  return (
    <div className="es-notebook">
      <div className="es-nb-head">
        <h1 className="es-title">{t('es.notebook')}</h1>
        <label className="es-search">
          <Search size={16} />
          <input className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('es.nb.search')} aria-label={t('es.nb.search')} />
        </label>
      </div>
      <Segmented value={tab} onChange={(v) => go({ section: 'notebook', tab: v }, true)} options={TABS.map((x) => ({ value: x.value, label: t(x.label) }))} />
      <div className="es-nb-body">
        {tab === 'notes' ? <NotesList query={query} /> : tab === 'words' ? <Lexicon query={query} /> : <Dialogues query={query} />}
      </div>
    </div>
  )
}

function UnitTitle({ u }: { u: Unit }) {
  const t = useT()
  return (
    <h2 className="es-nb-unit">
      <span>{t('es.unitN', { n: u.number })}</span> {u.title}
    </h2>
  )
}

function NoResult() {
  const t = useT()
  return <p className="es-nb-none">{t('es.nb.none')}</p>
}

function NotesList({ query }: { query: string }) {
  const groups = UNITS.map((u) => ({ u, notes: u.notes.filter((n) => !query || fold(`${n.title} ${n.summary} ${n.body}`).includes(query)) })).filter((g) => g.notes.length)
  if (!groups.length) return <NoResult />
  return (
    <>
      {groups.map(({ u, notes }) => (
        <section key={u.id} className="es-nb-group">
          <UnitTitle u={u} />
          <ul className="es-note-list">
            {notes.map((n) => (
              <li key={n.id}>
                <button type="button" className="es-note-link" onClick={() => go({ section: 'notebook', tab: 'notes', note: n.id })}>
                  <b>{n.title}</b>
                  <span>{n.summary}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}

function NoteReader({ id }: { id: string }) {
  const t = useT()
  const n = NOTES.get(id)
  const usedIn = useMemo(() => LESSONS.filter(({ lesson }) => lesson.steps.some((s) => s.type === 'note' && s.note === id)), [id])
  return (
    <article className="es-reader">
      <button type="button" className="link-btn" onClick={() => go({ section: 'notebook', tab: 'notes' })}>
        <ChevronLeft size={16} />
        {t('es.notebook')}
      </button>
      {n ? (
        <>
          <h1 className="es-title">{n.title}</h1>
          <Markdown text={n.body} />
          {usedIn.length > 0 && (
            <footer className="es-reader-foot">
              <span>{t('es.nb.usedIn')}</span>
              {usedIn.map(({ lesson, unit }) => (
                <button key={lesson.id} type="button" className="chip" onClick={() => openLesson(lesson.id)}>
                  {t('es.unitN', { n: unit.number })} · {lesson.title}
                </button>
              ))}
            </footer>
          )}
        </>
      ) : (
        <p className="es-nb-none">{t('es.nb.missing')}</p>
      )}
    </article>
  )
}

function Lexicon({ query }: { query: string }) {
  const t = useT()
  const progress = useStudy((s) => s.progress)
  const groups = UNITS.map((u) => ({ u, words: u.words.filter((w) => !query || fold(`${w.es} ${w.fr} ${w.latam ?? ''}`).includes(query)) })).filter((g) => g.words.length)
  if (!groups.length) return <NoResult />
  return (
    <>
      <p className="es-nb-hint">{t('es.nb.wordsHint')}</p>
      {groups.map(({ u, words }) => (
        <section key={u.id} className="es-nb-group">
          <UnitTitle u={u} />
          <ul className="es-lexicon">
            {words.map((w) => {
              const seen = (progress[wordItemId(w.id)]?.[WORD_SKILL]?.srs.state ?? 0) !== 0
              return (
                <li key={w.id} className={seen ? 'seen' : ''}>
                  <SpeakButton text={w.es} />
                  <div className="es-lex-es">
                    <b lang="es">{w.es}</b>
                    <PosLabel pos={w.pos} />
                    {seen && (
                      <span className="es-seen" title={t('es.nb.seen')} aria-label={t('es.nb.seen')}>
                        <Check size={13} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className="es-lex-fr">{w.fr}</div>
                  {(w.example || w.latam || w.note) && (
                    <div className="es-lex-more">
                      {w.example && (
                        <p>
                          <span lang="es">{w.example[0]}</span> — {w.example[1]}
                        </p>
                      )}
                      {w.note && <p>{w.note}</p>}
                      {w.latam && (
                        <p className="es-latam">
                          <Earth size={13} />
                          <span>
                            {t('es.latam')} <b lang="es">{w.latam}</b>
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </>
  )
}

function Dialogues({ query }: { query: string }) {
  const [open, setOpen] = useState<string | null>(null)
  const groups = UNITS.map((u) => ({
    u,
    dialogues: u.dialogues.filter((d) => !query || fold(`${d.title} ${d.context} ${d.lines.map((l) => `${l.es} ${l.fr}`).join(' ')}`).includes(query)),
  })).filter((g) => g.dialogues.length)
  if (!groups.length) return <NoResult />
  return (
    <>
      {groups.map(({ u, dialogues }) => (
        <section key={u.id} className="es-nb-group">
          <UnitTitle u={u} />
          <ul className="es-dlg-list">
            {dialogues.map((d) => (
              <li key={d.id} className={open === d.id ? 'open' : ''}>
                <button type="button" className="es-dlg-toggle" aria-expanded={open === d.id} onClick={() => setOpen(open === d.id ? null : d.id)}>
                  <span>
                    <b>{d.title}</b>
                    <small>{d.context}</small>
                  </span>
                  <ChevronDown size={18} className={open === d.id ? 'flip' : ''} />
                </button>
                {open === d.id && <DialogueView d={d} showTitle={false} />}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}
