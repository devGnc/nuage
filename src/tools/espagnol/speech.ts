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

/** Lit un texte en espagnol. Les précisions entre parenthèses ou crochets ne sont pas lues. */
export function speak(text: string, voiceURI = '') {
  if (!speechSupported()) return
  const clean = text.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!clean) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(clean)
  const voices = spanishVoices()
  const voice = voices.find((v) => v.voiceURI === voiceURI) ?? voices[0]
  if (voice) u.voice = voice
  u.lang = voice?.lang ?? 'es-ES'
  u.rate = 0.92
  speechSynthesis.speak(u)
}
