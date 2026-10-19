export type Mode = 'home' | 'focus' | 'ambient'
export type Lang = 'fr' | 'en'
export type Phase = 'focus' | 'short' | 'long'
export type TimerMode = 'pomodoro' | 'countdown' | 'stopwatch' | 'animedoro' | 'fiftytwo'
export type TimerStyle = 'default' | 'flip' | 'bar' | 'gauge' | 'dots' | 'pie'
export type FlipTheme = 'dark' | 'light' | 'accent' | 'glass'
export type ClockSize = 's' | 'm' | 'l'
export type Greetings = 'dynamic' | 'generic' | 'off'
export type SettingsTab = 'themes' | 'clock' | 'timer' | 'stats' | 'quotes' | 'extras' | 'account' | 'data' | 'help' | 'espagnol'
export type QuoteCategory = 'all' | 'motivation' | 'discipline' | 'wisdom' | 'calm' | 'mine'

export interface Lengths {
  focus: number
  short: number
  long: number
  longEvery: number
  countdown: number
  animeFocus: number
  animeWatch: number
  ftFocus: number
  ftBreak: number
}

export interface CustomQuote {
  id: string
  text: string
  author: string
}

export interface SavedMix {
  id: string
  name: string
  sounds: Record<string, number>
}

export interface MusicFavorite {
  id: string
  name: string
  url: string
}

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  emoji: string
  color: string
  done: boolean
  doneAt: number | null
  estimateMin: number | null
  focusedMs: number
  subtasks: Subtask[]
  createdAt: number
}

export interface Note {
  id: string
  title: string
  html: string
  updatedAt: number
}

export interface SessionLog {
  id: string
  type: 'focus' | 'break'
  start: number
  end: number
  ms: number
  completed: boolean
  taskTitle?: string
}

export interface TaskDoneLog {
  id: string
  at: number
  title: string
}
