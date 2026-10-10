export interface FontDef {
  id: string
  label: string
  family: string
  /** Paramètre « family= » de Google Fonts. */
  query: string
  weight: number
  tracking?: string
}

export const FONTS: FontDef[] = [
  { id: 'outfit', label: 'Outfit', family: "'Outfit', sans-serif", query: 'Outfit:wght@300;500;700', weight: 500 },
  { id: 'grotesk', label: 'Space Grotesk', family: "'Space Grotesk', sans-serif", query: 'Space+Grotesk:wght@500;700', weight: 600 },
  { id: 'inter', label: 'Inter', family: "'Inter', sans-serif", query: 'Inter:wght@300;600', weight: 300, tracking: '-0.04em' },
  { id: 'mono', label: 'JetBrains Mono', family: "'JetBrains Mono', monospace", query: 'JetBrains+Mono:wght@400;700', weight: 400, tracking: '-0.05em' },
  { id: 'playfair', label: 'Playfair', family: "'Playfair Display', serif", query: 'Playfair+Display:wght@500;700', weight: 500 },
  { id: 'fraunces', label: 'Fraunces', family: "'Fraunces', serif", query: 'Fraunces:wght@300;600', weight: 300 },
  { id: 'fredoka', label: 'Fredoka', family: "'Fredoka', sans-serif", query: 'Fredoka:wght@500;700', weight: 600 },
  { id: 'quicksand', label: 'Quicksand', family: "'Quicksand', sans-serif", query: 'Quicksand:wght@500;700', weight: 600 },
  { id: 'bebas', label: 'Bebas Neue', family: "'Bebas Neue', sans-serif", query: 'Bebas+Neue', weight: 400, tracking: '0.02em' },
  { id: 'unbounded', label: 'Unbounded', family: "'Unbounded', sans-serif", query: 'Unbounded:wght@500;800', weight: 700 },
  { id: 'orbitron', label: 'Orbitron', family: "'Orbitron', sans-serif", query: 'Orbitron:wght@500;800', weight: 600 },
  { id: 'vt323', label: 'VT323', family: "'VT323', monospace", query: 'VT323', weight: 400, tracking: '0' },
]

export const FONT_MAP = new Map(FONTS.map((f) => [f.id, f]))

const loaded = new Set<string>(['outfit'])

export function loadFont(id: string) {
  if (loaded.has(id)) return
  const f = FONT_MAP.get(id)
  if (!f) return
  loaded.add(id)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${f.query}&display=swap`
  document.head.appendChild(link)
}

export function loadAllFonts() {
  for (const f of FONTS) loadFont(f.id)
}
