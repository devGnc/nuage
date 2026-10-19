import { ArrowLeft, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useT } from '../../i18n'
import { deleteItem, useStudy } from '../../study/store'
import type { StudyItem } from '../../study/types'
import { goSection } from './sections'

/** Les fiches : des documents à lire (notes de cours importées en Markdown). Elles ne sont pas planifiées. */
export function Notes() {
  const t = useT()
  const items = useStudy((s) => s.items)
  const [open, setOpen] = useState<string | null>(null)
  const notes = useMemo(
    () => Object.values(items).filter((it) => it.subject === 'es' && it.kind === 'note' && !it.deletedAt).sort((a, b) => a.createdAt - b.createdAt),
    [items],
  )
  const groups = useMemo(() => {
    const m = new Map<string, StudyItem[]>()
    for (const n of notes) {
      const k = n.topic ?? ''
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(n)
    }
    return [...m.entries()]
  }, [notes])

  const current = open ? items[open] : undefined
  if (current && !current.deletedAt) return <Reader note={current} onBack={() => setOpen(null)} />

  if (!notes.length) {
    return (
      <div className="es-empty">
        <h2>{t('es.notesEmptyTitle')}</h2>
        <p>{t('es.notesEmptyDesc')}</p>
        <button type="button" className="btn primary" onClick={() => goSection('import')}>
          {t('es.importCta')}
        </button>
      </div>
    )
  }

  return (
    <div className="es-notes">
      <h2 className="es-title">{t('es.notes')}</h2>
      {groups.map(([topic, list]) => (
        <section key={topic} className="es-note-group">
          {topic && <h3>{topic}</h3>}
          <ul>
            {list.map((n) => (
              <li key={n.id}>
                <button type="button" className="es-note-link" onClick={() => setOpen(n.id)}>
                  {n.front}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Markdown → HTML. Le HTML brut du fichier est affiché comme du texte, jamais exécuté ; seuls les liens web
 *  sont gardés, et aucune image distante n'est chargée. */
async function renderMarkdown(md: string): Promise<string> {
  const { Marked } = await import('marked')
  const m = new Marked({ gfm: true, async: false })
  m.use({
    renderer: {
      html({ text }) {
        return esc(text)
      },
      link({ href, tokens }) {
        const label = this.parser.parseInline(tokens)
        return /^(https?:|mailto:)/i.test(href) ? `<a href="${esc(href)}" target="_blank" rel="noreferrer">${label}</a>` : label
      },
      image({ text }) {
        return esc(text)
      },
    },
  })
  return m.parse(md) as string
}

function Reader({ note, onBack }: { note: StudyItem; onBack: () => void }) {
  const t = useT()
  const [html, setHtml] = useState('')
  useEffect(() => {
    let alive = true
    renderMarkdown(note.back).then((out) => alive && setHtml(out))
    return () => {
      alive = false
    }
  }, [note.back])
  return (
    <article className="es-reader">
      <div className="es-reader-bar">
        <button type="button" className="btn small" onClick={onBack}>
          <ArrowLeft size={15} /> {t('es.notes')}
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label={t('common.delete')}
          title={t('common.delete')}
          onClick={() => {
            if (!window.confirm(t('es.deleteNoteConfirm', { title: note.front }))) return
            deleteItem(note.id)
            onBack()
          }}
        >
          <Trash2 size={17} />
        </button>
      </div>
      <h2>{note.front}</h2>
      <div className="es-prose" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  )
}
