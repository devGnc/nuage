import type { SqlJsStatic } from 'sql.js'
import type { StudyItem } from '../types'
import { cleanField, isMediaOnly, splitPos, stripTrailingPos } from './text'

/** Lecture d'un paquet Anki (.apkg) directement dans le navigateur : rien n'est envoyé nulle part.
 *  Un .apkg est une archive zip qui contient une base SQLite ; images et sons sont ignorés. */

export interface AnkiNote {
  guid: string
  fields: string[]
  tags: string[]
}

export interface AnkiDeck {
  name: string
  fieldNames: string[]
  notes: AnkiNote[]
}

export interface AnkiMapping {
  front: number
  back: number
  example: number | null
  rank: number | null
}

export class AnkiFormatError extends Error {}

async function unzipCollection(bytes: Uint8Array): Promise<Uint8Array> {
  const { unzip } = await import('fflate')
  const files = await new Promise<Record<string, Uint8Array>>((resolve, reject) =>
    unzip(bytes, { filter: (f) => /^collection\.anki2(1b?)?$/.test(f.name) }, (err, data) => (err ? reject(err) : resolve(data))),
  )
  // les exports récents contiennent un collection.anki2 factice (« mettez Anki à jour ») à côté du vrai collection.anki21
  const db = files['collection.anki21'] ?? files['collection.anki2']
  if (db) return db
  if (files['collection.anki21b']) throw new AnkiFormatError('compressed')
  throw new AnkiFormatError('notApkg')
}

/** Lit les notes du paquet, avec les noms de leurs champs (on prend le type de note le plus utilisé). */
export async function readApkg(file: Blob): Promise<AnkiDeck> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const dbBytes = await unzipCollection(bytes)
  const [{ default: initSqlJs }, { default: wasmUrl }] = await Promise.all([import('sql.js'), import('sql.js/dist/sql-wasm.wasm?url')])
  const SQL = await initSqlJs({ locateFile: () => wasmUrl })
  const fallback = typeof File !== 'undefined' && file instanceof File ? file.name.replace(/\.apkg$/i, '') : ''
  return parseCollection(SQL, dbBytes, fallback)
}

export { unzipCollection }

/** Lit la base SQLite d'un paquet (séparé de readApkg pour pouvoir le tester hors navigateur). */
export function parseCollection(SQL: SqlJsStatic, dbBytes: Uint8Array, fallbackName: string): AnkiDeck {
  const db = new SQL.Database(dbBytes)
  try {
    const rows = db.exec('select guid, mid, flds, tags from notes')[0]?.values ?? []
    if (!rows.length) throw new AnkiFormatError('empty')
    // type de note le plus fréquent
    const byModel = new Map<string, number>()
    for (const r of rows) byModel.set(String(r[1]), (byModel.get(String(r[1])) ?? 0) + 1)
    const mid = [...byModel.entries()].sort((a, b) => b[1] - a[1])[0][0]

    let fieldNames: string[] = []
    let name = ''
    const col = db.exec('select models, decks from col')[0]?.values?.[0]
    if (col && typeof col[0] === 'string' && col[0].length > 2) {
      const models = JSON.parse(col[0]) as Record<string, { flds: { name: string; ord: number }[] }>
      fieldNames = (models[mid]?.flds ?? []).sort((a, b) => a.ord - b.ord).map((f) => f.name)
      const decks = Object.values(JSON.parse(String(col[1] ?? '{}')) as Record<string, { name: string; id: number }>)
      name = decks.find((d) => d.name !== 'Default')?.name ?? decks[0]?.name ?? ''
    } else {
      // schéma récent : types de notes et champs dans leurs propres tables
      const f = db.exec(`select name from fields where ntid = ${Number(mid)} order by ord`)[0]?.values ?? []
      fieldNames = f.map((r) => String(r[0]))
      const d = db.exec('select name from decks')[0]?.values ?? []
      name = d.map((r) => String(r[0])).find((n) => n !== 'Default') ?? ''
    }

    const notes: AnkiNote[] = rows
      .filter((r) => String(r[1]) === mid)
      .map((r) => ({ guid: String(r[0]), fields: String(r[2]).split('\x1f'), tags: String(r[3]).trim().split(/\s+/).filter(Boolean) }))
    const width = Math.max(fieldNames.length, ...notes.map((n) => n.fields.length))
    while (fieldNames.length < width) fieldNames.push(`Champ ${fieldNames.length + 1}`)
    return { name: name || fallbackName, fieldNames, notes }
  } finally {
    db.close()
  }
}

