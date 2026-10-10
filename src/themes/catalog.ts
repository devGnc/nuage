export type ThemeCat = 'gradients' | 'minimal' | 'abstract' | 'animated' | 'photos'
export type AnimKind = 'clouds' | 'stars' | 'aurora' | 'lava' | 'snow' | 'fireflies' | 'rain' | 'waves' | 'bokeh' | 'flow'

export interface ThemeDef {
  id: string
  cat: ThemeCat
  name: { fr: string; en: string }
  /** Fond CSS (sert aussi d'aperçu et de repli pour les thèmes animés). */
  bg: string
  size?: string
  anim?: AnimKind
  photo?: { id: number; author: string }
  ink?: 'dark'
}

const n = (fr: string, en = fr) => ({ fr, en })

const mesh = (base: string, ...spots: string[]) => [...spots.map((s) => s), base].join(', ')

const GRADIENTS: ThemeDef[] = [
  { id: 'aube', cat: 'gradients', name: n('Aube', 'Dawn'), bg: mesh('linear-gradient(160deg, #11122e 0%, #2b2266 45%, #c2697a 80%, #f6b38a 100%)', 'radial-gradient(60% 50% at 85% 90%, rgba(255,190,140,.75), transparent 70%)', 'radial-gradient(50% 40% at 15% 20%, rgba(120,110,255,.35), transparent 70%)') },
  { id: 'lagon', cat: 'gradients', name: n('Lagon', 'Lagoon'), bg: mesh('linear-gradient(150deg, #032b3f 0%, #05607a 45%, #1fb5b0 80%, #9be7d8 100%)', 'radial-gradient(50% 50% at 80% 20%, rgba(130,240,255,.35), transparent 70%)') },
  { id: 'lavande', cat: 'gradients', name: n('Lavande', 'Lavender'), bg: mesh('linear-gradient(160deg, #2a2050 0%, #6b5bb8 50%, #c7a8e8 85%, #f1d4f0 100%)', 'radial-gradient(40% 40% at 20% 85%, rgba(255,170,220,.45), transparent 70%)') },
  { id: 'braise', cat: 'gradients', name: n('Braise', 'Ember'), bg: mesh('linear-gradient(165deg, #150707 0%, #4a0f12 40%, #b0331d 75%, #f2913a 100%)', 'radial-gradient(45% 40% at 70% 95%, rgba(255,170,60,.6), transparent 70%)') },
  { id: 'menthe', cat: 'gradients', name: n('Menthe', 'Mint'), bg: mesh('linear-gradient(150deg, #0b2b26 0%, #16695a 50%, #5fc7a3 85%, #c9f2df 100%)', 'radial-gradient(45% 45% at 85% 15%, rgba(200,255,230,.3), transparent 70%)') },
  { id: 'minuit', cat: 'gradients', name: n('Minuit', 'Midnight'), bg: mesh('linear-gradient(180deg, #05060f 0%, #0b1030 60%, #16205a 100%)', 'radial-gradient(60% 40% at 50% 110%, rgba(90,120,255,.45), transparent 70%)') },
  { id: 'peche', cat: 'gradients', name: n('Pêche', 'Peach'), bg: mesh('linear-gradient(160deg, #6d3b5c 0%, #d57a7a 45%, #f6b48f 80%, #ffe0c2 100%)', 'radial-gradient(45% 40% at 15% 15%, rgba(120,70,160,.4), transparent 70%)') },
  { id: 'abysses', cat: 'gradients', name: n('Abysses', 'Deep sea'), bg: mesh('linear-gradient(180deg, #0a3d62 0%, #062a46 40%, #03152b 80%, #010812 100%)', 'radial-gradient(50% 30% at 50% 0%, rgba(80,200,255,.35), transparent 70%)') },
  { id: 'boreale', cat: 'gradients', name: n('Boréale', 'Boreal'), bg: mesh('linear-gradient(180deg, #030914 0%, #08203a 55%, #0c3b4a 100%)', 'radial-gradient(70% 30% at 30% 30%, rgba(80,255,170,.35), transparent 70%)', 'radial-gradient(60% 30% at 75% 40%, rgba(170,90,255,.3), transparent 70%)') },
  { id: 'sorbet', cat: 'gradients', name: n('Sorbet'), bg: mesh('linear-gradient(135deg, #ff7eb3 0%, #ff9e7a 40%, #ffd36e 100%)', 'radial-gradient(50% 50% at 20% 80%, rgba(255,90,170,.5), transparent 70%)') },
  { id: 'ardoise', cat: 'gradients', name: n('Ardoise', 'Slate'), bg: mesh('linear-gradient(160deg, #1b1f27 0%, #2c3440 55%, #4a5566 100%)', 'radial-gradient(50% 40% at 80% 20%, rgba(160,180,210,.2), transparent 70%)') },
  { id: 'dune', cat: 'gradients', name: n('Dune'), bg: mesh('linear-gradient(170deg, #3b2a22 0%, #8a5a3c 45%, #d4a373 80%, #f1d6ad 100%)', 'radial-gradient(50% 35% at 75% 15%, rgba(255,230,190,.35), transparent 70%)') },
  { id: 'cerise', cat: 'gradients', name: n('Cerise', 'Cherry'), bg: mesh('linear-gradient(155deg, #2a0614 0%, #7a1035 45%, #d43f6b 80%, #ff9bb3 100%)', 'radial-gradient(40% 40% at 80% 85%, rgba(255,150,190,.45), transparent 70%)') },
  { id: 'foret', cat: 'gradients', name: n('Forêt', 'Forest'), bg: mesh('linear-gradient(170deg, #07140d 0%, #12321f 50%, #2e6b42 85%, #78a85c 100%)', 'radial-gradient(45% 35% at 30% 10%, rgba(200,255,170,.2), transparent 70%)') },
  { id: 'coton', cat: 'gradients', name: n('Coton', 'Cotton'), ink: 'dark', bg: mesh('linear-gradient(135deg, #e8f0ff 0%, #f5e6ff 50%, #ffe4ec 100%)', 'radial-gradient(45% 45% at 20% 25%, rgba(170,200,255,.8), transparent 70%)', 'radial-gradient(45% 45% at 80% 80%, rgba(255,190,220,.8), transparent 70%)') },
  { id: 'neon', cat: 'gradients', name: n('Néon', 'Neon'), bg: mesh('linear-gradient(180deg, #08020f 0%, #12051f 100%)', 'radial-gradient(45% 40% at 20% 30%, rgba(255,0,170,.45), transparent 70%)', 'radial-gradient(45% 40% at 80% 70%, rgba(0,220,255,.4), transparent 70%)') },
  { id: 'brume', cat: 'gradients', name: n('Brume', 'Mist'), bg: mesh('linear-gradient(180deg, #2c3a4a 0%, #5b7088 55%, #9db1c4 100%)', 'radial-gradient(70% 30% at 50% 60%, rgba(230,240,255,.25), transparent 70%)') },
  { id: 'crepuscule', cat: 'gradients', name: n('Crépuscule', 'Dusk'), bg: mesh('linear-gradient(180deg, #1c1340 0%, #5b2a6e 40%, #c9495b 75%, #f7a254 100%)', 'radial-gradient(60% 30% at 50% 100%, rgba(255,200,110,.5), transparent 70%)') },
  { id: 'glacier', cat: 'gradients', name: n('Glacier'), ink: 'dark', bg: mesh('linear-gradient(170deg, #f5fbff 0%, #d6ecfa 50%, #a9d3ee 100%)', 'radial-gradient(50% 40% at 80% 20%, rgba(255,255,255,.9), transparent 70%)') },
  { id: 'encre', cat: 'gradients', name: n('Encre', 'Ink'), bg: mesh('linear-gradient(160deg, #070b1a 0%, #111a3a 60%, #1f2d63 100%)', 'radial-gradient(40% 40% at 85% 15%, rgba(120,140,255,.3), transparent 70%)') },
  { id: 'opale', cat: 'gradients', name: n('Opale', 'Opal'), bg: mesh('linear-gradient(140deg, #4f6cbf 0%, #8f7ad6 35%, #e39ad0 65%, #ffd1a6 100%)', 'radial-gradient(50% 50% at 15% 85%, rgba(130,230,255,.5), transparent 70%)') },
  { id: 'kyoto', cat: 'gradients', name: n('Kyoto'), bg: mesh('linear-gradient(170deg, #20121c 0%, #5c2b3e 45%, #c8737b 80%, #f3c7c0 100%)', 'radial-gradient(40% 40% at 80% 20%, rgba(255,210,220,.4), transparent 70%)') },
]

