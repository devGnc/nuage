import {
  BQ, Drift, addBrown, addPink, addWhite, burst, chirp, highpass, lowpass, makeBuffer, panGains, ping, rand, rnd, white1,
} from './synth'

type Ctx = BaseAudioContext

export const noise = (ctx: Ctx, kind: 'white' | 'pink' | 'brown') =>
  makeBuffer(ctx, `noise-${kind}`, 8, (L, R) => {
    const f = kind === 'white' ? addWhite : kind === 'pink' ? addPink : addBrown
    f(L, kind === 'white' ? 0.5 : 1)
    f(R, kind === 'white' ? 0.5 : 1)
  })

/** Gouttes de pluie : micro-impulsions de bruit + quelques « plic » plus proches. */
export const drops = (ctx: Ctx, variant: 'normal' | 'light' | 'heavy' | 'tent') =>
  makeBuffer(ctx, `drops-${variant}`, 12, (L, R, sr) => {
    const density = { normal: 380, light: 90, heavy: 900, tent: 160 }[variant]
    const count = Math.floor((density * L.length) / sr)
    for (let c = 0; c < count; c++) {
      const at = Math.floor(rand() * L.length)
      const amp = 0.04 + 0.96 * Math.pow(rand(), variant === 'tent' ? 1.6 : 3)
      const pan = white1() * 0.9
      if (variant === 'tent') {
        // Gouttes sur toile : impact plus sourd et plus long
        burst(L, R, at, Math.floor(rnd(0.006, 0.02) * sr), amp, pan, 0.2)
        ping(L, R, sr, at, { f: rnd(180, 420), dur: 0.05, amp: amp * 0.5, pan, decay: 0.012 })
      } else {
        burst(L, R, at, Math.floor(rnd(0.001, 0.006) * sr), amp, pan)
        if (rand() < 0.07) ping(L, R, sr, at, { f: rnd(1400, 4200), dur: 0.03, amp: amp * 0.5, pan, decay: 0.008 })
      }
    }
  }, { peak: 0.9 })

/** Tonnerre : craquement puis long grondement filtré. */
export const thunder = (ctx: Ctx) =>
  makeBuffer(ctx, 'thunder', 42, (L, R, sr) => {
    const starts = [rnd(3, 7), rnd(16, 21), rnd(30, 35)]
    for (const s of starts) {
      const at = Math.floor(s * sr)
      const big = rnd(0.55, 1)
      const crack = rnd(0.12, 0.35)
      const rumble = rnd(4.5, 8.5)
      const pan = white1() * 0.6
      const [gl, gr] = panGains(pan)
      const len = Math.floor((rumble + 1) * sr)
      const flutter = new Drift(0.35, 1, Math.floor(0.12 * sr), 0.002)
      const aR = Math.exp((-2 * Math.PI * rnd(160, 320)) / sr)
      const aC = Math.exp((-2 * Math.PI * 1800) / sr)
      let brown = 0, lp1 = 0, lp2 = 0, lc = 0
      const delayRumble = Math.floor(rnd(0.05, 0.6) * sr)
      for (let i = 0; i < len && at + i < L.length; i++) {
        const t = i / sr
        const w = white1()
        brown = (brown + 0.02 * w) / 1.02
        lp1 = (1 - aR) * brown * 3.5 + aR * lp1
        lp2 = (1 - aR) * lp1 + aR * lp2
        const tr = Math.max(0, i - delayRumble) / sr
        const envR = Math.min(1, tr / 0.5) * Math.exp(-tr / (rumble / 3.2))
        lc = (1 - aC) * w + aC * lc
        const envC = Math.exp(-t / (crack / 3))
        const v = (lp2 * 9 * envR * flutter.next() + lc * 2.2 * envC) * big
        L[at + i] += v * gl
        R[at + i] += v * gr
      }
    }
  }, { peak: 0.95, fade: 0.5 })

