import { useEffect, useState } from 'react'

/** Prononciation par une voix espagnole de l'appareil (gratuite ; hors ligne pour les voix installées).
 *  Jamais par une autre voix : une voix française qui lit de l'espagnol apprendrait un mauvais accent. */

export function speechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

const isSpanish = (v: SpeechSynthesisVoice) => /^es([-_]|$)/i.test(v.lang)

/** Les voix naturelles d'abord ; les voix « fantaisie » de macOS (Eddy, Flo, Grandma…) en dernier. */
function quality(v: SpeechSynthesisVoice): number {
  if (/\b(Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley)\b/i.test(v.name)) return -2
  if (/Natural|Premium|Enhanced|mejorada|Siri|M[óo]nica|Marisol|Jorge|Lucia|Elvira|Alvaro/i.test(v.name)) return 2
  if (/Google/i.test(v.name)) return 1
  return 0
}

/** Voix espagnoles disponibles : celles d'Espagne d'abord, puis les plus naturelles, puis celles installées sur l'appareil. */
export function spanishVoices(): SpeechSynthesisVoice[] {
  if (!speechSupported()) return []
  const spain = (v: SpeechSynthesisVoice) => /^es[-_]es$/i.test(v.lang)
  return speechSynthesis
    .getVoices()
    .filter(isSpanish)
    .sort((a, b) => Number(spain(b)) - Number(spain(a)) || quality(b) - quality(a) || Number(b.localService) - Number(a.localService))
}

export function onVoicesChanged(fn: () => void): () => void {
  if (!speechSupported()) return () => {}
  speechSynthesis.addEventListener('voiceschanged', fn)
  return () => speechSynthesis.removeEventListener('voiceschanged', fn)
}

/** La liste des voix arrive souvent après le chargement de la page (Chrome la charge au premier appel) :
 *  on l'attend une seconde et demie au plus. */
let waiting: Promise<void> | null = null
// une fois l'attente faite, un navigateur qui ne donne toujours pas la liste ne fait plus attendre
let settled = false
export function voicesReady(): Promise<void> {
  if (!speechSupported() || settled || speechSynthesis.getVoices().length) return Promise.resolve()
  waiting ??= new Promise<void>((resolve) => {
    const done = () => {
      speechSynthesis.removeEventListener('voiceschanged', done)
      clearTimeout(timer)
      settled = true
      waiting = null
      resolve()
    }
    const timer = setTimeout(done, 1500)
    speechSynthesis.addEventListener('voiceschanged', done)
  })
  return waiting
}

/** « ok » : une voix espagnole est là ; « missing » : l'appareil a des voix, mais aucune en espagnol ;
 *  « unknown » : le navigateur ne donne pas la liste (on tente quand même, en demandant l'espagnol). */
export type VoiceStatus = 'ok' | 'missing' | 'unknown' | 'unsupported'

export function voiceStatus(): VoiceStatus {
  if (!speechSupported()) return 'unsupported'
  const all = speechSynthesis.getVoices()
  if (!all.length) return 'unknown'
  return all.some(isSpanish) ? 'ok' : 'missing'
}

/** L'état de la voix espagnole, tenu à jour quand la liste des voix change. */
export function useVoiceStatus(): VoiceStatus {
  const [s, set] = useState(voiceStatus)
  useEffect(() => {
    let alive = true
    voicesReady().then(() => alive && set(voiceStatus()))
    const off = onVoicesChanged(() => set(voiceStatus()))
    return () => {
      alive = false
      off()
    }
  }, [])
  return s
}

export function pickVoice(voiceURI?: string, alt = false): { voice: SpeechSynthesisVoice | null; other: boolean } {
  const voices = spanishVoices()
  const main = voices.find((v) => v.voiceURI === voiceURI) ?? voices[0] ?? null
  if (!alt || !main) return { voice: main, other: false }
  const other = voices.find((v) => v !== main && v.lang.toLowerCase() === main.lang.toLowerCase()) ?? voices.find((v) => v !== main) ?? null
  return { voice: other ?? main, other: !!other }
}

let token = 0

/** Lit un texte en espagnol. Les précisions entre parenthèses ou crochets et les « … » ne sont pas lus.
 *  `voice` : la voix choisie dans les paramètres ; `alt` : prendre une autre voix (deuxième personnage d'un dialogue). */
export function speak(text: string, opts: { voice?: string; alt?: boolean; rate?: number; onEnd?: () => void; queue?: boolean } = {}) {
  if (!speechSupported()) {
    opts.onEnd?.()
    return
  }
  const clean = text.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ').replace(/…/g, ' ').replace(/\s\/\s/g, ', ').replace(/\s+/g, ' ').trim()
  if (!clean) {
    opts.onEnd?.()
    return
  }
  if (!opts.queue) speechSynthesis.cancel()
  const mine = ++token
  const say = () => {
    if (mine !== token) return
    const status = voiceStatus()
    // aucune voix espagnole : on se tait plutôt que de faire lire l'espagnol par une voix française
    if (status === 'missing') {
      opts.onEnd?.()
      return
    }
    const u = new SpeechSynthesisUtterance(clean)
    const { voice, other } = pickVoice(opts.voice, opts.alt)
    if (voice) u.voice = voice
    u.lang = voice?.lang.replace('_', '-') ?? 'es-ES'
    u.rate = opts.rate ?? 0.92
    // sans deuxième voix, on change un peu la hauteur pour distinguer les personnages
    if (opts.alt && !other) u.pitch = 1.25
    if (opts.onEnd) {
      u.onend = () => opts.onEnd?.()
      u.onerror = () => opts.onEnd?.()
    }
    speechSynthesis.speak(u)
  }
  if (speechSynthesis.getVoices().length) say()
  else void voicesReady().then(say)
}

export function stopSpeaking() {
  token++
  if (speechSupported()) speechSynthesis.cancel()
}

/** Le système de l'appareil, pour expliquer où installer une voix espagnole. */
export type Platform = 'ios' | 'mac' | 'windows' | 'android' | 'other'

export function platform(): Platform {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  if (/Mac OS X|Macintosh/.test(ua)) return 'mac'
  if (/Windows/.test(ua)) return 'windows'
  return 'other'
}
