import type { ItemExtra } from '../types'

const ENTITIES: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", laquo: '«', raquo: '»', hellip: '…', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' }

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : m
    }
    return ENTITIES[e.toLowerCase()] ?? m
  })
}

/** Texte d'un champ Anki : sans balises, sans sons ni images, espaces normalisés. */
export function cleanField(html: string): string {
  return decodeEntities(
    html
      .replace(/\[sound:[^\]]*\]/g, ' ')
      .replace(/<img[^>]*>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/(div|p|li)>/gi, ' ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim()
}

/** Un champ qui ne contient qu'une image ou un son. */
export function isMediaOnly(html: string): boolean {
  return /\[sound:|<img/i.test(html) && cleanField(html) === ''
}

const POS = new Set(['adj', 'adv', 'art', 'conj', 'interj', 'n', 'nc', 'nf', 'nm', 'nm/f', 'nmf', 'nf/m', 'num', 'prep', 'pron', 'v', 'vi', 'vt', 'vr', 'aux'])

/** « absoluto (adj) » → mot « absoluto », catégorie « adj ». Les noms donnent aussi leur genre.
 *  Une précision entre crochets après la catégorie est gardée à part : « me (pron) [also mí] ». */
export function splitPos(text: string): { text: string; pos?: string; gender?: ItemExtra['gender']; note?: string } {
  // première parenthèse qui contient une catégorie connue (« preocupar(se) (v) » : c'est « (v) »)
  for (const m of text.matchAll(/\(([a-z/ ]{1,8})\)/gi)) {
    const pos = m[1].replace(/\s+/g, '').toLowerCase()
    if (!POS.has(pos)) continue
    const word = text.slice(0, m.index).trim()
    const rest = text.slice((m.index ?? 0) + m[0].length).trim()
    if (!word) return { text }
    let note: string | undefined
    if (rest) {
      // « [also mí] », « ; de acuerdo », « : al revés », « (valer la pena) » : une précision ou une expression, gardée à part
      const br = /^\[(.+)\]$/.exec(rest) ?? /^[;,:]\s*(.+?)[:;]?$/.exec(rest) ?? /^\((.+)\)$/.exec(rest)
      if (br) note = br[1].trim()
      else if (normKey(rest) !== normKey(word)) return { text }
    }
    const gender = pos === 'nm' ? 'm' : pos === 'nf' ? 'f' : pos === 'nm/f' || pos === 'nmf' || pos === 'nf/m' ? 'mf' : undefined
    return { text: word, pos, ...(gender ? { gender } : {}), ...(note ? { note } : {}) }
  }
  return { text }
}

/** Retire la catégorie répétée en fin de traduction : « current (adj) » → « current ». */
export function stripTrailingPos(text: string, pos?: string): string {
  if (!pos) return text
  const r = splitPos(text)
  return r.pos ? r.text : text
}

/** Hash stable (53 bits) en base 36 : identifiants qui ne changent pas d'un import à l'autre. */
export function stableHash(s: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

/** Clé de comparaison : minuscules, sans accents ni ponctuation, pour repérer les doublons. */
export function normKey(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}
