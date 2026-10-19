/** Correction des réponses écrites : on ignore majuscules, ponctuation et espaces ;
 *  un accent oublié ou une petite faute de frappe est acceptée, mais signalée. */

export type Verdict = 'right' | 'accent' | 'typo' | 'wrong'

const PUNCT = /[¿?¡!.,;:«»"“”()…—–\-/]/g

export function normalize(s: string): string {
  return s.normalize('NFC').toLowerCase().replace(/[’']/g, "'").replace(PUNCT, ' ').replace(/\s+/g, ' ').trim()
}

/** Retire les accents aigus et le tréma, mais garde le ñ : « año » et « ano » sont deux mots différents. */
export function stripAccents(s: string): string {
  return s.replace(/[áàâ]/g, 'a').replace(/[éèê]/g, 'e').replace(/[íìî]/g, 'i').replace(/[óòô]/g, 'o').replace(/[úùûü]/g, 'u')
}

function distance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 1) return 2
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return prev[b.length]
}

export function checkAnswer(input: string, accepted: string[], tolerant = true): { verdict: Verdict; expected: string } {
  const got = normalize(input)
  const expected = accepted[0] ?? ''
  if (!got) return { verdict: 'wrong', expected }
  const norm = accepted.map(normalize)
  if (norm.includes(got)) return { verdict: 'right', expected }
  if (!tolerant) return { verdict: 'wrong', expected }
  const bare = stripAccents(got)
  const i = norm.findIndex((a) => stripAccents(a) === bare)
  if (i >= 0) return { verdict: 'accent', expected: accepted[i] }
  // une lettre de trop, de moins ou différente, sur une réponse assez longue
  const j = norm.findIndex((a) => a.length >= 6 && distance(stripAccents(a), bare) === 1)
  if (j >= 0) return { verdict: 'typo', expected: accepted[j] }
  return { verdict: 'wrong', expected }
}

/** Mélange stable : le même exercice garde le même ordre pendant toute la leçon. */
export function shuffled<T>(list: T[], seed: string): T[] {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const k = Math.floor(rand() * (i + 1))
    ;[out[i], out[k]] = [out[k], out[i]]
  }
  return out
}
