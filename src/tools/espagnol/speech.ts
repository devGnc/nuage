/** Prononciation par la voix espagnole du système (gratuite, hors ligne sur iPhone et Mac). */

export function speechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** Voix espagnoles disponibles, celles d'Espagne d'abord. La liste arrive parfois après le chargement. */
export function spanishVoices(): SpeechSynthesisVoice[] {
  if (!speechSupported()) return []
  return speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith('es'))
    .sort((a, b) => Number(b.lang.toLowerCase() === 'es-es') - Number(a.lang.toLowerCase() === 'es-es') || Number(b.localService) - Number(a.localService))
}

export function onVoicesChanged(fn: () => void): () => void {
  if (!speechSupported()) return () => {}
  speechSynthesis.addEventListener('voiceschanged', fn)
  return () => speechSynthesis.removeEventListener('voiceschanged', fn)
}

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
  const u = new SpeechSynthesisUtterance(clean)
  const voices = spanishVoices()
  const main = voices.find((v) => v.voiceURI === opts.voice) ?? voices[0]
  const other = voices.find((v) => v !== main && v.lang.toLowerCase() === main?.lang.toLowerCase()) ?? voices.find((v) => v !== main)
  const voice = opts.alt ? (other ?? main) : main
  if (voice) u.voice = voice
  u.lang = voice?.lang ?? 'es-ES'
  u.rate = opts.rate ?? 0.92
  // sans deuxième voix, on change un peu la hauteur pour distinguer les personnages
  if (opts.alt && !other) u.pitch = 1.25
  if (opts.onEnd) {
    u.onend = () => opts.onEnd?.()
    u.onerror = () => opts.onEnd?.()
  }
  speechSynthesis.speak(u)
}

export function stopSpeaking() {
  if (speechSupported()) speechSynthesis.cancel()
}
