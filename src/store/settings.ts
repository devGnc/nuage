import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ClockSize, CustomQuote, FlipTheme, Greetings, Lang, Lengths, Mode, MusicFavorite,
  QuoteCategory, SavedMix, SettingsTab, TimerMode, TimerStyle,
} from '../types'

export interface Settings {
  lang: Lang
  displayName: string
  accent: string
  mode: Mode

  // Thèmes
  themes: Record<Mode, string>
  dim: Record<Mode, number>
  blur: Record<Mode, number>
  uploads: Record<Mode, boolean>
  randomizer: string // 'off' | 'all' | catégorie

  // Horloge
  clock24: boolean
  showSeconds: boolean
  showDate: boolean
  clockSize: ClockSize
  clockFont: string
  greetings: Greetings

  // Timer
  timerMode: TimerMode
  lengths: Lengths
  taskEtaMode: boolean
  timerStyle: TimerStyle
  flipTheme: FlipTheme
  showProgress: boolean
  autoStart: boolean
  notifications: boolean
  alertSound: string
  alertVolume: number
  tallyIcon: string
  showStreak: boolean
  pipShowTask: boolean
  titleTime: boolean
  confetti: boolean
  weekendsSafe: boolean

  // Citations
  quoteCategory: QuoteCategory
  quotesFocus: boolean
  quotesHome: boolean
  customQuotes: CustomQuote[]

  // Extras
  disableAnimated: boolean
  clearMode: boolean
  preventSleep: boolean
  defaultTab: SettingsTab | 'recent'
  shortcuts: boolean

  // Sons & musique
  masterVolume: number
  mix: Record<string, number>
  savedMixes: SavedMix[]
  musicVolume: number
  musicFavorites: MusicFavorite[]

  // Espagnol
  esNewPerDay: number
  esMaxReviews: number
  /** voix choisie (identifiant du navigateur) ; vide = automatique */
  esVoice: string
  esAutoSpeak: boolean
}

const browserLang: Lang =
  typeof navigator !== 'undefined' && navigator.language && !navigator.language.toLowerCase().startsWith('fr') ? 'en' : 'fr'

export const defaultSettings: Settings = {
  lang: browserLang,
  displayName: '',
  accent: '#8b9cff',
  mode: 'focus',

  themes: { home: 'aube', focus: 'aube', ambient: 'a-nuages' },
  dim: { home: 0.1, focus: 0.15, ambient: 0 },
  blur: { home: 0, focus: 0, ambient: 0 },
  uploads: { home: false, focus: false, ambient: false },
  randomizer: 'off',

  clock24: true,
  showSeconds: false,
  showDate: false,
  clockSize: 'm',
  clockFont: 'outfit',
  greetings: 'dynamic',

  timerMode: 'pomodoro',
  lengths: {
    focus: 25, short: 5, long: 15, longEvery: 4, countdown: 30,
    animeFocus: 50, animeWatch: 20, ftFocus: 52, ftBreak: 17,
  },
  taskEtaMode: false,
  timerStyle: 'default',
  flipTheme: 'dark',
  showProgress: false,
  autoStart: false,
  notifications: false,
  alertSound: 'sparkle',
  alertVolume: 0.6,
  tallyIcon: 'dots',
  showStreak: true,
  pipShowTask: true,
  titleTime: true,
  confetti: true,
  weekendsSafe: true,

  quoteCategory: 'all',
  quotesFocus: true,
  quotesHome: true,
  customQuotes: [],

  disableAnimated: false,
  clearMode: false,
  preventSleep: false,
  defaultTab: 'recent',
  shortcuts: true,

  masterVolume: 0.8,
  mix: {},
  savedMixes: [],
  musicVolume: 0.7,
  musicFavorites: [],

  esNewPerDay: 15,
  esMaxReviews: 200,
  esVoice: '',
  esAutoSpeak: false,
}

interface SettingsStore extends Settings {
  set: (patch: Partial<Settings>) => void
  setFor: <K extends 'themes' | 'dim' | 'blur' | 'uploads'>(key: K, mode: Mode, value: Settings[K][Mode]) => void
  setLength: (key: keyof Lengths, value: number) => void
  replaceAll: (s: Partial<Settings>) => void
}

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      set: (patch) => set(patch),
      setFor: (key, mode, value) => set((s) => ({ [key]: { ...s[key], [mode]: value } }) as Partial<Settings>),
      setLength: (key, value) => set((s) => ({ lengths: { ...s.lengths, [key]: value } })),
      replaceAll: (s) => set({ ...defaultSettings, ...s }),
    }),
    {
      name: 'nuage:settings',
      version: 1,
      merge: (persisted, current) => {
        const p = (persisted || {}) as Partial<Settings>
        return {
          ...current,
          ...p,
          lengths: { ...defaultSettings.lengths, ...(p.lengths || {}) },
          themes: { ...defaultSettings.themes, ...(p.themes || {}) },
          dim: { ...defaultSettings.dim, ...(p.dim || {}) },
          blur: { ...defaultSettings.blur, ...(p.blur || {}) },
          uploads: { ...defaultSettings.uploads, ...(p.uploads || {}) },
        }
      },
    },
  ),
)

/** Extrait uniquement les données (sans les fonctions) pour l'export et la synchro. */
export function settingsSnapshot(): Settings {
  const s = useSettings.getState() as unknown as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(defaultSettings)) out[k] = s[k]
  return out as unknown as Settings
}
