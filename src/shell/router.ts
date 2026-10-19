import { create } from 'zustand'

/** Les outils de la suite. Chacun a son adresse : …/nuage/#/pomodoro, …/nuage/#/espagnol. */
export type ToolId = 'pomodoro' | 'espagnol'
export const TOOL_IDS: ToolId[] = ['pomodoro', 'espagnol']

const LAST_TOOL = 'nuage:lastTool'

function fromHash(hash: string): ToolId | null {
  const m = /^#\/([a-z-]+)/.exec(hash)
  return m && (TOOL_IDS as string[]).includes(m[1]) ? (m[1] as ToolId) : null
}

function readLast(): ToolId {
  try {
    const v = localStorage.getItem(LAST_TOOL) as ToolId | null
    return v && TOOL_IDS.includes(v) ? v : 'pomodoro'
  } catch {
    return 'pomodoro'
  }
}

function remember(tool: ToolId) {
  try {
    localStorage.setItem(LAST_TOOL, tool)
  } catch {
    /* stockage indisponible */
  }
}

export const useRoute = create<{ tool: ToolId }>(() => ({
  tool: (typeof location !== 'undefined' && fromHash(location.hash)) || readLast(),
}))

/** Ouvre un outil. Passe par l'adresse : le bouton retour du navigateur revient à l'outil précédent. */
export function goTo(tool: ToolId) {
  if (fromHash(location.hash) === tool) return
  location.hash = `#/${tool}`
}

/** Synchronise l'outil affiché et l'adresse. Sans adresse d'outil, on rouvre le dernier utilisé. */
export function installRouter() {
  const hash = location.hash
  // un retour de connexion (#access_token=…, #error=…) appartient à Supabase : on n'y touche pas
  if (!hash || hash === '#' || hash === '#/') history.replaceState(history.state, '', `#/${useRoute.getState().tool}`)
  remember(useRoute.getState().tool)
  const onHash = () => {
    const tool = fromHash(location.hash)
    if (!tool) return
    remember(tool)
    if (tool !== useRoute.getState().tool) useRoute.setState({ tool })
  }
  window.addEventListener('hashchange', onHash)
  return () => window.removeEventListener('hashchange', onHash)
}
