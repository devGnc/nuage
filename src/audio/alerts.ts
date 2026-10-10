import { audio, resumeAudio } from './engine'

export const ALERTS: { id: string; name: { fr: string; en: string } }[] = [
  { id: 'sparkle', name: { fr: 'Étincelles', en: 'Sparkle' } },
  { id: 'carillon', name: { fr: 'Carillon', en: 'Chimes' } },
  { id: 'bell', name: { fr: 'Cloche', en: 'Bell' } },
  { id: 'marimba', name: { fr: 'Marimba', en: 'Marimba' } },
  { id: 'gong', name: { fr: 'Gong', en: 'Gong' } },
  { id: 'soft', name: { fr: 'Douceur', en: 'Soft pad' } },
  { id: 'digital', name: { fr: 'Bip digital', en: 'Digital beep' } },
  { id: 'bird', name: { fr: 'Oiseau', en: 'Bird' } },
  { id: 'none', name: { fr: 'Aucun', en: 'None' } },
]

function bell(ctx: AudioContext, out: AudioNode, t: number, f: number, dur: number, vol: number, partials = [[1, 1, 1], [2.0, 0.5, 0.6], [2.76, 0.35, 0.45], [5.4, 0.15, 0.25]]) {
  for (const [m, a, d] of partials) {
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = f * m
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vol * a, t + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur * d)
    o.connect(g).connect(out)
    o.start(t)
    o.stop(t + dur * d + 0.05)
  }
}

function tone(ctx: AudioContext, out: AudioNode, t: number, f: number, dur: number, vol: number, type: OscillatorType = 'sine', f2?: number) {
  const o = ctx.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(f, t)
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + Math.min(0.02, dur / 4))
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  const lp = ctx.createBiquadFilter()
  lp.frequency.value = 3500
  o.connect(lp).connect(g).connect(out)
  o.start(t)
  o.stop(t + dur + 0.05)
}

export async function playAlert(id: string, volume: number) {
  if (id === 'none' || volume <= 0) return
  await resumeAudio()
  const { ctx, alertsBus } = audio()
  const out = ctx.createGain()
  out.gain.value = volume * volume * 0.9
  out.connect(alertsBus)
  const t = ctx.currentTime + 0.03
  switch (id) {
    case 'sparkle':
      [1047, 1319, 1568, 2093, 2637].forEach((f, i) => bell(ctx, out, t + i * 0.09, f, 1.4, 0.18))
      break
    case 'carillon':
      [659, 523, 784].forEach((f, i) => bell(ctx, out, t + i * 0.42, f, 2.2, 0.3))
      break
    case 'bell':
      bell(ctx, out, t, 880, 3, 0.35)
      break
    case 'marimba':
      [523, 659, 784, 1047].forEach((f, i) => bell(ctx, out, t + i * 0.13, f, 0.9, 0.32, [[1, 1, 1], [4, 0.25, 0.25], [10, 0.08, 0.08]]))
      break
    case 'gong':
      bell(ctx, out, t, 98, 6, 0.5, [[1, 1, 1], [1.48, 0.6, 0.8], [2.1, 0.4, 0.6], [2.9, 0.25, 0.4], [4.2, 0.12, 0.3]])
      break
    case 'soft':
      [392, 494, 587].forEach((f) => {
        const o = ctx.createOscillator()
        o.frequency.value = f
        const g = ctx.createGain()
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(0.12, t + 0.5)
        g.gain.linearRampToValueAtTime(0, t + 1.8)
        o.connect(g).connect(out)
        o.start(t)
        o.stop(t + 1.9)
      })
      break
    case 'digital':
      for (let i = 0; i < 3; i++) tone(ctx, out, t + i * 0.22, 1000, 0.12, 0.18, 'square')
      break
    case 'bird':
      tone(ctx, out, t, 2400, 0.16, 0.25, 'sine', 3600)
      tone(ctx, out, t + 0.22, 2600, 0.18, 0.25, 'sine', 4000)
      break
  }
  setTimeout(() => out.disconnect(), 7000)
}