/** Vagues : bruit dont l'amplitude et la brillance suivent le ressac. */
export const waves = (ctx: Ctx) =>
  makeBuffer(ctx, 'waves', 32, (L, R, sr) => {
    const n = L.length
    const envAt = new Float32Array(n)
    let t = 0
    while (t < n) {
      const period = Math.floor(rnd(7, 11) * sr)
      const peak = rnd(0.6, 1)
      for (let j = 0; j < period && t + j < n; j++) {
        const x = j / period
        const e = x < 0.38 ? Math.pow(Math.sin(((x / 0.38) * Math.PI) / 2), 2) : Math.exp(-(x - 0.38) * 4.2)
        envAt[t + j] = Math.max(envAt[t + j], e * peak)
      }
      t += Math.floor(period * rnd(0.82, 0.95))
    }
    const off = Math.floor(0.35 * sr)
    for (const [ch, shift] of [[L, 0], [R, off]] as const) {
      let b0 = 0, b1 = 0, b2 = 0, brown = 0, y = 0, a = 0
      for (let i = 0; i < n; i++) {
        const e = envAt[(i - shift + n) % n]
        if (i % 64 === 0) a = Math.exp((-2 * Math.PI * (220 + 2600 * Math.pow(e, 1.6))) / sr)
        const w = white1()
        b0 = 0.99765 * b0 + w * 0.099046
        b1 = 0.963 * b1 + w * 0.2965164
        b2 = 0.57 * b2 + w * 1.0526913
        const pink = (b0 + b1 + b2 + w * 0.1848) * 0.15
        brown = (brown + 0.02 * w) / 1.02
        const src = pink * 0.7 + brown * 2.2
        y = (1 - a) * src + a * y
        ch[i] = y * (0.06 + 0.94 * e)
      }
    }
  }, { peak: 0.9, fade: 0.6 })

/** Chants d'oiseaux variés (sifflements, séries, trilles). */
export const birds = (ctx: Ctx) =>
  makeBuffer(ctx, 'birds', 34, (L, R, sr) => {
    let t = 0.3
    const total = L.length / sr - 1
    while (t < total) {
      const pan = white1() * 0.9
      const dist = rnd(0.25, 1)
      const kind = Math.floor(rand() * 5)
      let s = t
      if (kind === 0) {
        const reps = 1 + Math.floor(rand() * 3)
        const f1 = rnd(2200, 3200), f2 = f1 * rnd(1.15, 1.5)
        for (let r = 0; r < reps; r++) {
          chirp(L, R, sr, Math.floor(s * sr), { f1, f2, dur: rnd(0.15, 0.28), amp: 0.5 * dist, pan })
          s += rnd(0.3, 0.45)
        }
      } else if (kind === 1) {
        const k = 4 + Math.floor(rand() * 7)
        const base = rnd(3500, 5200)
        for (let r = 0; r < k; r++) {
          chirp(L, R, sr, Math.floor(s * sr), { f1: base, f2: base * 0.62, dur: 0.045, amp: 0.4 * dist, pan, curve: 0.6 })
          s += rnd(0.06, 0.09)
        }
      } else if (kind === 2) {
        const f = rnd(3600, 4600)
        chirp(L, R, sr, Math.floor(s * sr), { f1: f, f2: f * 1.05, dur: rnd(0.6, 1.1), amp: 0.3 * dist, pan, am: rnd(22, 34) })
      } else if (kind === 3) {
        chirp(L, R, sr, Math.floor(s * sr), { f1: 2100, f2: 2300, dur: 0.14, amp: 0.45 * dist, pan })
        chirp(L, R, sr, Math.floor((s + 0.18) * sr), { f1: 3000, f2: 3300, dur: 0.16, amp: 0.45 * dist, pan })
      } else {
        // Roucoulement grave et doux
        const f = rnd(420, 560)
        for (let r = 0; r < 3; r++) {
          chirp(L, R, sr, Math.floor(s * sr), { f1: f, f2: f * 0.85, dur: rnd(0.3, 0.5), amp: 0.25 * dist, pan })
          s += rnd(0.55, 0.75)
        }
      }
      t += rnd(0.6, 2.4)
    }
  }, { peak: 0.75, fade: 0.3 })

