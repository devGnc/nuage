import { useEffect, useState } from 'react'

/** Les rubriques de l'outil Espagnol ont chacune leur adresse : #/espagnol, #/espagnol/cartes… */
export type Section = 'today' | 'cards' | 'notes' | 'import'
export const SECTIONS: Section[] = ['today', 'cards', 'notes', 'import']
const SLUG: Record<Section, string> = { today: '', cards: 'cartes', notes: 'fiches', import: 'importer' }

function readSection(): Section {
  const seg = location.hash.split('/')[2] ?? ''
  return SECTIONS.find((s) => SLUG[s] === seg) ?? 'today'
}

export function goSection(s: Section) {
  location.hash = `#/espagnol${SLUG[s] ? `/${SLUG[s]}` : ''}`
}

export function useSection(): Section {
  const [s, set] = useState(readSection)
  useEffect(() => {
    const on = () => set(readSection())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return s
}
