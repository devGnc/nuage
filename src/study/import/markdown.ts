import type { StudyItem } from '../types'
import { normKey, stableHash } from './text'

/** Texte d'un titre Markdown sans les marques de mise en forme. */
function plain(s: string): string {
  return s
    .replace(/\*\*|__|`/g, '')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/(^|[\s(])_([^_\n]+)_/g, '$1$2')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .trim()
}

/** Retire les guillemets qui entourent une expression : « "¡Hola!" » → « ¡Hola! »,
 *  « "Gracias" / "Muchas gracias" » → « Gracias / Muchas gracias ». */
function unquote(s: string): string {
  return s
    .replace(/["“”«»]\s*\/\s*["“”«»]/g, ' / ')
    .replace(/^["“”«»'‘’]+\s*/, '')
    .replace(/\s*["“”«»'‘’]+$/, '')
    .trim()
}

/** Lignes de liste « espagnol : français » (ou « — », « = »), le titre le plus proche servant de thème.
 *  Exemple : « - **"¿Qué tal?"** : Comment ça va ? ». */
export function markdownToCards(md: string, fileName: string, subject = 'es', now = Date.now()): StudyItem[] {
  const out: StudyItem[] = []
  const seen = new Set<string>()
  let topic: string | null = null
  let inCode = false
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim()
    if (line.startsWith('```')) {
      inCode = !inCode
      continue
    }
    if (inCode || line.startsWith('|')) continue
    const h = /^#{1,6}\s+(.*)$/.exec(line)
    if (h) {
      topic = plain(h[1]) || topic
      continue
    }
    const li = /^(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line)
    if (!li) continue
    let body = li[1]
    // « **recto** : verso » : le recto en gras, éventuellement entre guillemets
    let front = ''
    let back = ''
    const bold = /^\*\*(.+?)\*\*\s*(?:[:=]|[—–-])\s*(.+)$/.exec(body)
    if (bold && !/[:：]\s*$/.test(bold[1])) {
      front = bold[1]
      back = bold[2]
    } else {
      const m = /^(.+?)\s+(?::|=|—|–)\s+(.+)$/.exec(body)
      if (!m) continue
      front = m[1]
      back = m[2]
    }
    front = unquote(plain(front))
    back = plain(back)
    body = ''
    if (!front || !back || front.length > 160) continue
    const id = `md:${stableHash(normKey(front) + '|' + normKey(back))}`
    if (seen.has(id)) continue
    seen.add(id)
    // une expression se reconnaît à sa ponctuation ou à sa longueur ; « El resultado neto » reste du vocabulaire
    const isPhrase = /[¿?¡!.…]/.test(front) || front.split(/\s+/).length >= 4
    out.push({
      id, subject, kind: isPhrase ? 'phrase' : 'vocab', front, back, example: null, topic, source: 'markdown',
      extra: { deck: fileName }, createdAt: now + out.length, updatedAt: now, deletedAt: null,
    })
  }
  return out
}

/** Une fiche par section de niveau 2 (ou 1 s'il n'y en a pas). La partie avant la première section
 *  devient une fiche d'introduction si elle contient du texte. */
export function markdownToNotes(md: string, fileName: string, subject = 'es', now = Date.now()): StudyItem[] {
  const lines = md.split(/\r?\n/)
  const level = lines.some((l) => /^##\s/.test(l)) ? 2 : 1
  const title = plain(lines.find((l) => /^#\s/.test(l))?.replace(/^#\s+/, '') ?? '') || fileName.replace(/\.[^.]+$/, '')
  const sections: { heading: string; body: string[] }[] = [{ heading: title, body: [] }]
  const re = level === 2 ? /^##\s+(.*)$/ : /^#\s+(.*)$/
  for (const l of lines) {
    const m = re.exec(l)
    if (m) sections.push({ heading: plain(m[1]), body: [] })
    else if (!(level === 2 && /^#\s/.test(l))) sections[sections.length - 1].body.push(l)
  }
  const out: StudyItem[] = []
  for (const s of sections) {
    const body = s.body.join('\n').replace(/^\s*(---\s*)+/, '').trim()
    // l'introduction avant la première section n'est gardée que si elle dit vraiment quelque chose
    if (body.replace(/[-*#\s]/g, '').length < (s === sections[0] ? 200 : 40)) continue
    out.push({
      id: `md-note:${stableHash(normKey(title) + '|' + normKey(s.heading))}`,
      subject, kind: 'note', front: s.heading, back: body, example: null, topic: title, source: 'markdown',
      extra: { deck: fileName }, createdAt: now + out.length, updatedAt: now, deletedAt: null,
    })
  }
  return out
}
