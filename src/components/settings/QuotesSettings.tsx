import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useT } from '../../i18n'
import { uid } from '../../lib/id'
import { useSettings } from '../../store/settings'
import type { QuoteCategory } from '../../types'
import { Row, Section, Select, ToggleRow } from '../ui'

export function QuotesSettings() {
  const t = useT()
  const s = useSettings()
  const [text, setText] = useState('')
  const [author, setAuthor] = useState('')
  const cats: QuoteCategory[] = ['all', 'motivation', 'discipline', 'wisdom', 'calm', 'mine']
  return (
    <div className="settings-page">
      <Section>
        <Row label={t('quotes.category')}>
          <Select<QuoteCategory> value={s.quoteCategory} onChange={(v) => s.set({ quoteCategory: v })} options={cats.map((c) => ({ value: c, label: t(`quotes.c.${c}`) }))} />
        </Row>
        <ToggleRow label={t('quotes.focus')} checked={s.quotesFocus} onChange={(v) => s.set({ quotesFocus: v })} />
        <ToggleRow label={t('quotes.home')} checked={s.quotesHome} onChange={(v) => s.set({ quotesHome: v })} />
        <p className="hint subtle">{t('quotes.tip')}</p>
      </Section>
      <Section title={t('quotes.mine')}>
        <form
          className="quote-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (!text.trim()) return
            s.set({ customQuotes: [...s.customQuotes, { id: uid(), text: text.trim(), author: author.trim() }] })
            setText('')
            setAuthor('')
          }}
        >
          <textarea className="input" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('quotes.text')} maxLength={240} />
          <div className="url-row">
            <input className="input" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder={t('quotes.author')} maxLength={60} />
            <button type="submit" className="btn primary" disabled={!text.trim()}>
              {t('common.add')}
            </button>
          </div>
        </form>
        {s.customQuotes.length === 0 ? (
          <p className="hint subtle">{t('quotes.empty')}</p>
        ) : (
          <ul className="quote-list">
            {s.customQuotes.map((q) => (
              <li key={q.id}>
                <span>
                  “{q.text}”{q.author && <em> — {q.author}</em>}
                </span>
                <button type="button" className="icon-btn" aria-label={t('common.delete')} onClick={() => s.set({ customQuotes: s.customQuotes.filter((x) => x.id !== q.id) })}>
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}