const BACK = /english|anglais|ingl[eé]s|french|fran[cç]ais|franc[eé]s|meaning|translation|traduc|back|verso|d[eé]finition|sens/i
const FRONT = /spanish|espagnol|espa[nñ]ol|front|recto|word|mot|palabra|term/i
const EXAMPLE = /example|exemple|ejemplo|sentence|phrase|frase/i
const RANK = /rank|freq|rang|ordre|order|#/i

/** Devine quel champ sert à quoi. Les champs qui ne contiennent que des images ou des sons sont écartés. */
export function guessMapping(deck: AnkiDeck): AnkiMapping {
  const sample = deck.notes.slice(0, 50)
  const textual = deck.fieldNames.map((_, i) => sample.some((n) => (n.fields[i] ?? '') !== '' && !isMediaOnly(n.fields[i] ?? '')))
  const numeric = deck.fieldNames.map((_, i) => sample.filter((n) => /^\s*\d+\s*$/.test(cleanField(n.fields[i] ?? ''))).length > sample.length * 0.8)
  const find = (re: RegExp, exclude: number[] = []) => deck.fieldNames.findIndex((f, i) => re.test(f) && textual[i] && !exclude.includes(i))
  let front = find(FRONT)
  if (front < 0) front = textual.findIndex((t, i) => t && !numeric[i])
  let back = find(BACK, [front])
  if (back < 0) back = textual.findIndex((t, i) => t && !numeric[i] && i !== front)
  const ex = find(EXAMPLE, [front, back])
  const rank = deck.fieldNames.findIndex((f, i) => RANK.test(f) && numeric[i])
  return { front: Math.max(0, front), back: Math.max(0, back), example: ex >= 0 ? ex : null, rank: rank >= 0 ? rank : null }
}

/** Notes → éléments. Les identifiants viennent de l'identifiant Anki de chaque note : réimporter ne duplique rien.
 *  Dans un paquet classé, une note sans rang (légende, mode d'emploi) est ignorée. */
export function ankiToItems(deck: AnkiDeck, map: AnkiMapping, subject = 'es', now = Date.now()): StudyItem[] {
  const backName = deck.fieldNames[map.back] ?? ''
  const lang = /english|anglais|ingl/i.test(backName) ? 'en' : undefined
  const out: StudyItem[] = []
  for (const n of deck.notes) {
    const rawFront = cleanField(n.fields[map.front] ?? '')
    const rawBack = cleanField(n.fields[map.back] ?? '')
    if (!rawFront || !rawBack) continue
    let rank: number | undefined
    if (map.rank !== null) {
      const v = parseInt(cleanField(n.fields[map.rank] ?? ''), 10)
      if (!Number.isFinite(v) || v <= 0) continue
      rank = v
    }
    const f = splitPos(rawFront)
    const back = stripTrailingPos(rawBack, f.pos)
    const example = map.example !== null ? cleanField(n.fields[map.example] ?? '') : ''
    out.push({
      id: `anki:${n.guid}`,
      subject,
      kind: f.pos && /^v/.test(f.pos) ? 'verb' : 'vocab',
      front: f.text,
      back,
      example: example || null,
      topic: null,
      source: 'anki',
      extra: { ...(f.pos ? { pos: f.pos } : {}), ...(f.gender ? { gender: f.gender } : {}), ...(f.note ? { note: f.note } : {}), ...(rank ? { rank } : {}), ...(lang ? { lang } : {}), deck: deck.name },
      createdAt: now + out.length,
      updatedAt: now,
      deletedAt: null,
    })
  }
  return out
}
