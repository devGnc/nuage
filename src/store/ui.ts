import { create } from 'zustand'
import type { SettingsTab } from '../types'

export type Panel = null | 'tasks' | 'sounds' | 'notes'
export type SoundsTab = 'sounds' | 'music' | 'library'

interface Toast {
  id: number
  text: string
}

interface UIStore {
  panel: Panel
  /** Lanceur d'outils (bouton grille) ouvert. */
  launcherOpen: boolean
  settingsOpen: boolean
  settingsTab: SettingsTab
  soundsTab: SoundsTab
  toast: Toast | null
  idle: boolean
  pipOpen: boolean
  fullscreen: boolean
  bgVersion: number
  bumpBg: () => void
  togglePanel: (p: Exclude<Panel, null>) => void
  closePanel: () => void
  toggleLauncher: () => void
  closeLauncher: () => void
  openSettings: (tab?: SettingsTab) => void
  closeSettings: () => void
  setTab: (tab: SettingsTab) => void
  setSoundsTab: (t: SoundsTab) => void
  showToast: (text: string) => void
}

const LAST_TAB = 'nuage:lastTab'

function readLastTab(): SettingsTab {
  try {
    return (localStorage.getItem(LAST_TAB) as SettingsTab) || 'themes'
  } catch {
    return 'themes'
  }
}

export const useUI = create<UIStore>()((set, get) => ({
  panel: null,
  launcherOpen: false,
  settingsOpen: false,
  settingsTab: readLastTab(),
  soundsTab: 'sounds',
  toast: null,
  idle: false,
  pipOpen: false,
  fullscreen: false,
  bgVersion: 0,
  bumpBg: () => set((s) => ({ bgVersion: s.bgVersion + 1 })),
  togglePanel: (p) => set((s) => ({ panel: s.panel === p ? null : p, launcherOpen: false })),
  closePanel: () => set({ panel: null }),
  toggleLauncher: () => set((s) => ({ launcherOpen: !s.launcherOpen, panel: null })),
  closeLauncher: () => set({ launcherOpen: false }),
  openSettings: (tab) => set({ settingsOpen: true, panel: null, launcherOpen: false, ...(tab ? { settingsTab: tab } : {}) }),
  closeSettings: () => set({ settingsOpen: false }),
  setTab: (tab) => {
    try {
      localStorage.setItem(LAST_TAB, tab)
    } catch {
      /* stockage indisponible */
    }
    set({ settingsTab: tab })
  },
  setSoundsTab: (t) => set({ soundsTab: t }),
  showToast: (text) => {
    const id = Date.now()
    set({ toast: { id, text } })
    setTimeout(() => {
      if (get().toast?.id === id) set({ toast: null })
    }, 3200)
  },
}))
