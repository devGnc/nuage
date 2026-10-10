import { useMemo, useState } from 'react'
import { QUOTES } from '../data/quotes'
import { useLang } from '../i18n'
import { useSettings } from '../store/settings'

export function QuoteLine() {
  const lang = useLang()
  const cat = useSettings((s) => s.quoteCategory)
  const custom = useSettings((s) => s.customQuotes)
  const pool = useMemo(() => {
    const all = QUOTES.map((q) => ({ id: q.id, cat: q.cat, text: q[lang], author: q.author?.[lang] }))
    const mine = custom.map((q) => ({ id: q.id, cat: 'mine', text: q.text, author: q.author || undefined }))
    if (cat === 'mine') return mine.length ? mine : all
    if (cat === 'all') return [...all, ...mine]
    return all.filter((q) => q.cat === cat)
  }, [cat, custom, lang])
  const [index, setIndex] = useState(() => Math.floor(Math.random() * 1000))
  if (pool.length === 0) return null
  const q = pool[index % pool.length]
  return (
    <button type="button" className="quote" onClick={() => setIndex((i) => i + 1 + Math.floor(Math.random() * (pool.length - 1)))}>
      <span className="quote-text">“{q.text}”</span>
      {q.author && <span className="quote-author">— {q.author}</span>}
    </button>
  )
}
