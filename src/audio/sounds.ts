import * as B from './buffers'

export type SoundCategory = 'focus' | 'weather' | 'nature' | 'interior' | 'urban' | 'niche'

/** Outils pour câbler un son dans le graphe Web Audio ; tout ce qui est créé est arrêté ensemble. */
export class Kit {
  private nodes: AudioNode[] = []
  private sources: (AudioScheduledSourceNode)[] = []
  constructor(public ctx: AudioContext, public out: AudioNode, public rev: AudioNode) {}

  private track<T extends AudioNode>(n: T): T {
    this.nodes.push(n)
    return n
  }

  g(v: number) {
    const n = this.track(this.ctx.createGain())
    n.gain.value = v
    return n
  }

  f(type: BiquadFilterType, freq: number, q = 0.707) {
    const n = this.track(this.ctx.createBiquadFilter())
    n.type = type
    n.frequency.value = freq
    n.Q.value = q
    return n
  }
  lp(f: number, q?: number) { return this.f('lowpass', f, q) }
  hp(f: number, q?: number) { return this.f('highpass', f, q) }
  bp(f: number, q?: number) { return this.f('bandpass', f, q) }

  pan(p: number) {
    const n = this.track(this.ctx.createStereoPanner())
    n.pan.value = p
    return n
  }

  osc(type: OscillatorType, freq: number) {
    const o = this.track(this.ctx.createOscillator())
    o.type = type
    o.frequency.value = freq
    o.start()
    this.sources.push(o)
    return o
  }

  /** Module un paramètre autour de sa valeur actuelle. */
  lfo(rate: number, depth: number, param: AudioParam, type: OscillatorType = 'sine') {
    const o = this.osc(type, rate)
    const g = this.g(depth)
    o.connect(g)
    g.connect(param)
  }

  /** Joue un buffer en boucle à travers une chaîne de nœuds, vers la sortie du son. */
  play(buf: AudioBuffer, chain: AudioNode[] = [], o: { send?: number; rate?: number } = {}) {
    const src = this.track(this.ctx.createBufferSource())
    src.buffer = buf
    src.loop = true
    if (o.rate) src.playbackRate.value = o.rate
    let last: AudioNode = src
    for (const n of chain) {
      last.connect(n)
      last = n
    }
    last.connect(this.out)
    if (o.send) {
      const s = this.g(o.send)
      last.connect(s)
      s.connect(this.rev)
    }
    // départ décalé : deux sons basés sur le même buffer ne seront pas en phase
    src.start(this.ctx.currentTime + 0.02, Math.random() * buf.duration)
    this.sources.push(src)
    return src
  }

  /** Connecte une chaîne d'oscillateurs/nœuds déjà créés jusqu'à la sortie. */
  route(chain: AudioNode[], send = 0) {
    for (let i = 0; i < chain.length - 1; i++) chain[i].connect(chain[i + 1])
    const last = chain[chain.length - 1]
    last.connect(this.out)
    if (send) {
      const s = this.g(send)
      last.connect(s)
      s.connect(this.rev)
    }
  }

  stop() {
    const t = this.ctx.currentTime
    for (const s of this.sources) {
      try {
        s.stop(t + 0.05)
      } catch {
        /* déjà arrêté */
      }
    }
    setTimeout(() => {
      for (const n of this.nodes) {
        try {
          n.disconnect()
        } catch {
          /* rien */
        }
      }
    }, 120)
  }
}

export interface SoundDef {
  id: string
  emoji: string
  cat: SoundCategory
  name: { fr: string; en: string }
  hint?: { fr: string; en: string }
  build: (k: Kit) => void
}

/** Gain de normalisation : à volume égal, toutes les ambiances ont un niveau perçu proche. */
export const LEVELS: Record<string, number> = {'white': 2.2, 'pink': 2.1, 'brown': 1.5, 'bin-gamma': 1.4, 'bin-beta': 1.4, 'bin-alpha': 1.4, 'bin-theta': 1.4, 'bin-delta': 1.4, 'rain': 4, 'light-rain': 5, 'heavy-rain': 2, 'storm': 2.2, 'wind': 3.5, 'tent': 2.4, 'ocean': 2.4, 'stream': 4, 'waterfall': 2, 'forest': 2.4, 'night': 3.5, 'campfire': 2.5, 'underwater': 1.6, 'whales': 1.8, 'fireplace': 2.8, 'cafe': 1.9, 'library': 6, 'keyboard': 2.5, 'clock': 3, 'fan': 2.8, 'aircon': 2.3, 'purr': 2.2, 'vinyl': 3, 'city': 2.6, 'train': 2.2, 'airplane': 2, 'office': 3, 'space': 1.8}