const MINIMAL: ThemeDef[] = [
  { id: 'noir', cat: 'minimal', name: n('Noir'), bg: 'radial-gradient(80% 60% at 50% 40%, #16171c 0%, #08080a 100%)' },
  { id: 'graphite', cat: 'minimal', name: n('Graphite'), bg: '#24262b' },
  { id: 'marine', cat: 'minimal', name: n('Marine', 'Navy'), bg: '#111c33' },
  { id: 'sauge', cat: 'minimal', name: n('Sauge', 'Sage'), bg: '#5d7363' },
  { id: 'terracotta', cat: 'minimal', name: n('Terracotta'), bg: '#a65a3f' },
  { id: 'papier', cat: 'minimal', name: n('Papier', 'Paper'), ink: 'dark', bg: '#f3efe7' },
  { id: 'blanc', cat: 'minimal', name: n('Blanc', 'White'), ink: 'dark', bg: 'radial-gradient(80% 60% at 50% 40%, #ffffff 0%, #eceef2 100%)' },
]

const ABSTRACT: ThemeDef[] = [
  { id: 'ondes', cat: 'abstract', name: n('Ondes', 'Ripples'), bg: 'repeating-radial-gradient(circle at 50% 120%, rgba(255,255,255,.07) 0 2px, transparent 2px 38px), linear-gradient(180deg, #1a1c4a, #4a2f7a 60%, #b5558a)' },
  { id: 'prisme', cat: 'abstract', name: n('Prisme', 'Prism'), bg: 'conic-gradient(from 210deg at 60% 40%, #3a2b8c, #7a4fd1, #e46aa8, #ffb27a, #6ad1e4, #3a2b8c)' },
  { id: 'grille', cat: 'abstract', name: n('Grille', 'Grid'), size: '48px 48px, 48px 48px, auto', bg: 'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(160deg, #0d1330, #1d2b6b)' },
  { id: 'pois', cat: 'abstract', name: n('Pois', 'Dots'), size: '26px 26px, auto', bg: 'radial-gradient(rgba(255,255,255,.12) 1.5px, transparent 1.6px), linear-gradient(150deg, #2b1d3f, #4b2d5e 50%, #7d3c62)' },
  { id: 'rayons', cat: 'abstract', name: n('Rayons', 'Sunburst'), bg: 'repeating-conic-gradient(from 0deg at 50% 110%, rgba(255,255,255,.06) 0 6deg, transparent 6deg 12deg), linear-gradient(180deg, #ff9966, #ff5e62 50%, #6b2a5c)' },
  { id: 'soie', cat: 'abstract', name: n('Soie', 'Silk'), bg: 'radial-gradient(60% 80% at 0% 50%, #f7c6d9 0%, transparent 60%), radial-gradient(60% 80% at 100% 30%, #b9c6ff 0%, transparent 60%), radial-gradient(70% 60% at 50% 100%, #ffe1c4 0%, transparent 60%), #e9d7f0', ink: 'dark' },
  { id: 'crt', cat: 'abstract', name: n('CRT'), bg: 'repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0 2px, transparent 2px 4px), radial-gradient(70% 60% at 50% 50%, #12402a 0%, #04140c 100%)' },
  { id: 'damier', cat: 'abstract', name: n('Damier', 'Checker'), size: '64px 64px, auto', bg: 'conic-gradient(rgba(255,255,255,.05) 25%, transparent 0 50%, rgba(255,255,255,.05) 0 75%, transparent 0), linear-gradient(160deg, #102a2e, #1f4d4a)' },
  { id: 'horizon', cat: 'abstract', name: n('Horizon'), bg: 'linear-gradient(180deg, transparent 55%, rgba(255,255,255,.08) 55.2%, transparent 55.6%), radial-gradient(30% 20% at 50% 55%, rgba(255,210,150,.8), transparent 70%), linear-gradient(180deg, #1a1440 0%, #6a3a7a 45%, #f09a6a 55%, #2a1c3a 56%, #120c22 100%)' },
  { id: 'rubans', cat: 'abstract', name: n('Rubans', 'Ribbons'), bg: 'linear-gradient(115deg, transparent 30%, rgba(255,140,200,.35) 30% 38%, transparent 38% 52%, rgba(140,200,255,.3) 52% 60%, transparent 60%), linear-gradient(160deg, #1b1538, #2f2363)' },
]

