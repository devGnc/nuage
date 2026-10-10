/**
 * Boîte à outils de synthèse « hors temps réel » : on calcule des échantillons dans des
 * Float32Array, puis on les joue en boucle. Aucun fichier audio n'est nécessaire.
 */

export type Fill = (L: Float32Array, R: Float32Array, sr: number) => void

const cache = new Map<string, AudioBuffer>()

export const rand = () => Math.random()
export const rnd = (a: number, b: number) => a + Math.random() * (b - a)
export const white1 = () => Math.random() * 2 - 1

/** Gains gauche/droite à puissance constante pour un panoramique p ∈ [-1, 1]. */
export function panGains(p: number): [number, number] {
  const a = ((p + 1) * Math.PI) / 4
  return [Math.cos(a), Math.sin(a)]
}

/**
 * Crée (ou récupère en cache) un buffer stéréo bouclable.
 * Le remplissage dépasse de `fade` secondes ; ce surplus est fondu au début pour une boucle sans clic.
 */
export function makeBuffer(ctx: BaseAudioContext, key: string, seconds: number, fill: Fill, opts: { fade?: number; peak?: number } = {}): AudioBuffer {
  const hit = cache.get(key)
  if (hit) return hit
  const sr = ctx.sampleRate
  const fade = opts.fade ?? 0.08
  const n = Math.floor(seconds * sr)
  const f = Math.floor(fade * sr)
  const L = new Float32Array(n + f)
  const R = new Float32Array(n + f)
  fill(L, R, sr)
  if (f > 0) {
    for (let i = 0; i < f; i++) {
      const w = i / f
      const a = Math.sin((w * Math.PI) / 2)
      const b = Math.cos((w * Math.PI) / 2)
      L[i] = L[i] * a + L[n + i] * b
      R[i] = R[i] * a + R[n + i] * b
    }
  }
  if (opts.peak) {
    let m = 0
    for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(L[i]), Math.abs(R[i]))
    if (m > 0) {
      const k = opts.peak / m
      for (let i = 0; i < n; i++) {
        L[i] *= k
        R[i] *= k
      }
    }
  }
  const buf = ctx.createBuffer(2, n, sr)
  buf.copyToChannel(L.subarray(0, n), 0)
  buf.copyToChannel(R.subarray(0, n), 1)
  cache.set(key, buf)
  return buf
}

// ——— Bruits ———

export function addWhite(out: Float32Array, amp = 1) {
  for (let i = 0; i < out.length; i++) out[i] += white1() * amp
}

export function addPink(out: Float32Array, amp = 1) {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  for (let i = 0; i < out.length; i++) {
    const w = white1()
    b0 = 0.99886 * b0 + w * 0.0555179
    b1 = 0.99332 * b1 + w * 0.0750759
    b2 = 0.969 * b2 + w * 0.153852
    b3 = 0.8665 * b3 + w * 0.3104856
    b4 = 0.55 * b4 + w * 0.5329522
    b5 = -0.7616 * b5 - w * 0.016898
    out[i] += (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11 * amp
    b6 = w * 0.115926
  }
}

export function addBrown(out: Float32Array, amp = 1) {
  let last = 0
  for (let i = 0; i < out.length; i++) {
    last = (last + 0.02 * white1()) / 1.02
    out[i] += last * 3.5 * amp
  }
}

// ——— Filtres sur tableaux ———

export function lowpass(arr: Float32Array, cutoff: number, sr: number, passes = 1) {
  const a = Math.exp((-2 * Math.PI * cutoff) / sr)
  for (let p = 0; p < passes; p++) {
    let y = 0
    for (let i = 0; i < arr.length; i++) {
      y = (1 - a) * arr[i] + a * y
      arr[i] = y
    }
  }
}

export function highpass(arr: Float32Array, cutoff: number, sr: number) {
  const a = Math.exp((-2 * Math.PI * cutoff) / sr)
  let y = 0
  for (let i = 0; i < arr.length; i++) {
    y = (1 - a) * arr[i] + a * y
    arr[i] = arr[i] - y
  }
}

/** Biquad (formules RBJ) pour filtrer échantillon par échantillon. */
export class BQ {
  b0 = 1; b1 = 0; b2 = 0; a1 = 0; a2 = 0
  x1 = 0; x2 = 0; y1 = 0; y2 = 0

  private set(b0: number, b1: number, b2: number, a0: number, a1: number, a2: number) {
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0
  }

  bandpass(f: number, q: number, sr: number) {
    const w = (2 * Math.PI * f) / sr
    const al = Math.sin(w) / (2 * q)
    this.set(al, 0, -al, 1 + al, -2 * Math.cos(w), 1 - al)
    return this
  }

  lowpass(f: number, q: number, sr: number) {
    const w = (2 * Math.PI * f) / sr
    const al = Math.sin(w) / (2 * q)
    const c = Math.cos(w)
    this.set((1 - c) / 2, 1 - c, (1 - c) / 2, 1 + al, -2 * c, 1 - al)
    return this
  }

  highpass(f: number, q: number, sr: number) {
    const w = (2 * Math.PI * f) / sr
    const al = Math.sin(w) / (2 * q)
    const c = Math.cos(w)
    this.set((1 + c) / 2, -(1 + c), (1 + c) / 2, 1 + al, -2 * c, 1 - al)
    return this
  }

  process(x: number) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y
    return y
  }
}

