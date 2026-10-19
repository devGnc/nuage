import { Plus, Search } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { useLang, useT, type TKey } from '../../i18n'
import { uid } from '../../lib/id'
import { formatInterval, isMature } from '../../study/srs'
import { deleteItem, saveItem, setSuspended, useStudy } from '../../study/store'
import { REVIEWABLE_KINDS, type StudyItem, type StudyProgress } from '../../study/types'
import { normKey } from '../../study/import/text'
import { Toggle } from '../../components/ui'
import { PosBadge } from './Badges'
import { SKILL } from './Session'

type Filter = 'all' | 'new' | 'learning' | 'mature' | 'suspended'
const FILTERS: { id: Filter; key: TKey }[] = [
  { id: 'all', key: 'es.f.all' },
  { id: 'new', key: 'es.f.new' },
  { id: 'learning', key: 'es.f.learning' },
  { id: 'mature', key: 'es.f.mature' },
  { id: 'suspended', key: 'es.f.suspended' },
]

function stateOf(p: StudyProgress | undefined): Exclude<Filter, 'all'> {
  if (p?.suspended) return 'suspended'
  if (!p || p.srs.state === 0) return 'new'
  return isMature(p.srs) ? 'mature' : 'learning'
}

const PAGE = 100

export function Cards() {
  const t = useT()
  const lang = useLang()
  const items = useStudy((s) => s.items)
  const progress = useStudy((s) => s.progress)
  const [query, setQuery] = useState('')
  const q = useDeferredValue(query)
  const [filter, setFilter] = useState<Filter>('all')
  const [deck, setDeck] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const [editing, setEditing] = useState<StudyItem | null>(null)

  const all = useMemo(
    () => Object.values(items).filter((it) => it.subject === 'es' && !it.deletedAt && REVIEWABLE_KINDS.includes(it.kind)),
    [items],
  )
  const decks = useMemo(() => [...new Set(all.map((it) => String(it.extra.deck ?? '')).filter(Boolean))].sort(), [all])

  const list = useMemo(() => {
    const nq = normKey(q)
    return all
      .filter((it) => (!deck || it.extra.deck === deck) && (filter === 'all' || stateOf(progress[it.id]?.[SKILL]) === filter))
      .filter((it) => !nq || normKey(`${it.front} ${it.back} ${it.example ?? ''} ${it.topic ?? ''}`).includes(nq))
      .sort((a, b) => (a.extra.rank ?? Infinity) - (b.extra.rank ?? Infinity) || a.createdAt - b.createdAt)
  }, [all, progress, q, filter, deck])

  const nf = (n: number) => n.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')
  const now = Date.now()

  return (
    <div className="es-cards">
      <div className="es-cards-head">
        <h2 className="es-title">{t('es.cards')}</h2>
        <button
          type="button"
          className="btn small"
          onClick={() => setEditing({ id: `perso:${uid()}`, subject: 'es', kind: 'vocab', front: '', back: '', example: null, topic: null, source: 'perso', extra: {}, createdAt: Date.now(), updatedAt: Date.now(), deletedAt: null })}
        >
          <Plus size={15} /> {t('es.addCard')}
        </button>
      </div>
      <label className="es-search">
        <Search size={16} />
        <input className="input" type="search" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE) }} placeholder={t('es.search')} aria-label={t('es.search')} />
      </label>
      <div className="chips">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className={`chip ${filter === f.id ? 'active' : ''}`} onClick={() => { setFilter(f.id); setLimit(PAGE) }}>
            {t(f.key)}
          </button>
        ))}
        {decks.length > 1 && (
          <select className="select es-deck" value={deck} onChange={(e) => { setDeck(e.target.value); setLimit(PAGE) }} aria-label={t('es.deckFilter')}>
            <option value="">{t('es.allDecks')}</option>
            {decks.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}
      </div>
      <p className="hint subtle">{t('es.cardCount', { n: nf(list.length) })}</p>

      {editing && <Editor item={editing} onClose={() => setEditing(null)} />}

      <ul className="es-list">
        {list.slice(0, limit).map((it) => {
          const p = progress[it.id]?.[SKILL]
          const st = stateOf(p)
          return (
            <li key={it.id}>
              <button type="button" className="es-row" onClick={() => setEditing(it)}>
                <span className="es-row-main">
                  <span className="es-row-front" lang="es">{it.front}</span>
                  <PosBadge item={it} />
                </span>
                <span className="es-row-back">{it.back}</span>
                <span className={`es-row-state s-${st}`}>
                  {st === 'new' ? t('es.state.new') : st === 'suspended' ? t('es.state.suspended') : p?.due && p.due > now ? formatInterval(p.due - now, lang) : t('es.state.due')}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {list.length > limit && (
        <button type="button" className="btn es-more" onClick={() => setLimit(limit + PAGE * 3)}>
          {t('es.showMore', { n: nf(Math.min(PAGE * 3, list.length - limit)) })}
        </button>
      )}
    </div>
  )
}

/** Modifier ou créer une carte. */
function Editor({ item, onClose }: { item: StudyItem; onClose: () => void }) {
  const t = useT()
  const isNew = !useStudy.getState().items[item.id]
  const suspended = useStudy((s) => !!s.progress[item.id]?.[SKILL]?.suspended)
  const [front, setFront] = useState(item.front)
  const [back, setBack] = useState(item.back)
  const [example, setExample] = useState(item.example ?? '')
  const [topic, setTopic] = useState(item.topic ?? '')
  const valid = front.trim() !== '' && back.trim() !== ''
  return (
    <form
      className="es-editor"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        saveItem({ ...item, front: front.trim(), back: back.trim(), example: example.trim() || null, topic: topic.trim() || null })
        onClose()
      }}
    >
      <h3>{isNew ? t('es.newCard') : t('es.editCard')}</h3>
      <label className="field">
        <span>{t('es.fieldFront')}</span>
        <input className="input" lang="es" value={front} onChange={(e) => setFront(e.target.value)} autoFocus />
      </label>
      <label className="field">
        <span>{t('es.fieldBack')}</span>
        <input className="input" value={back} onChange={(e) => setBack(e.target.value)} />
      </label>
      <label className="field">
        <span>{t('es.fieldExample')}</span>
        <input className="input" lang="es" value={example} onChange={(e) => setExample(e.target.value)} />
      </label>
      <label className="field">
        <span>{t('es.fieldTopic')}</span>
        <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} />
      </label>
      {!isNew && (
        <div className="es-editor-toggle">
          <span>{t('es.suspend')}</span>
          <Toggle checked={suspended} onChange={(v) => setSuspended(item.id, SKILL, v)} label={t('es.suspend')} />
        </div>
      )}
      <div className="btn-row">
        <button type="submit" className="btn primary" disabled={!valid}>{t('common.save')}</button>
        <button type="button" className="btn" onClick={onClose}>{t('common.cancel')}</button>
        {!isNew && (
          <button
            type="button"
            className="btn danger es-editor-delete"
            onClick={() => {
              if (!window.confirm(t('es.deleteConfirm', { word: item.front }))) return
              deleteItem(item.id)
              onClose()
            }}
          >
            {t('common.delete')}
          </button>
        )}
      </div>
    </form>
  )
}