/** Grillons : impulsions modulées autour de 4–5 kHz. */
export const crickets = (ctx: Ctx) =>
  makeBuffer(ctx, 'crickets', 20, (L, R, sr) => {
    const n = L.length
    for (let c = 0; c < 5; c++) {
      const fc = rnd(3900, 5200)
      const period = rnd(0.55, 1.05)
      const pan = white1() * 0.9
      const amp = rnd(0.15, 0.5)
      const [gl, gr] = panGains(pan)
      let t = rnd(0, period)
      while (t * sr < n) {
        for (let p = 0; p < 3; p++) {
          const at = Math.floor((t + p * 0.032) * sr)
          const len = Math.floor(0.018 * sr)
          for (let i = 0; i < len && at + i < n; i++) {
            const x = i / len
            const v = Math.sin((2 * Math.PI * fc * (at + i)) / sr) * Math.sin(Math.PI * x) * amp
            L[at + i] += v * gl
            R[at + i] += v * gr
          }
        }
        t += period * rnd(0.92, 1.08)
      }
    }
  }, { peak: 0.6 })

/** Crépitements de feu de bois. */
export const crackle = (ctx: Ctx, soft = false) =>
  makeBuffer(ctx, soft ? 'crackle-soft' : 'crackle', 16, (L, R, sr) => {
    const n = L.length
    const rate = soft ? 7 : 14
    const pops = soft ? 0.5 : 1
    const count = Math.floor((rate * n) / sr)
    for (let i = 0; i < count; i++) {
      const at = Math.floor(rand() * n)
      burst(L, R, at, Math.floor(rnd(0.0005, 0.003) * sr), 0.1 + 0.9 * Math.pow(rand(), 3), white1() * 0.7, 0.3)
    }
    const pc = Math.floor((pops * n) / sr)
    for (let i = 0; i < pc; i++) {
      const at = Math.floor(rand() * n)
      const pan = white1() * 0.6
      const amp = rnd(0.4, 1)
      burst(L, R, at, Math.floor(rnd(0.004, 0.02) * sr), amp, pan, 0.15)
      ping(L, R, sr, at, { f: rnd(700, 2600), dur: 0.04, amp: amp * 0.35, pan, decay: 0.01 })
      // petite rafale qui suit parfois le « pop »
      if (rand() < 0.4) for (let k = 0; k < 4; k++) burst(L, R, at + Math.floor(rnd(0.01, 0.15) * sr), Math.floor(0.002 * sr), amp * 0.3, pan, 0.3)
    }
  }, { peak: 0.9 })

/** Tic-tac d'horloge : période exacte de 2 s, boucle parfaite. */
export const tick = (ctx: Ctx) =>
  makeBuffer(ctx, 'tick', 2, (L, R, sr) => {
    const hit = (at: number, fs: number[], amp: number) => {
      for (const f of fs) ping(L, R, sr, at, { f, dur: 0.05, amp: amp / fs.length, pan: 0, decay: 0.006 })
      burst(L, R, at, Math.floor(0.003 * sr), amp * 0.4, 0, 0.3)
    }
    hit(Math.floor(0.01 * sr), [3200, 5100, 1150], 1)
    hit(Math.floor(1.01 * sr), [2450, 4300, 950], 0.85)
  }, { fade: 0, peak: 0.8 })

/** Frappe au clavier par rafales. */
export const keys = (ctx: Ctx) =>
  makeBuffer(ctx, 'keys', 26, (L, R, sr) => {
    let t = 0.2
    const total = L.length / sr - 0.5
    const key = (at: number, amp: number, pan: number, space = false) => {
      burst(L, R, at, Math.floor(0.004 * sr), amp, pan, 0.25)
      ping(L, R, sr, at, { f: space ? rnd(160, 220) : rnd(2200, 3600), dur: 0.02, amp: amp * 0.4, pan, decay: 0.004 })
      ping(L, R, sr, at, { f: space ? 110 : rnd(180, 260), dur: 0.03, amp: amp * (space ? 0.8 : 0.35), pan, decay: 0.008 })
      const rel = at + Math.floor(rnd(0.06, 0.11) * sr)
      burst(L, R, rel, Math.floor(0.003 * sr), amp * 0.35, pan, 0.25)
    }
    while (t < total) {
      const burstLen = 4 + Math.floor(rand() * 26)
      for (let k = 0; k < burstLen && t < total; k++) {
        const space = rand() < 0.15
        key(Math.floor(t * sr), rnd(0.35, 0.8), rnd(-0.3, 0.3), space)
        t += rnd(0.08, 0.24)
      }
      t += rnd(0.5, 2.8)
    }
  }, { peak: 0.8, fade: 0.2 })

