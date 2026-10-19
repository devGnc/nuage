import { Download, FileUp } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useT } from '../../i18n'
import { downloadText } from '../../lib/browser'
import { AnkiFormatError, ankiToItems, guessMapping, readApkg, type AnkiDeck, type AnkiMapping } from '../../study/import/anki'
import { CSV_TEMPLATE, csvToItems, parseCsv } from '../../study/import/csv'
import { markdownToCards, markdownToNotes } from '../../study/import/markdown'
import { cleanField } from '../../study/import/text'
import { addItems } from '../../study/store'
import type { StudyItem } from '../../study/types'
import { Segmented } from '../../components/ui'
import { goSection } from './sections'
import { requestStudySync } from './sync-hook'

type Parsed =
  | { kind: 'anki'; name: string; deck: AnkiDeck; mapping: AnkiMapping }
  | { kind: 'csv'; name: string; items: StudyItem[] }
  | { kind: 'markdown'; name: string; text: string; mode: 'cards' | 'notes' }

/** Importer : un paquet Anki, un tableur CSV ou un fichier Markdown. Tout est lu sur l'appareil. */
export function Import() {
  const t = useT()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const [result, setResult] = useState<{ added: number; existing: number; notes: boolean } | null>(null)

  const onFile = async (f: File | undefined) => {
    if (!f) return
    setError('')
    setResult(null)
    setParsed(null)
    setBusy(true)
    try {
      const ext = f.name.toLowerCase().split('.').pop() ?? ''
      if (ext === 'apkg' || ext === 'colpkg') {
        const deck = await readApkg(f)
        setParsed({ kind: 'anki', name: deck.name || f.name, deck, mapping: guessMapping(deck) })
      } else if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
        const items = csvToItems(parseCsv(await f.text()), f.name)
        if (!items.length) throw new Error('empty')
        setParsed({ kind: 'csv', name: f.name, items })
      } else if (ext === 'md' || ext === 'markdown') {
        const text = await f.text()
        const cards = markdownToCards(text, f.name)
        setParsed({ kind: 'markdown', name: f.name, text, mode: cards.length >= 5 ? 'cards' : 'notes' })
      } else throw new Error('type')
    } catch (e) {
      if (e instanceof AnkiFormatError) setError(e.message === 'compressed' ? t('es.imp.errCompressed') : e.message === 'empty' ? t('es.imp.errEmpty') : t('es.imp.errApkg'))
      else if (e instanceof Error && e.message === 'type') setError(t('es.imp.errType'))
      else if (e instanceof Error && e.message === 'empty') setError(t('es.imp.errEmpty'))
      else setError(t('es.imp.errRead'))
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const items: StudyItem[] = useMemo(() => {
    if (!parsed) return []
    if (parsed.kind === 'anki') return ankiToItems(parsed.deck, parsed.mapping)
    if (parsed.kind === 'csv') return parsed.items
    return parsed.mode === 'cards' ? markdownToCards(parsed.text, parsed.name) : markdownToNotes(parsed.text, parsed.name)
  }, [parsed])

  const isNotes = parsed?.kind === 'markdown' && parsed.mode === 'notes'

  return (
    <div className="es-import">
      <h2 className="es-title">{t('es.import')}</h2>
      <p className="es-lead">{t('es.imp.lead')}</p>

      <div
        className="dropzone"
        role="button"
        tabIndex={0}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          onFile(e.dataTransfer.files[0])
        }}
      >
        <FileUp size={22} />
        <span>{busy ? t('es.imp.reading') : t('es.imp.drop')}</span>
        <input ref={fileRef} type="file" accept=".apkg,.colpkg,.csv,.tsv,.txt,.md,.markdown" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      <ul className="es-formats">
        <li><strong>Anki</strong> — {t('es.imp.anki')}</li>
        <li>
          <strong>CSV</strong> — {t('es.imp.csv')}{' '}
          <button type="button" className="link-btn" onClick={() => downloadText('modele-vocabulaire.csv', CSV_TEMPLATE, 'text/csv')}>
            <Download size={13} /> {t('es.imp.template')}
          </button>
        </li>
        <li><strong>Markdown</strong> — {t('es.imp.md')}</li>
      </ul>

      {error && <p className="error">{error}</p>}

      {parsed && (
        <section className="es-preview">
          <h3>{parsed.name}</h3>

          {parsed.kind === 'anki' && (
            <div className="es-mapping">
              {(['front', 'back', 'example', 'rank'] as const).map((k) => (
                <label key={k} className="field">
                  <span>{t(`es.imp.map.${k}`)}</span>
                  <select
                    className="select"
                    value={parsed.mapping[k] ?? -1}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      setParsed({ ...parsed, mapping: { ...parsed.mapping, [k]: v < 0 ? null : v } })
                    }}
                  >
                    {(k === 'example' || k === 'rank') && <option value={-1}>{t('es.imp.none')}</option>}
                    {parsed.deck.fieldNames.map((f, i) => (
                      <option key={i} value={i}>
                        {f} — {cleanField(parsed.deck.notes[0]?.fields[i] ?? '').slice(0, 24) || '…'}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}

          {parsed.kind === 'markdown' && (
            <Segmented
              value={parsed.mode}
              onChange={(mode) => setParsed({ ...parsed, mode })}
              options={[
                { value: 'cards', label: t('es.imp.modeCards') },
                { value: 'notes', label: t('es.imp.modeNotes') },
              ]}
            />
          )}

          <p className="hint">{isNotes ? t('es.imp.countNotes', { n: items.length }) : t('es.imp.countCards', { n: items.length })}</p>
          {items.length > 0 && (
            <table className="es-sample">
              <tbody>
                {items.slice(0, 6).map((it) => (
                  <tr key={it.id}>
                    <td lang="es">{it.front}</td>
                    <td>{isNotes ? `${it.back.length.toLocaleString()} ${t('es.imp.chars')}` : it.back}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="btn-row">
            <button
              type="button"
              className="btn primary"
              disabled={!items.length}
              onClick={() => {
                const r = addItems(items)
                setResult({ ...r, notes: isNotes })
                setParsed(null)
                requestStudySync()
              }}
            >
              {isNotes ? t('es.imp.goNotes', { n: items.length }) : t('es.imp.goCards', { n: items.length })}
            </button>
            <button type="button" className="btn" onClick={() => setParsed(null)}>
              {t('common.cancel')}
            </button>
          </div>
        </section>
      )}

      {result && (
        <div className="es-result" role="status">
          <p>{t('es.imp.done', { added: result.added, existing: result.existing })}</p>
          <button type="button" className="btn primary" onClick={() => goSection(result.notes ? 'notes' : 'today')}>
            {result.notes ? t('es.imp.openNotes') : t('es.imp.startReview')}
          </button>
        </div>
      )}
    </div>
  )
}