const ANIMATED: ThemeDef[] = [
  { id: 'a-nuages', cat: 'animated', anim: 'clouds', name: n('Nuages', 'Clouds'), bg: 'linear-gradient(180deg, #4b6cb7 0%, #8fb3e8 55%, #f3d1c4 100%)' },
  { id: 'a-nuages-soir', cat: 'animated', anim: 'clouds', name: n('Nuages du soir', 'Evening clouds'), bg: 'linear-gradient(180deg, #2a1d4f 0%, #8a4b7d 50%, #f2a07b 100%)' },
  { id: 'a-etoiles', cat: 'animated', anim: 'stars', name: n('Ciel étoilé', 'Starry sky'), bg: 'radial-gradient(80% 50% at 50% 110%, #1d2a5c 0%, transparent 70%), linear-gradient(180deg, #02030a 0%, #080d24 100%)' },
  { id: 'a-aurore', cat: 'animated', anim: 'aurora', name: n('Aurore boréale', 'Northern lights'), bg: 'linear-gradient(180deg, #020611 0%, #061a2c 60%, #0b2a3a 100%)' },
  { id: 'a-lave', cat: 'animated', anim: 'lava', name: n('Lampe à lave', 'Lava lamp'), bg: 'linear-gradient(160deg, #1a0b2e, #3b0f3f)' },
  { id: 'a-neige', cat: 'animated', anim: 'snow', name: n('Neige', 'Snowfall'), bg: 'linear-gradient(180deg, #0f1a2e 0%, #2a3b5c 60%, #6c7fa3 100%)' },
  { id: 'a-lucioles', cat: 'animated', anim: 'fireflies', name: n('Lucioles', 'Fireflies'), bg: 'radial-gradient(70% 50% at 50% 110%, #12301e 0%, transparent 70%), linear-gradient(180deg, #050b10 0%, #0b1a14 100%)' },
  { id: 'a-pluie', cat: 'animated', anim: 'rain', name: n('Pluie', 'Rain'), bg: 'linear-gradient(180deg, #121a26 0%, #1f2e40 60%, #34475e 100%)' },
  { id: 'a-vagues', cat: 'animated', anim: 'waves', name: n('Vagues', 'Waves'), bg: 'linear-gradient(180deg, #ffb48a 0%, #e56b7a 35%, #5a3f7a 60%, #1c2a52 100%)' },
  { id: 'a-bokeh', cat: 'animated', anim: 'bokeh', name: n('Bokeh'), bg: 'linear-gradient(160deg, #10162f, #2b1d4a 60%, #4a2343)' },
  { id: 'a-flux', cat: 'animated', anim: 'flow', name: n('Dégradé fluide', 'Fluid gradient'), size: '400% 400%', bg: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)' },
]

