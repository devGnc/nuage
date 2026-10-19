import { Check, ChevronLeft, ChevronRight, Earth, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { normalize, stripAccents } from '../../course/check'
import { DIALOGUES, LESSONS, NOTES, UNITS } from '../../course/es'
import { WORD_SKILL, wordItemId } from '../../course/progress'
import type { Dialogue, Note, Unit, Word } from '../../course/types'
import { useT, type TKey } from '../../i18n'
import { useStudy } from '../../study/store'
import { Segmented } from '../../components/ui'
import { DialogueView } from './DialogueView'
import { go, openLesson, type NotebookTab } from './sections'
import { Markdown, PosLabel, SpeakButton } from './ui'

/** Le cahier : tout ce que le cours explique, à relire quand on veut — fiches de grammaire, lexique, dialogues.
 *  Sur grand écran, le sommaire à gauche et la page ouverte à droite ; sur téléphone, l'un puis l'autre. */

const TABS: { value: NotebookTab; label: TKey }[] = [
  { value: 'notes', label: 'es.nb.notes' },
  { value: 'words', label: 'es.nb.words' },
  { value: 'dialogues', label: 'es.nb.dialogues' },
]

const fold = (s: string) => stripAccents(normalize(s))
const ALL_NOTES: Note[] = UNITS.flatMap((u) => u.notes)

const matchNote = (n: Note, q: string) => !q || fold(`${n.title} ${n.summary} ${n.body}`).includes(q)
const matchWord = (w: Word, q: string) => !q || fold(`${w.es} ${w.fr} ${w.latam ?? ''}`).includes(q)
const matchDialogue = (d: Dialogue, q: string) => !q || fold(`${d.title} ${d.context} ${d.lines.map((l) => `${l.es} ${l.fr}`).join(' ')}`).includes(q)

export function Notebook({ tab, item }: { tab: NotebookTab; item?: string }) {
  const t = useT()
  const [q, setQ] = useState('')
  const query = fold(q)

  const notes = useMemo(() => UNITS.map((u) => ({ u, list: u.notes.filter((n) => matchNote(n, query)) })).filter((g) => g.list.length), [query])
  const dialogues = useMemo(() => UNITS.map((u) => ({ u, list: u.dialogues.filter((d) => matchDialogue(d, query)) })).filter((g) => g.list.length), [query])
  // sans page choisie, on ouvre la première de la liste (sur grand écran seulement)
  const openNote = tab === 'notes' ? (item ?? notes[0]?.list[0]?.id) : undefined
  const openDialogue = tab === 'dialogues' ? (item ?? dialogues[0]?.list[0]?.id) : undefined
  const showMain = !!item || tab === 'words'

  return (
    <div className={`es-notebook tab-${tab} ${showMain ? 'show-main' : ''} ${item ? '' : 'show-side'}`}>
      <aside className="es-nb-side">
        <h1 className="es-title">{t('es.notebook')}</h1>
        <label className="es-search">
          <Search size={16} />
          <input className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('es.nb.search')} aria-label={t('es.nb.search')} />
        </label>
        <Segmented value={tab} onChange={(v) => go({ section: 'notebook', tab: v }, true)} options={TABS.map((x) => ({ value: x.value, label: t(x.label) }))} />
        <nav className="es-toc" aria-label={t(TABS.find((x) => x.value === tab)!.label)}>
          {tab === 'notes' ? (
            notes.length ? (
              notes.map(({ u, list }) => (
                <TocGroup key={u.id} u={u}>
                  {list.map((n) => (
                    <TocItem key={n.id} active={n.id === openNote} onClick={() => go({ section: 'notebook', tab: 'notes', item: n.id })} title={n.title} sub={n.summary} />
                  ))}
                </TocGroup>
              ))
            ) : (
              <NoResult />
            )
          ) : tab === 'dialogues' ? (
            dialogues.length ? (
              dialogues.map(({ u, list }) => (
                <TocGroup key={u.id} u={u}>
                  {list.map((d) => (
                    <TocItem key={d.id} active={d.id === openDialogue} onClick={() => go({ section: 'notebook', tab: 'dialogues', item: d.id })} title={d.title} sub={d.context} />
                  ))}
                </TocGroup>
              ))
            ) : (
              <NoResult />
            )
          ) : (
            UNITS.map((u) => (
              <TocItem
                key={u.id}
                onClick={() => document.getElementById(`lex-${u.id}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' })}
                title={`${t('es.unitN', { n: u.number })} · ${u.title}`}
                sub={t('es.nb.wordCount', { n: u.words.filter((w) => matchWord(w, query)).length })}
              />
            ))
          )}
        </nav>
      </aside>
      <section className={`es-nb-main ${showMain ? '' : 'idle'}`}>
        {tab === 'notes' ? (
          openNote ? <NoteReader id={openNote} /> : <NoResult />
        ) : tab === 'dialogues' ? (
          openDialogue ? <DialogueReader id={openDialogue} /> : <NoResult />
        ) : (
          <Lexicon query={query} />
        )}
      </section>
    </div>
  )
}

function TocGroup({ u, children }: { u: Unit; children: React.ReactNode }) {
  const t = useT()
  return (
    <div className="es-toc-group">
      <h2>
        <span>{t('es.unitN', { n: u.number })}</span> {u.title}
      </h2>
      <ul>{children}</ul>
    </div>
  )
}

function TocItem({ title, sub, active, onClick }: { title: string; sub?: string; active?: boolean; onClick: () => void }) {
  return (
    <li className="es-toc-item">
      <button type="button" className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} onClick={onClick}>
        <b>{title}</b>
        {sub && <span>{sub}</span>}
      </button>
    </li>
  )
}

function NoResult() {
  const t = useT()
  return <p className="es-nb-none">{t('es.nb.none')}</p>
}

function BackToList({ tab }: { tab: NotebookTab }) {
  const t = useT()
  return (
    <button type="button" className="link-btn es-nb-back" onClick={() => go({ section: 'notebook', tab })}>
      <ChevronLeft size={16} />
      {t('es.notebook')}
    </button>
  )
}

function NoteReader({ id }: { id: string }) {
  const t = useT()
  const n = NOTES.get(id)
  const usedIn = useMemo(() => LESSONS.filter(({ lesson }) => lesson.steps.some((s) => s.type === 'note' && s.note === id)), [id])
  const i = ALL_NOTES.findIndex((x) => x.id === id)
  const prev = i > 0 ? ALL_NOTES[i - 1] : null
  const next = i >= 0 && i < ALL_NOTES.length - 1 ? ALL_NOTES[i + 1] : null
  return (
    <article className="es-reader" key={id}>
      <BackToList tab="notes" />
      {n ? (
        <>
          <h1 className="es-title">{n.title}</h1>
          <p className="es-reader-lead">{n.summary}</p>
          <Markdown text={n.body} />
          {usedIn.length > 0 && (
            <div className="es-reader-used">
              <span>{t('es.nb.usedIn')}</span>
              {usedIn.map(({ lesson, unit }) => (
                <button key={lesson.id} type="button" className="chip" onClick={() => openLesson(lesson.id)}>
                  {t('es.unitN', { n: unit.number })} · {lesson.title}
                </button>
              ))}
            </div>
          )}
          <nav className="es-reader-nav" aria-label={t('es.nb.notes')}>
            {prev ? (
              <button type="button" className="es-reader-step" onClick={() => go({ section: 'notebook', tab: 'notes', item: prev.id })}>
                <small>
                  <ChevronLeft size={14} />
                  {t('es.nb.prev')}
                </small>
                <b>{prev.title}</b>
              </button>
            ) : (
              <span />
            )}
            {next && (
              <button type="button" className="es-reader-step next" onClick={() => go({ section: 'notebook', tab: 'notes', item: next.id })}>
                <small>
                  {t('es.nb.next')}
                  <ChevronRight size={14} />
                </small>
                <b>{next.title}</b>
              </button>
            )}
          </nav>
        </>
      ) : (
        <p className="es-nb-none">{t('es.nb.missing')}</p>
      )}
    </article>
  )
}

function DialogueReader({ id }: { id: string }) {
  const t = useT()
  const d = DIALOGUES.get(id)
  return (
    <article className="es-reader" key={id}>
      <BackToList tab="dialogues" />
      {d ? <DialogueView d={d} /> : <p className="es-nb-none">{t('es.nb.missing')}</p>}
    </article>
  )
}

function Lexicon({ query }: { query: string }) {
  const t = useT()
  const progress = useStudy((s) => s.progress)
  const groups = UNITS.map((u) => ({ u, words: u.words.filter((w) => matchWord(w, query)) })).filter((g) => g.words.length)
  if (!groups.length) return <NoResult />
  return (
    <div className="es-lexicon-page">
      <p className="es-nb-hint">{t('es.nb.wordsHint')}</p>
      {groups.map(({ u, words }) => (
        <section key={u.id} id={`lex-${u.id}`} className="es-nb-group">
          <h2 className="es-nb-unit">
            <span>{t('es.unitN', { n: u.number })}</span> {u.title}
          </h2>
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
    </div>
  )
}