/** Ronronnement : impulsions graves à ~25 Hz, rythmées par la respiration. */
export const purr = (ctx: Ctx) =>
  makeBuffer(ctx, 'purr', 12, (L, R, sr) => {
    const n = L.length
    let brown = 0, y1 = 0, y2 = 0
    const a = Math.exp((-2 * Math.PI * 380) / sr)
    const cycle = 2.9
    for (let i = 0; i < n; i++) {
      const t = i / sr
      const c = (t % cycle) / cycle
      // inspiration (plus faible) puis expiration
      const breath = c < 0.4 ? 0.45 * Math.sin((c / 0.4) * Math.PI) : c < 0.93 ? Math.sin(((c - 0.4) / 0.53) * Math.PI) : 0
      const rate = c < 0.4 ? 27 : 23
      const pulse = Math.pow(Math.max(0, Math.sin(2 * Math.PI * rate * t)), 3)
      brown = (brown + 0.02 * white1()) / 1.02
      y1 = (1 - a) * brown * 3.5 + a * y1
      y2 = (1 - a) * y1 + a * y2
      const v = y2 * pulse * breath * 6
      L[i] += v
      R[i] += v
    }
  }, { peak: 0.9, fade: 0.1 })

/** Disque vinyle : poussière, petits « pops » et tour de platine. */
export const vinyl = (ctx: Ctx) =>
  makeBuffer(ctx, 'vinyl', 10.8, (L, R, sr) => {
    const n = L.length
    const c = Math.floor((28 * n) / sr)
    for (let i = 0; i < c; i++) burst(L, R, Math.floor(rand() * n), Math.floor(rnd(0.0003, 0.0015) * sr), 0.05 + 0.5 * Math.pow(rand(), 4), white1() * 0.3, 0.3)
    const big = Math.floor((1.2 * n) / sr)
    for (let i = 0; i < big; i++) burst(L, R, Math.floor(rand() * n), Math.floor(0.002 * sr), rnd(0.4, 0.9), white1() * 0.2, 0.2)
    // léger « toc » à chaque tour (33 tours/min ≈ 1,8 s)
    for (let t = 0.3; t < n / sr; t += 1.8) ping(L, R, sr, Math.floor(t * sr), { f: 60, dur: 0.08, amp: 0.25, decay: 0.02 })
  }, { peak: 0.8, fade: 0.05 })

/** Bulles : sinus dont la fréquence monte rapidement. */
export const bubbles = (ctx: Ctx, dense = false) =>
  makeBuffer(ctx, dense ? 'bubbles-dense' : 'bubbles', 10, (L, R, sr) => {
    const n = L.length
    const count = Math.floor(((dense ? 26 : 7) * n) / sr)
    for (let i = 0; i < count; i++) {
      const f = rnd(300, dense ? 1800 : 1200)
      const dur = rnd(0.015, 0.045)
      ping(L, R, sr, Math.floor(rand() * n), { f, f2: f * rnd(1.4, 1.9), dur, amp: rnd(0.15, 0.6), pan: white1() * 0.8, decay: dur / 2.5 })
    }
  }, { peak: 0.8 })

/** Chants de baleine : longues glissades graves avec vibrato. */
export const whales = (ctx: Ctx) =>
  makeBuffer(ctx, 'whales', 46, (L, R, sr) => {
    let t = 1
    while (t < 42) {
      const dur = rnd(2, 5)
      const f1 = rnd(110, 420)
      const f2 = f1 * rnd(0.6, 1.6)
      const vib = rnd(3.5, 6)
      const depth = rnd(0.015, 0.05)
      const pan = white1() * 0.7
      const [gl, gr] = panGains(pan)
      const at = Math.floor(t * sr)
      const len = Math.floor(dur * sr)
      let ph = 0
      for (let i = 0; i < len && at + i < L.length; i++) {
        const x = i / len
        const f = (f1 + (f2 - f1) * (0.5 - 0.5 * Math.cos(Math.PI * x))) * (1 + depth * Math.sin(2 * Math.PI * vib * (i / sr)))
        ph += (2 * Math.PI * f) / sr
        const env = Math.pow(Math.sin(Math.PI * x), 2)
        const v = (Math.sin(ph) + 0.35 * Math.sin(2 * ph) + 0.15 * Math.sin(3 * ph)) * env * 0.4
        L[at + i] += v * gl
        R[at + i] += v * gr
      }
      t += dur + rnd(1.5, 6)
    }
    lowpass(L, 1400, sr)
    lowpass(R, 1400, sr)
  }, { peak: 0.8, fade: 1 })

