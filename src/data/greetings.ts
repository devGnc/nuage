import { hashString } from '../lib/id'
import { dayKey } from '../lib/time'
import type { Lang } from '../types'

type Part = 'morning' | 'afternoon' | 'evening' | 'night'

const G: Record<Lang, Record<Part, string[]> & { monday: string; friday: string; saturday: string; sunday: string }> = {
  fr: {
    morning: ['Bonjour, {name}.', 'Belle matinée, {name}.', "Un café et c'est parti, {name} ?", 'Le jour se lève, {name}.', "Une belle journée t'attend, {name}."],
    afternoon: ['Bon après-midi, {name}.', 'On garde le rythme, {name}.', 'La journée avance bien, {name}.', 'Encore un petit effort, {name}.'],
    evening: ['Bonsoir, {name}.', 'Belle soirée, {name}.', 'On termine en douceur, {name}.', 'Dernière ligne droite, {name}.'],
    night: ['Il se fait tard, {name}.', 'Bonne nuit, {name}.', 'Pense à te reposer, {name}.', 'Les étoiles veillent, {name}.'],
    monday: 'Nouvelle semaine, nouveaux objectifs, {name}.',
    friday: 'Le week-end approche, {name} !',
    saturday: 'Bon samedi, {name}.',
    sunday: 'Dimanche tranquille, {name} ?',
  },
  en: {
    morning: ['Good morning, {name}.', 'Lovely morning, {name}.', 'Coffee first, then let’s go, {name}?', 'Rise and shine, {name}.', 'A good day awaits, {name}.'],
    afternoon: ['Good afternoon, {name}.', 'Keep the rhythm going, {name}.', 'The day is going well, {name}.', 'One more push, {name}.'],
    evening: ['Good evening, {name}.', 'Have a lovely evening, {name}.', 'Wrapping up gently, {name}.', 'Home stretch, {name}.'],
    night: ["It's getting late, {name}.", 'Good night, {name}.', 'Remember to rest, {name}.', 'The stars are out, {name}.'],
    monday: 'New week, new goals, {name}.',
    friday: 'The weekend is almost here, {name}!',
    saturday: 'Happy Saturday, {name}.',
    sunday: 'Slow Sunday, {name}?',
  },
}

export function dayPart(d: Date): Part {
  const h = d.getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 18) return 'afternoon'
  if (h >= 18 && h < 22) return 'evening'
  return 'night'
}

const fill = (s: string, name: string) => (name.trim() ? s.replace('{name}', name.trim()) : s.replace(/,? ?\{name\}/, ''))

export function greeting(lang: Lang, mode: 'dynamic' | 'generic', name: string, now = new Date()): string {
  const part = dayPart(now)
  const g = G[lang]
  if (mode === 'generic') {
    const base = { fr: { morning: 'Bonjour', afternoon: 'Bon après-midi', evening: 'Bonsoir', night: 'Bonne nuit' }, en: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', night: 'Good night' } }[lang][part]
    return name.trim() ? `${base}, ${name.trim()}.` : `${base}.`
  }
  const seed = hashString(dayKey(now) + part)
  const dow = now.getDay()
  if (seed % 2 === 0) {
    if (dow === 1 && part === 'morning') return fill(g.monday, name)
    if (dow === 5 && part !== 'morning') return fill(g.friday, name)
    if (dow === 6 && part !== 'night') return fill(g.saturday, name)
    if (dow === 0 && part !== 'night') return fill(g.sunday, name)
  }
  const list = g[part]
  return fill(list[seed % list.length], name)
}
