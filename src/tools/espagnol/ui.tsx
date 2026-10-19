import { Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Pos } from '../../course/types'
import { useT, type TKey } from '../../i18n'
import { useSettings } from '../../store/settings'
import { speak, speechSupported } from './speech'

/** Bouton « écouter » : lit l'espagnol avec la voix choisie dans les paramètres. */
export function SpeakButton({ text, alt, big, auto, slow }: { text: string; alt?: boolean; big?: boolean; auto?: boolean; slow?: boolean }) {
  const t = useT()
  const voice = useSettings((s) => s.esVoice)
  const autoSpeak = useSettings((s) => s.esAutoSpeak)
  useEffect(() => {
    if (auto && autoSpeak) speak(text, { voice, alt })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])
  if (!speechSupported()) return null
  return (
    <button
      type="button"
      className={`es-speak ${big ? 'big' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        speak(text, { voice, alt, rate: slow ? 0.7 : undefined })
      }}
      aria-label={slow ? t('es.listenSlow') : t('es.listen')}
      title={slow ? t('es.listenSlow') : t('es.listen')}
    >
      <Volume2 size={big ? 26 : 17} />
      {slow && <span className="es-speak-slow">0,7×</span>}
    </button>
  )
}

const LETTERS = ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', '¿', '¡']

/** Touches pour les lettres espagnoles, insérées à l'endroit du curseur dans le champ actif. */
export function AccentBar({ onInsert }: { onInsert: (ch: string) => void }) {
  const t = useT()
  return (
    <div className="es-accents" role="group" aria-label={t('es.accents')}>
      {LETTERS.map((c) => (
        <button key={c} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onInsert(c)}>
          {c}
        </button>
      ))}
    </div>
  )
}

/** Insère un caractère dans un champ contrôlé, à la position du curseur. */
export function insertInto(el: HTMLInputElement | HTMLTextAreaElement | null, value: string, ch: string, set: (v: string) => void) {
  const start = el?.selectionStart ?? value.length
  const end = el?.selectionEnd ?? value.length
  const next = value.slice(0, start) + ch + value.slice(end)
  set(next)
  requestAnimationFrame(() => {
    el?.focus()
    el?.setSelectionRange(start + ch.length, start + ch.length)
  })
}

/** Rendu Markdown des fiches : le HTML brut est affiché comme du texte, seuls les liens web sont gardés. */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

let markedReady: Promise<(md: string) => string> | null = null
function loadMarked() {
  markedReady ??= import('marked').then(({ Marked }) => {
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
    return (md: string) => m.parse(md) as string
  })
  return markedReady
}

export function Markdown({ text, className = 'es-prose' }: { text: string; className?: string }) {
  const [html, setHtml] = useState('')
  useEffect(() => {
    let alive = true
    loadMarked().then((render) => alive && setHtml(render(text)))
    return () => {
      alive = false
    }
  }, [text])
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

const POS_LABEL: Record<Pos, TKey> = {
  nm: 'es.pos.nm', nf: 'es.pos.nf', nmf: 'es.pos.nmf', npl: 'es.pos.npl', adj: 'es.pos.adj', v: 'es.pos.verb', adv: 'es.pos.adv',
  expr: 'es.pos.expr', num: 'es.pos.num', pron: 'es.pos.pron', prep: 'es.pos.prep', conj: 'es.pos.conj', det: 'es.pos.det',
}

/** Catégorie grammaticale lisible. */
export function PosLabel({ pos }: { pos?: Pos }) {
  const t = useT()
  if (!pos) return null
  return <span className={`es-pos p-${pos}`}>{t(POS_LABEL[pos])}</span>
}
