import { Volume2, VolumeX, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Pos } from '../../course/types'
import { useT, type TKey } from '../../i18n'
import { useSettings } from '../../store/settings'
import { useUI } from '../../store/ui'
import { platform, speak, useVoiceStatus } from './speech'

/** Bouton « écouter » : lit l'espagnol avec la voix choisie dans les paramètres. */
export function SpeakButton({ text, alt, big, auto, slow }: { text: string; alt?: boolean; big?: boolean; auto?: boolean; slow?: boolean }) {
  const t = useT()
  const voice = useSettings((s) => s.esVoice)
  const autoSpeak = useSettings((s) => s.esAutoSpeak)
  const status = useVoiceStatus()
  useEffect(() => {
    if (auto && autoSpeak) speak(text, { voice, alt })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])
  if (status === 'unsupported') return null
  // pas de voix espagnole : le bouton reste à sa place, barré, et renvoie aux réglages de la voix
  if (status === 'missing')
    return (
      <button
        type="button"
        className={`es-speak off ${big ? 'big' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          useUI.getState().openSettings('espagnol')
        }}
        aria-label={t('es.voice.missingTitle')}
        title={t('es.voice.missingTitle')}
      >
        <VolumeX size={big ? 26 : 17} />
      </button>
    )
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

const HOW: Record<ReturnType<typeof platform>, TKey> = {
  mac: 'es.voice.how.mac',
  ios: 'es.voice.how.ios',
  windows: 'es.voice.how.windows',
  android: 'es.voice.how.android',
  other: 'es.voice.how.other',
}

const DISMISS = 'nuage:es:voiceNotice'

/** Avertissement quand l'appareil n'a aucune voix espagnole, avec la marche à suivre pour en installer une. */
export function VoiceNotice({ inSettings }: { inSettings?: boolean }) {
  const t = useT()
  const status = useVoiceStatus()
  const [hidden, setHidden] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS) === '1'
    } catch {
      return false
    }
  })
  if (status !== 'missing' || (hidden && !inSettings)) return null
  const dismiss = () => {
    setHidden(true)
    try {
      sessionStorage.setItem(DISMISS, '1')
    } catch {
      /* stockage indisponible : l'avertissement reviendra */
    }
  }
  return (
    <div className={`es-voice-notice ${inSettings ? 'in-settings' : ''}`} role="status">
      <VolumeX size={20} />
      <div className="es-voice-notice-text">
        <strong>{t('es.voice.missingTitle')}</strong>
        <p>{t('es.voice.missingDesc')}</p>
        <p>{t(HOW[platform()])}</p>
        <p>{t('es.voice.online')}</p>
      </div>
      {!inSettings && (
        <button type="button" className="icon-btn" onClick={dismiss} aria-label={t('es.voice.dismiss')} title={t('es.voice.dismiss')}>
          <X size={17} />
        </button>
      )}
    </div>
  )
}