const VOWELS: [number, number][] = [
  [730, 1090], [270, 2290], [300, 870], [530, 1840], [660, 1720], [440, 1020], [490, 1350], [390, 1990],
]

/** Brouhaha de conversations : voix synthétiques filtrées par formants, mélangées à distance. */
export const babble = (ctx: Ctx, voices = 9) =>
  makeBuffer(ctx, `babble-${voices}`, 22, (L, R, sr) => {
    const n = L.length
    const tmp = new Float32Array(n)
    for (let v = 0; v < voices; v++) {
      tmp.fill(0)
      const f0base = rand() < 0.5 ? rnd(95, 140) : rnd(170, 240)
      const amp = rnd(0.25, 1)
      const pan = white1() * 0.9
      const [gl, gr] = panGains(pan)
      const bq1 = new BQ()
      const bq2 = new BQ()
      let i = Math.floor(rnd(0, 1.5) * sr)
      let phase = 0
      let sylInWord = 0
      while (i < n) {
        const dur = Math.floor(rnd(0.09, 0.24) * sr)
        const [F1, F2] = VOWELS[Math.floor(rand() * VOWELS.length)]
        bq1.bandpass(F1 * rnd(0.9, 1.1), 5, sr)
        bq2.bandpass(F2 * rnd(0.9, 1.1), 7, sr)
        const f0 = f0base * rnd(0.88, 1.15)
        for (let j = 0; j < dur && i + j < n; j++) {
          const x = j / dur
          phase += f0 / sr
          if (phase >= 1) phase -= 1
          const src = (2 * phase - 1) * 0.8 + white1() * 0.25
          const env = Math.pow(Math.sin(Math.PI * x), 1.4)
          tmp[i + j] = (bq1.process(src) + bq2.process(src) * 0.7) * env * amp
        }
        i += dur
        sylInWord++
        if (sylInWord > 2 + Math.floor(rand() * 5)) {
          sylInWord = 0
          i += Math.floor((rand() < 0.2 ? rnd(0.8, 2.5) : rnd(0.08, 0.35)) * sr)
        }
      }
      for (let k = 0; k < n; k++) {
        L[k] += tmp[k] * gl
        R[k] += tmp[k] * gr
      }
    }
    lowpass(L, 3200, sr)
    lowpass(R, 3200, sr)
  }, { peak: 0.85, fade: 0.4 })

/** Tasses et cuillères dans un café. */
export const clinks = (ctx: Ctx) =>
  makeBuffer(ctx, 'clinks', 30, (L, R, sr) => {
    let t = 0.8
    const total = L.length / sr - 1
    const clink = (at: number, amp: number, pan: number) => {
      const f = rnd(1900, 2800)
      const parts: [number, number, number][] = [[1, 1, 0.35], [2.32, 0.6, 0.25], [4.25, 0.35, 0.15], [6.6, 0.2, 0.1]]
      for (const [m, a, d] of parts) ping(L, R, sr, at, { f: f * m, dur: d * 3, amp: amp * a * 0.4, pan, decay: d })
    }
    while (t < total) {
      const pan = white1() * 0.8
      const amp = rnd(0.25, 0.9)
      const r = rand()
      if (r < 0.55) clink(Math.floor(t * sr), amp, pan)
      else if (r < 0.85) {
        let s = t
        for (let k = 0; k < 3 + Math.floor(rand() * 4); k++) {
          clink(Math.floor(s * sr), amp * 0.35, pan)
          s += rnd(0.1, 0.16)
        }
      } else {
        const at = Math.floor(t * sr)
        ping(L, R, sr, at, { f: rnd(150, 220), dur: 0.12, amp: amp * 0.6, pan, decay: 0.03 })
        burst(L, R, at, Math.floor(0.01 * sr), amp * 0.4, pan, 0.2)
      }
      t += rnd(1.2, 4.5)
    }
  }, { peak: 0.8, fade: 0.2 })