const PHOTO_LIST: [number, string, string, string][] = [
  [38, 'Allyson Souza', 'Au-dessus des nuages', 'Above the clouds'],
  [10, 'Paul Jarvis', 'Lac forestier', 'Forest lake'],
  [11, 'Paul Jarvis', 'Vallée brumeuse', 'Misty valley'],
  [15, 'Paul Jarvis', 'Torrent', 'Mountain stream'],
  [16, 'Paul Jarvis', 'Îles bleues', 'Blue islands'],
  [17, 'Paul Jarvis', 'Sentier en forêt', 'Forest path'],
  [28, 'Jerry Adney', 'Sous-bois', 'Forest creek'],
  [29, 'Go Wild', 'Sommets', 'Peaks'],
  [46, 'Jeffrey Kam', 'Désert', 'Desert'],
  [49, 'Margaret Barley', 'Village blanc', 'White village'],
  [54, 'Nicholas Swanson', "Ciel d'été", 'Summer sky'],
  [62, 'Daniel Genser', 'Soleil couchant', 'Setting sun'],
  [74, 'Isaak Dury', 'Baie', 'Bay'],
  [77, 'May Pamintuan', 'Ponton', 'Jetty'],
  [122, 'Vadim Sherbakov', 'Lac de nuit', 'Lake at night'],
  [128, 'Matteo Minelli', 'Lac paisible', 'Still lake'],
  [162, 'Dillon McIntosh', 'Côte vue du ciel', 'Coast from above'],
  [165, 'Linh Nguyen', 'Plage au crépuscule', 'Beach at dusk'],
  [184, 'Tim de Groot', 'Dunes', 'Dunes'],
  [213, 'Kelly Sikkema', "Mer à l'aube", 'Sea at dawn'],
  [229, 'Orlova Maria', 'Forêt dans la brume', 'Misty forest'],
  [235, 'Paul E. Harrer', 'Montagne', 'Mountain'],
  [249, 'Anders Jildén', 'Pont la nuit', 'Bridge at night'],
  [287, 'Aleksandra Boguslawska', 'Collines vertes', 'Green hills'],
  [289, 'Jennifer Langley', "Parc à l'automne", 'Autumn park'],
  [296, 'Greg Shield', 'Alpes', 'Alps'],
  [302, 'Billy Lam', 'Horizon marin', 'Sea horizon'],
]

export const photoUrl = (id: number, w = 1920, h = 1080) => `https://picsum.photos/id/${id}/${w}/${h}.webp`

const PHOTOS: ThemeDef[] = PHOTO_LIST.map(([id, author, fr, en]) => ({
  id: `p-${id}`,
  cat: 'photos',
  name: n(fr, en),
  photo: { id, author },
  bg: `#1c1f2b url(${photoUrl(id)}) center / cover no-repeat`,
}))

export const THEMES: ThemeDef[] = [...GRADIENTS, ...MINIMAL, ...ABSTRACT, ...ANIMATED, ...PHOTOS]
export const THEME_MAP = new Map(THEMES.map((t) => [t.id, t]))
export const THEME_CATS: ThemeCat[] = ['gradients', 'minimal', 'abstract', 'animated', 'photos']

export const YT_PREFIX = 'yt:'
export const URL_PREFIX = 'url:'
export const UPLOAD_ID = 'upload'

export function randomTheme(category: string, exclude?: string): string {
  const pool = THEMES.filter((t) => (category === 'all' || t.cat === category) && t.id !== exclude)
  return pool[Math.floor(Math.random() * pool.length)]?.id ?? 'aube'
}