const binaural = (id: string, emoji: string, beat: number, carrier: number, fr: string, en: string, hfr: string, hen: string): SoundDef => ({
  id, emoji, cat: 'focus', name: { fr, en }, hint: { fr: hfr, en: hen },
  build: (k) => {
    const l = k.osc('sine', carrier)
    const r = k.osc('sine', carrier + beat)
    const g = k.g(0.16)
    k.route([l, k.pan(-1), g])
    r.connect(k.pan(1)).connect(g)
  },
})

export const SOUNDS: SoundDef[] = [
  // ——— Concentration ———
  { id: 'white', emoji: '🤍', cat: 'focus', name: { fr: 'Bruit blanc', en: 'White noise' }, hint: { fr: 'Masque les bruits ambiants', en: 'Masks background noise' },
    build: (k) => { k.play(B.noise(k.ctx, 'white'), [k.lp(12000), k.g(0.4)]) } },
  { id: 'pink', emoji: '🩷', cat: 'focus', name: { fr: 'Bruit rose', en: 'Pink noise' }, hint: { fr: 'Plus doux que le blanc', en: 'Softer than white' },
    build: (k) => { k.play(B.noise(k.ctx, 'pink'), [k.g(0.55)]) } },
  { id: 'brown', emoji: '🤎', cat: 'focus', name: { fr: 'Bruit brun', en: 'Brown noise' }, hint: { fr: 'Grave et enveloppant', en: 'Deep and warm' },
    build: (k) => { k.play(B.noise(k.ctx, 'brown'), [k.g(0.75)]) } },
  binaural('bin-gamma', '⚡', 40, 220, 'Binaural gamma', 'Binaural gamma', 'Réflexion intense · 40 Hz', 'Problem solving · 40 Hz'),
  binaural('bin-beta', '💻', 18, 210, 'Binaural bêta', 'Binaural beta', 'Concentration · 18 Hz', 'Focus · 18 Hz'),
  binaural('bin-alpha', '🌤️', 10, 200, 'Binaural alpha', 'Binaural alpha', 'Calme et créativité · 10 Hz', 'Calm & creativity · 10 Hz'),
  binaural('bin-theta', '🧘', 6, 180, 'Binaural thêta', 'Binaural theta', 'Méditation · 6 Hz', 'Meditation · 6 Hz'),
  binaural('bin-delta', '😴', 2, 150, 'Binaural delta', 'Binaural delta', 'Sommeil · 2 Hz', 'Sleep · 2 Hz'),

  // ——— Météo ———
  { id: 'rain', emoji: '🌧️', cat: 'weather', name: { fr: 'Pluie', en: 'Rain' },
    build: (k) => {
      k.play(B.noise(k.ctx, 'pink'), [k.hp(500), k.lp(7000), k.g(0.22)])
      k.play(B.drops(k.ctx, 'normal'), [k.bp(2600, 0.6), k.g(1.1)])
      k.play(B.noise(k.ctx, 'brown'), [k.lp(300), k.g(0.18)])
    } },
  { id: 'light-rain', emoji: '🌦️', cat: 'weather', name: { fr: 'Pluie fine', en: 'Light rain' },
    build: (k) => {
      k.play(B.noise(k.ctx, 'pink'), [k.hp(1400), k.lp(9000), k.g(0.09)])
      k.play(B.drops(k.ctx, 'light'), [k.bp(3200, 0.7), k.g(1)])
    } },
  { id: 'heavy-rain', emoji: '☔', cat: 'weather', name: { fr: 'Averse', en: 'Heavy rain' },
    build: (k) => {
      k.play(B.noise(k.ctx, 'pink'), [k.lp(5500), k.g(0.42)])
      k.play(B.noise(k.ctx, 'brown'), [k.lp(500), k.g(0.35)])
      k.play(B.drops(k.ctx, 'heavy'), [k.bp(2000, 0.5), k.g(0.9)])
    } },
  { id: 'storm', emoji: '⛈️', cat: 'weather', name: { fr: 'Orage', en: 'Thunderstorm' },
    build: (k) => {
      k.play(B.noise(k.ctx, 'pink'), [k.lp(5000), k.g(0.36)])
      k.play(B.drops(k.ctx, 'heavy'), [k.bp(2000, 0.5), k.g(0.75)])
      k.play(B.thunder(k.ctx), [k.g(1)], { send: 0.4 })
    } },
  { id: 'wind', emoji: '🌬️', cat: 'weather', name: { fr: 'Vent', en: 'Wind' },
    build: (k) => {
      const f1 = k.bp(600, 0.9)
      const g1 = k.g(0.5)
      k.play(B.noise(k.ctx, 'white'), [f1, g1])
      k.lfo(0.07, 380, f1.frequency)
      k.lfo(0.05, 0.3, g1.gain)
      const f2 = k.bp(1500, 2.5)
      const g2 = k.g(0.18)
      k.play(B.noise(k.ctx, 'pink'), [f2, g2])
      k.lfo(0.11, 700, f2.frequency)
      k.lfo(0.13, 0.12, g2.gain)
    } },
  { id: 'tent', emoji: '⛺', cat: 'weather', name: { fr: 'Pluie sur la tente', en: 'Rain on a tent' },
    build: (k) => {
      k.play(B.noise(k.ctx, 'pink'), [k.lp(1800), k.g(0.16)])
      k.play(B.drops(k.ctx, 'tent'), [k.lp(3000), k.g(1.1)])
    } },

  // ——— Nature ———
  { id: 'ocean', emoji: '🌊', cat: 'nature', name: { fr: 'Océan', en: 'Ocean' },
    build: (k) => {
      k.play(B.waves(k.ctx), [k.g(1)])
      k.play(B.noise(k.ctx, 'brown'), [k.lp(200), k.g(0.12)])
    } },
  { id: 'stream', emoji: '🏞️', cat: 'nature', name: { fr: 'Ruisseau', en: 'Stream' },
    build: (k) => {
      k.play(B.noise(k.ctx, 'white'), [k.bp(2600, 0.5), k.g(0.12)])
      const f = k.bp(900, 0.8)
      k.play(B.noise(k.ctx, 'pink'), [f, k.g(0.22)])
      k.lfo(0.2, 150, f.frequency)
      k.play(B.bubbles(k.ctx, true), [k.hp(300), k.g(0.4)])
    } },
  { id: 'waterfall', emoji: '💦', cat: 'nature', name: { fr: 'Cascade', en: 'Waterfall' },
    build: (k) => {
      k.play(B.noise(k.ctx, 'white'), [k.lp(6000), k.g(0.3)])
      k.play(B.noise(k.ctx, 'brown'), [k.g(0.45)])
      k.play(B.noise(k.ctx, 'pink'), [k.bp(1200, 0.4), k.g(0.25)])
    } },
  { id: 'forest', emoji: '🐦', cat: 'nature', name: { fr: 'Oiseaux en forêt', en: 'Forest birds' },
    build: (k) => {
      k.play(B.birds(k.ctx), [k.g(0.85)], { send: 0.35 })
      const f = k.bp(1400, 0.5)
      const g = k.g(0.035)
      k.play(B.noise(k.ctx, 'pink'), [f, g])
      k.lfo(0.08, 0.02, g.gain)
    } },
  { id: 'night', emoji: '🦗', cat: 'nature', name: { fr: "Nuit d'été", en: 'Summer night' },
    build: (k) => {
      k.play(B.crickets(k.ctx), [k.g(0.55)], { send: 0.2 })
      k.play(B.noise(k.ctx, 'brown'), [k.lp(280), k.g(0.1)])
    } },
  { id: 'campfire', emoji: '🔥', cat: 'nature', name: { fr: 'Feu de camp', en: 'Campfire' },
    build: (k) => {
      const g = k.g(0.32)
      k.play(B.noise(k.ctx, 'brown'), [k.lp(650), g])
      k.lfo(0.3, 0.08, g.gain)
      k.play(B.crackle(k.ctx), [k.hp(700), k.g(0.85)])
    } },
  { id: 'underwater', emoji: '🤿', cat: 'nature', name: { fr: "Sous l'eau", en: 'Underwater' },
    build: (k) => {
      const f = k.lp(350)
      k.play(B.noise(k.ctx, 'brown'), [f, k.g(0.7)])
      k.lfo(0.06, 120, f.frequency)
      k.play(B.bubbles(k.ctx), [k.lp(1300), k.g(0.35)])
    } },
  { id: 'whales', emoji: '🐋', cat: 'nature', name: { fr: 'Baleines', en: 'Whales' },
    build: (k) => {
      k.play(B.noise(k.ctx, 'brown'), [k.lp(260), k.g(0.35)])
      k.play(B.whales(k.ctx), [k.g(0.7)], { send: 0.9 })
    } },

  // ——— Intérieur ———
  { id: 'fireplace', emoji: '🪵', cat: 'interior', name: { fr: 'Cheminée', en: 'Fireplace' },
    build: (k) => {
      k.play(B.noise(k.ctx, 'brown'), [k.lp(420), k.g(0.3)])
      k.play(B.crackle(k.ctx, true), [k.bp(1800, 0.5), k.g(0.9)], { send: 0.15 })
    } },
  { id: 'cafe', emoji: '☕', cat: 'interior', name: { fr: 'Café animé', en: 'Busy café' },
    build: (k) => {
      k.play(B.babble(k.ctx), [k.lp(3000), k.g(0.75)], { send: 0.35 })
      k.play(B.clinks(k.ctx), [k.g(0.55)], { send: 0.3 })
      k.play(B.noise(k.ctx, 'brown'), [k.lp(300), k.g(0.06)])
    } },
  { id: 'library', emoji: '📚', cat: 'interior', name: { fr: 'Bibliothèque', en: 'Library' },
    build: (k) => {
      k.play(B.noise(k.ctx, 'brown'), [k.lp(240), k.g(0.09)])
      k.play(B.pages(k.ctx), [k.g(0.7)], { send: 0.4 })
    } },
  { id: 'keyboard', emoji: '⌨️', cat: 'interior', name: { fr: 'Clavier', en: 'Keyboard' },
    build: (k) => { k.play(B.keys(k.ctx), [k.g(0.7)], { send: 0.08 }) } },
  { id: 'clock', emoji: '🕰️', cat: 'interior', name: { fr: 'Tic-tac', en: 'Ticking clock' },
    build: (k) => { k.play(B.tick(k.ctx), [k.g(0.5)], { send: 0.2 }) } },
  { id: 'fan', emoji: '🪭', cat: 'interior', name: { fr: 'Ventilateur', en: 'Room fan' },
    build: (k) => {
      const g = k.g(0.4)
      k.play(B.noise(k.ctx, 'pink'), [k.lp(1400), g])
      k.lfo(6.5, 0.035, g.gain)
      k.route([k.osc('sine', 100), k.g(0.015)])
    } },
  { id: 'aircon', emoji: '❄️', cat: 'interior', name: { fr: 'Climatisation', en: 'Air conditioner' },
    build: (k) => {
      k.play(B.noise(k.ctx, 'brown'), [k.lp(700), k.g(0.45)])
      k.play(B.noise(k.ctx, 'pink'), [k.bp(2000, 0.3), k.g(0.05)])
      k.route([k.osc('sine', 60), k.g(0.014)])
      k.route([k.osc('sine', 120), k.g(0.008)])
    } },
  { id: 'purr', emoji: '🐈', cat: 'interior', name: { fr: 'Ronronnement', en: 'Cat purr' },
    build: (k) => { k.play(B.purr(k.ctx), [k.g(0.9)]) } },
  { id: 'vinyl', emoji: '📀', cat: 'interior', name: { fr: 'Vinyle', en: 'Vinyl crackle' },
    build: (k) => {
      k.play(B.vinyl(k.ctx), [k.g(0.55)])
      k.play(B.noise(k.ctx, 'pink'), [k.hp(3500), k.g(0.035)])
    } },

  // ——— Ville & voyages ———
  { id: 'city', emoji: '🏙️', cat: 'urban', name: { fr: 'Ville', en: 'City' },
    build: (k) => {
      k.play(B.traffic(k.ctx), [k.g(0.7)], { send: 0.15 })
      k.play(B.noise(k.ctx, 'brown'), [k.lp(250), k.g(0.2)])
    } },
  { id: 'train', emoji: '🚆', cat: 'urban', name: { fr: 'Train', en: 'Train' },
    build: (k) => {
      const g = k.g(0.45)
      k.play(B.noise(k.ctx, 'brown'), [k.lp(220), g])
      k.lfo(0.9, 0.05, g.gain)
      k.play(B.trainClacks(k.ctx), [k.g(0.8)])
      k.play(B.noise(k.ctx, 'pink'), [k.bp(3200, 3), k.g(0.025)])
    } },
  { id: 'airplane', emoji: '✈️', cat: 'urban', name: { fr: "Cabine d'avion", en: 'Airplane cabin' },
    build: (k) => {
      k.play(B.noise(k.ctx, 'brown'), [k.lp(450), k.g(0.55)])
      k.play(B.noise(k.ctx, 'pink'), [k.lp(2200), k.g(0.12)])
      k.route([k.osc('sine', 115), k.g(0.01)])
    } },
  { id: 'office', emoji: '🏢', cat: 'urban', name: { fr: 'Open space', en: 'Office' },
    build: (k) => {
      k.play(B.babble(k.ctx, 6), [k.lp(1500), k.g(0.3)], { send: 0.3 })
      k.play(B.keys(k.ctx), [k.g(0.25)], { send: 0.1 })
      k.play(B.noise(k.ctx, 'brown'), [k.lp(600), k.g(0.22)])
    } },

  // ——— Insolite ———
  { id: 'space', emoji: '🪐', cat: 'niche', name: { fr: 'Grondement cosmique', en: 'Cosmic rumble' },
    build: (k) => {
      const f = k.lp(140)
      k.play(B.noise(k.ctx, 'brown'), [f, k.g(0.55)])
      k.lfo(0.04, 60, f.frequency)
      for (const [hz, v] of [[41, 0.05], [55.2, 0.04], [61.7, 0.03], [82.4, 0.015]] as const) {
        const g = k.g(v)
        k.route([k.osc('sine', hz), g], 0.3)
        k.lfo(0.03 + Math.random() * 0.05, v * 0.6, g.gain)
      }
    } },
]