/** Pages qu'on tourne dans une bibliothèque. */
export const pages = (ctx: Ctx) =>
  makeBuffer(ctx, 'pages', 40, (L, R, sr) => {
    let t = 2
    while (t < 37) {
      const dur = rnd(0.3, 0.6)
      const at = Math.floor(t * sr)
      const len = Math.floor(dur * sr)
      const pan = white1() * 0.7
      const [gl, gr] = panGains(pan)
      const bq = new BQ().bandpass(rnd(2800, 4200), 0.7, sr)
      const amp = rnd(0.3, 0.8)
      for (let i = 0; i < len && at + i < L.length; i++) {
        const x = i / len
        const env = x < 0.35 ? x / 0.35 : Math.pow(1 - (x - 0.35) / 0.65, 2)
        const flutter = 0.7 + 0.3 * Math.sin(2 * Math.PI * 38 * (i / sr))
        const v = bq.process(white1()) * env * flutter * amp
        L[at + i] += v * gl
        R[at + i] += v * gr
      }
      burst(L, R, at + len, Math.floor(0.008 * sr), amp * 0.5, pan, 0.25)
      t += rnd(4, 11)
    }
  }, { peak: 0.6, fade: 0.2 })

/** Circulation : voitures qui passent, d'un côté à l'autre, et un klaxon lointain. */
export const traffic = (ctx: Ctx) =>
  makeBuffer(ctx, 'traffic', 40, (L, R, sr) => {
    let t = 0
    while (t < 38) {
      const dur = rnd(4, 8)
      const at = Math.floor(t * sr)
      const len = Math.floor(dur * sr)
      const amp = rnd(0.3, 1)
      const dir = rand() < 0.5 ? 1 : -1
      let brown = 0, y = 0, b0 = 0, b1 = 0
      let a = 0
      for (let i = 0; i < len && at + i < L.length; i++) {
        const x = i / len
        const env = Math.exp(-Math.pow((x - 0.5) / 0.17, 2))
        if (i % 64 === 0) a = Math.exp((-2 * Math.PI * (240 + 1100 * env)) / sr)
        const w = white1()
        brown = (brown + 0.02 * w) / 1.02
        b0 = 0.99 * b0 + w * 0.06
        b1 = 0.9 * b1 + w * 0.2
        y = (1 - a) * (brown * 3 + (b0 + b1) * 0.4) + a * y
        const [gl, gr] = panGains(dir * (x * 1.8 - 0.9))
        const v = y * env * amp
        L[at + i] += v * gl
        R[at + i] += v * gr
      }
      t += rnd(1.6, 5.5)
    }
    if (rand() < 0.8) {
      const at = Math.floor(rnd(10, 30) * sr)
      for (const [f, off] of [[415, 0], [523, 0]] as const) {
        for (const h of [1, 3, 5]) ping(L, R, sr, at + off, { f: f * h, dur: 0.35, amp: 0.05 / h, pan: 0.5, decay: 0.3, attack: 0.01 })
      }
    }
  }, { peak: 0.85, fade: 0.5 })

/** Roues de train sur les joints de rail : « ta-dam … ta-dam ». */
export const trainClacks = (ctx: Ctx) =>
  makeBuffer(ctx, 'train-clacks', 8.8, (L, R, sr) => {
    for (let k = 0; k < 8; k++) {
      for (const off of [0, 0.17]) {
        const at = Math.floor((k * 1.1 + off + 0.02) * sr)
        const amp = k % 2 === 0 ? 0.9 : 0.75
        const len = Math.floor(0.05 * sr)
        const tmpL = new Float32Array(len)
        for (let i = 0; i < len; i++) tmpL[i] = white1() * Math.exp(-i / (len * 0.2)) * amp
        lowpass(tmpL, 420, sr, 2)
        for (let i = 0; i < len; i++) {
          L[at + i] += tmpL[i] * 4
          R[at + i] += tmpL[i] * 4
        }
        ping(L, R, sr, at, { f: rnd(1700, 2100), dur: 0.03, amp: 0.08, decay: 0.006 })
      }
    }
  }, { fade: 0, peak: 0.8 })

export { highpass }