// ——— Événements ———

/** Petit bruit qui décroît vite (goutte, craquement, clic). */
export function burst(L: Float32Array, R: Float32Array, at: number, len: number, amp: number, pan: number, decay = 0.25) {
  const [gl, gr] = panGains(pan)
  const end = Math.min(L.length, at + len)
  const tau = Math.max(1, len * decay)
  for (let i = at; i < end; i++) {
    const v = white1() * amp * Math.exp(-(i - at) / tau)
    L[i] += v * gl
    R[i] += v * gr
  }
}

/** Sinus amorti, avec glissement de fréquence optionnel. */
export function ping(
  L: Float32Array, R: Float32Array, sr: number, at: number,
  o: { f: number; f2?: number; dur: number; amp: number; pan?: number; decay?: number; attack?: number },
) {
  const [gl, gr] = panGains(o.pan ?? 0)
  const len = Math.floor(o.dur * sr)
  const end = Math.min(L.length, at + len)
  const tau = (o.decay ?? o.dur / 4) * sr
  const att = Math.max(1, (o.attack ?? 0.002) * sr)
  let ph = 0
  for (let i = at; i < end; i++) {
    const x = (i - at) / len
    const f = o.f2 ? o.f + (o.f2 - o.f) * x : o.f
    ph += (2 * Math.PI * f) / sr
    const env = Math.min(1, (i - at) / att) * Math.exp(-(i - at) / tau)
    const v = Math.sin(ph) * o.amp * env
    L[i] += v * gl
    R[i] += v * gr
  }
}

/** Ton « oiseau » : glissement de fréquence avec enveloppe en cloche. */
export function chirp(
  L: Float32Array, R: Float32Array, sr: number, at: number,
  o: { f1: number; f2: number; dur: number; amp: number; pan: number; curve?: number; am?: number },
) {
  const [gl, gr] = panGains(o.pan)
  const len = Math.floor(o.dur * sr)
  const end = Math.min(L.length, at + len)
  let ph = 0
  for (let i = at; i < end; i++) {
    const x = (i - at) / len
    const shaped = Math.pow(x, o.curve ?? 1)
    const f = o.f1 + (o.f2 - o.f1) * shaped
    ph += (2 * Math.PI * f) / sr
    let env = Math.pow(Math.sin(Math.PI * x), 1.5)
    if (o.am) env *= 0.5 + 0.5 * Math.sin(2 * Math.PI * o.am * ((i - at) / sr))
    const v = (Math.sin(ph) + 0.18 * Math.sin(2 * ph)) * o.amp * env
    L[i] += v * gl
    R[i] += v * gr
  }
}

/** Valeur aléatoire lissée (pour moduler doucement une amplitude ou une fréquence). */
export class Drift {
  private v: number
  private target: number
  private count = 0
  constructor(private min: number, private max: number, private stepSamples: number, private smooth = 0.0005) {
    this.v = rnd(min, max)
    this.target = this.v
  }
  next() {
    if (this.count-- <= 0) {
      this.target = rnd(this.min, this.max)
      this.count = this.stepSamples
    }
    this.v += (this.target - this.v) * this.smooth
    return this.v
  }
}