export const SOUND_MAP = new Map(SOUNDS.map((s) => [s.id, s]))

export const SOUND_CATEGORIES: SoundCategory[] = ['focus', 'weather', 'nature', 'interior', 'urban', 'niche']

/** Mixes suggérés (identifiant de son → volume). */
export const PRESETS: { id: string; name: { fr: string; en: string }; sounds: Record<string, number> }[] = [
  { id: 'study-rain', name: { fr: 'Pluie studieuse', en: 'Study rain' }, sounds: { rain: 0.6, brown: 0.3 } },
  { id: 'chalet', name: { fr: 'Chalet', en: 'Mountain cabin' }, sounds: { fireplace: 0.7, 'light-rain': 0.45, wind: 0.25 } },
  { id: 'cafe', name: { fr: 'Café parisien', en: 'Paris café' }, sounds: { cafe: 0.7, rain: 0.25 } },
  { id: 'summer', name: { fr: "Soirée d'été", en: 'Summer evening' }, sounds: { night: 0.6, stream: 0.35 } },
  { id: 'deep', name: { fr: 'Plongée', en: 'Deep dive' }, sounds: { underwater: 0.6, whales: 0.5 } },
  { id: 'library-storm', name: { fr: "Bibliothèque sous l'orage", en: 'Library in a storm' }, sounds: { library: 0.6, storm: 0.4 } },
  { id: 'night-train', name: { fr: 'Train de nuit', en: 'Night train' }, sounds: { train: 0.65, rain: 0.3 } },
  { id: 'deep-focus', name: { fr: 'Concentration profonde', en: 'Deep focus' }, sounds: { brown: 0.5, 'bin-beta': 0.35 } },
]
