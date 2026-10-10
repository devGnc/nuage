let ctx: AudioContext | null = null
let soundsBus: GainNode
let alertsBus: GainNode
let reverbIn: GainNode

function makeImpulse(c: AudioContext, seconds: number): AudioBuffer {
  const sr = c.sampleRate
  const n = Math.floor(seconds * sr)
  const buf = c.createBuffer(2, n, sr)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    let lp = 0
    for (let i = 0; i < n; i++) {
      const t = i / n
      const w = Math.random() * 2 - 1
      lp = lp * 0.6 + w * 0.4 // adoucit les aigus de la queue
      d[i] = lp * Math.pow(1 - t, 3.2) * (i < sr * 0.01 ? i / (sr * 0.01) : 1)
    }
  }
  return buf
}

export function audio() {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new Ctor({ latencyHint: 'playback' })
    soundsBus = ctx.createGain()
    // limiteur doux : plusieurs ambiances superposées ne saturent jamais
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -10
    limiter.knee.value = 8
    limiter.ratio.value = 10
    limiter.attack.value = 0.004
    limiter.release.value = 0.25
    soundsBus.connect(limiter)
    limiter.connect(ctx.destination)
    alertsBus = ctx.createGain()
    alertsBus.connect(ctx.destination)
    const conv = ctx.createConvolver()
    conv.buffer = makeImpulse(ctx, 2.6)
    reverbIn = ctx.createGain()
    const wet = ctx.createGain()
    wet.gain.value = 0.55
    reverbIn.connect(conv)
    conv.connect(wet)
    wet.connect(soundsBus)
  }
  return { ctx, soundsBus, alertsBus, reverbIn }
}

export async function resumeAudio() {
  const { ctx } = audio()
  if (ctx.state !== 'running') {
    try {
      await ctx.resume()
    } catch {
      /* le navigateur attend un geste utilisateur */
    }
  }
}

/** Les navigateurs exigent un geste avant de produire du son : on débloque au premier clic ou touche. */
export function installAudioUnlock() {
  const unlock = () => {
    if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {})
  }
  window.addEventListener('pointerdown', unlock, { passive: true })
  window.addEventListener('keydown', unlock)
}
