import { Languages, Play, Square } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dialogue } from '../../course/types'
import { useT } from '../../i18n'
import { useSettings } from '../../store/settings'
import { speak, stopSpeaking, useVoiceStatus } from './speech'

/** Un dialogue en bulles : chaque réplique se lit d'un clic, « Tout écouter » enchaîne les voix. */
export function DialogueView({ d, compact, showTitle = true }: { d: Dialogue; compact?: boolean; showTitle?: boolean }) {
  const t = useT()
  const voice = useSettings((s) => s.esVoice)
  const [showFr, setShowFr] = useState(false)
  const [playing, setPlaying] = useState<number | null>(null)
  const [all, setAll] = useState(false)
  const run = useRef(0)
  const status = useVoiceStatus()
  const canSpeak = status !== 'missing' && status !== 'unsupported'

  // le premier personnage à gauche, le deuxième à droite, et ainsi de suite
  const speakers = useMemo(() => [...new Set(d.lines.map((l) => l.who))], [d])
  const side = (who: string) => speakers.indexOf(who) % 2

  useEffect(
    () => () => {
      run.current++
      stopSpeaking()
    },
    [],
  )

  const stop = () => {
    run.current++
    stopSpeaking()
    setPlaying(null)
    setAll(false)
  }

  const playFrom = (i: number, id: number) => {
    if (run.current !== id) return
    if (i >= d.lines.length) {
      setPlaying(null)
      setAll(false)
      return
    }
    setPlaying(i)
    speak(d.lines[i].es, { voice, alt: side(d.lines[i].who) === 1, onEnd: () => setTimeout(() => playFrom(i + 1, id), 280) })
  }

  const playAll = () => {
    if (all) return stop()
    const id = ++run.current
    setAll(true)
    playFrom(0, id)
  }

  const playOne = (i: number) => {
    const id = ++run.current
    setAll(false)
    setPlaying(i)
    speak(d.lines[i].es, { voice, alt: side(d.lines[i].who) === 1, onEnd: () => run.current === id && setPlaying(null) })
  }

  return (
    <div className={`es-dialogue ${compact ? 'compact' : ''}`}>
      {showTitle && (
        <header className="es-dialogue-head">
          <h2>{d.title}</h2>
          <p>{d.context}</p>
        </header>
      )}
      <div className="es-dialogue-tools">
        {canSpeak && (
          <button type="button" className={`btn small ${all ? 'primary' : ''}`} onClick={playAll}>
            {all ? <Square size={14} /> : <Play size={14} />}
            {all ? t('es.dlg.stop') : t('es.dlg.playAll')}
          </button>
        )}
        <button type="button" className={`btn small ghost ${showFr ? 'on' : ''}`} aria-pressed={showFr} onClick={() => setShowFr(!showFr)}>
          <Languages size={14} />
          {showFr ? t('es.dlg.hideFr') : t('es.dlg.showFr')}
        </button>
      </div>
      <ol className="es-lines">
        {d.lines.map((l, i) => (
          <li key={i} className={`es-line side-${side(l.who)} ${playing === i ? 'playing' : ''}`}>
            <span className="es-who">{l.who}</span>
            <button type="button" className="es-bubble" onClick={() => (canSpeak ? playOne(i) : setShowFr(!showFr))} lang="es">
              {l.es}
            </button>
            {showFr && (
              <span className="es-line-fr" lang="fr">
                {l.fr}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
