import type { TKey } from '../../i18n'
import { useRoute } from '../../shell/router'
import { useSettings } from '../../store/settings'
import { useUI } from '../../store/ui'
import type { SettingsTab } from '../../types'

/** Les réglages sont rangés par section : d'abord ceux de toute la suite, puis ceux de chaque outil. */
export const SETTINGS_GROUPS: { label: TKey; tabs: SettingsTab[] }[] = [
  { label: 'set.group.general', tabs: ['themes', 'extras', 'account', 'data', 'help'] },
  { label: 'set.group.pomodoro', tabs: ['timer', 'clock', 'stats', 'quotes'] },
]

export const ALL_TABS: SettingsTab[] = SETTINGS_GROUPS.flatMap((g) => g.tabs)
const POMODORO_TABS = SETTINGS_GROUPS[1].tabs

/** Ouvre les réglages sur l'onglet choisi dans Préférences, ou le dernier consulté.
 *  Hors du Pomodoro, un onglet propre au Pomodoro laisse la place à Apparence. */
export function openSettingsDefault() {
  const d = useSettings.getState().defaultTab
  let tab: SettingsTab = d === 'recent' || !ALL_TABS.includes(d) ? useUI.getState().settingsTab : d
  if (!ALL_TABS.includes(tab)) tab = 'themes'
  if (useRoute.getState().tool !== 'pomodoro' && POMODORO_TABS.includes(tab)) tab = 'themes'
  useUI.getState().openSettings(tab)
}
