import { useEffect, useState } from 'react'

/** Chaque écran de l'outil Espagnol a son adresse, pour que le bouton retour du navigateur fonctionne :
 *  #/espagnol (cours), #/espagnol/lecon/<id>, #/espagnol/revision,
 *  #/espagnol/cahier[/lexique|/dialogues], #/espagnol/cahier/fiche/<id>, #/espagnol/cahier/dialogues/<id>. */

export type Section = 'course' | 'review' | 'notebook'
export type NotebookTab = 'notes' | 'words' | 'dialogues'

export type Route =
  | { section: 'course'; lesson?: string }
  | { section: 'review' }
  /** item : la fiche ou le dialogue ouvert */
  | { section: 'notebook'; tab: NotebookTab; item?: string }

const TAB_SLUG: Record<NotebookTab, string> = { notes: '', words: 'lexique', dialogues: 'dialogues' }

export function readRoute(hash = location.hash): Route {
  const [, , a = '', b = '', c = ''] = hash.split('/').map(decodeURIComponent)
  if (a === 'lecon' && b) return { section: 'course', lesson: b }
  if (a === 'revision') return { section: 'review' }
  if (a === 'cahier') {
    if (b === 'fiche' && c) return { section: 'notebook', tab: 'notes', item: c }
    if (b === 'dialogues' && c) return { section: 'notebook', tab: 'dialogues', item: c }
    const tab = (Object.keys(TAB_SLUG) as NotebookTab[]).find((t) => TAB_SLUG[t] === b) ?? 'notes'
    return { section: 'notebook', tab }
  }
  return { section: 'course' }
}

export function routeHash(r: Route): string {
  switch (r.section) {
    case 'course':
      return r.lesson ? `#/espagnol/lecon/${encodeURIComponent(r.lesson)}` : '#/espagnol'
    case 'review':
      return '#/espagnol/revision'
    case 'notebook':
      if (r.item && r.tab === 'notes') return `#/espagnol/cahier/fiche/${encodeURIComponent(r.item)}`
      if (r.item && r.tab === 'dialogues') return `#/espagnol/cahier/dialogues/${encodeURIComponent(r.item)}`
      return `#/espagnol/cahier${TAB_SLUG[r.tab] ? `/${TAB_SLUG[r.tab]}` : ''}`
  }
}

export function go(r: Route, replace = false) {
  const hash = routeHash(r)
  if (location.hash === hash) return
  if (replace) {
    history.replaceState(history.state, '', hash)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else location.hash = hash
}

export const openLesson = (id: string) => go({ section: 'course', lesson: id })

export function useRoute(): Route {
  const [r, set] = useState(readRoute)
  useEffect(() => {
    const on = () => set(readRoute())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return r
}
