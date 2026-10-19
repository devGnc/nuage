import type { StudyItem } from '../types'
import { normKey, stableHash } from './text'

/** Découpe un CSV (guillemets, retours à la ligne dans les champs). Séparateur deviné : « ; », « , » ou tabulation. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '')
  const firstLine = src.split(/\r?\n/, 1)[0] ?? ''
  const counts = [';', ',', '\t'].map((d) => [d, firstLine.split(d).length - 1] as const)
  const sep = counts.sort((a, b) => b[1] - a[1])[0][1] > 0 ? counts[0][0] : ';'
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += c
    } else if (c === '"' && field === '') quoted = true
    else if (c === sep) {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows.map((r) => r.map((f) => f.trim())).filter((r) => r.some((f) => f !== ''))
}

const HEADER = /^(espagnol|español|spanish|es|mot|recto|front|terme|word)$/i

/** Lignes « espagnol ; français ; exemple ; thème » → éléments. Une ligne d'en-tête est reconnue et ignorée. */
export function csvToItems(rows: string[][], fileName: string, subject = 'es', now = Date.now()): StudyItem[] {
  const body = rows.length && HEADER.test(normKey(rows[0][0] ?? '')) ? rows.slice(1) : rows
  const seen = new Set<string>()
  const out: StudyItem[] = []
  for (const r of body) {
    const [front = '', back = '', example = '', topic = ''] = r
    if (!front || !back) continue
    const id = `csv:${stableHash(normKey(front) + '|' + normKey(back))}`
    if (seen.has(id)) continue
    seen.add(id)
    out.push({
      id, subject, kind: 'vocab', front, back, example: example || null, topic: topic || null, source: 'csv',
      extra: { deck: fileName }, createdAt: now + out.length, updatedAt: now, deletedAt: null,
    })
  }
  return out
}

export const CSV_TEMPLATE = 'espagnol;français;exemple;thème\nla playa;la plage;Vamos a la playa el sábado.;voyage\ntener ganas de;avoir envie de;Tengo ganas de comer paella.;expressions\n'
