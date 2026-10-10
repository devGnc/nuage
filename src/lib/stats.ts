import type { SessionLog, TaskDoneLog } from '../types'
import { addDays, dayKey, parseDayKey, startOfDay } from './time'

const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6

/** Série en cours : jours consécutifs avec au moins un focus lancé. */
export function currentStreak(activeDays: string[], weekendsSafe: boolean, now = new Date()): number {
  if (activeDays.length === 0) return 0
  const days = new Set(activeDays)
  const earliest = parseDayKey(activeDays[0])
  let d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  // Si rien aujourd'hui, la série reste valable jusqu'à la fin de la journée.
  if (!days.has(dayKey(d))) d = addDays(d, -1)
  let count = 0
  while (d >= earliest) {
    const k = dayKey(d)
    if (days.has(k)) count++
    else if (!(weekendsSafe && isWeekend(d))) break
    d = addDays(d, -1)
  }
  return count
}

export function bestStreak(activeDays: string[], weekendsSafe: boolean, now = new Date()): number {
  if (activeDays.length === 0) return 0
  const days = new Set(activeDays)
  let d = parseDayKey(activeDays[0])
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let best = 0
  let run = 0
  while (d <= end) {
    if (days.has(dayKey(d))) {
      run++
      best = Math.max(best, run)
    } else if (!(weekendsSafe && isWeekend(d))) {
      run = 0
    }
    d = addDays(d, 1)
  }
  return best
}

export interface DayAgg {
  focusMs: number
  breakMs: number
  sessions: number
  qualifying: number
  tasks: number
}

export const MIN_SESSION_MS = 10 * 60000

export function aggregate(sessions: SessionLog[], tasks: TaskDoneLog[], from: number, to: number): DayAgg {
  const a: DayAgg = { focusMs: 0, breakMs: 0, sessions: 0, qualifying: 0, tasks: 0 }
  for (const s of sessions) {
    if (s.end < from || s.end >= to) continue
    if (s.type === 'focus') {
      a.focusMs += s.ms
      if (s.completed) a.sessions++
      if (s.completed && s.ms >= MIN_SESSION_MS) a.qualifying++
    } else a.breakMs += s.ms
  }
  for (const t of tasks) if (t.at >= from && t.at < to) a.tasks++
  return a
}

export function streakBoost(streak: number): number {
  if (streak >= 180) return 1.2
  if (streak >= 90) return 1.15
  if (streak >= 30) return 1.1
  if (streak >= 7) return 1.05
  return 1
}

/**
 * Focus Score d'une journée (0–100).
 * - Temps de focus : jusqu'à 45 pts (plein à 4 h).
 * - Sessions d'au moins 10 min terminées : 7 pts chacune, 35 max.
 * - Tâches terminées : 3 pts chacune, 9 max.
 * - Équilibre des pauses : +11 pts si les pauses représentent 10 à 35 % du temps de focus.
 * - Bonus de série : ×1,05 (7 j), ×1,10 (30 j), ×1,15 (90 j), ×1,20 (180 j). Plafonné à 100.
 */
export function focusScore(day: DayAgg, streak: number): number {
  if (day.focusMs <= 0) return 0
  const focusMin = day.focusMs / 60000
  let score = Math.min(1, focusMin / 240) * 45
  score += Math.min(5, day.qualifying) * 7
  score += Math.min(3, day.tasks) * 3
  const ratio = day.breakMs / day.focusMs
  if (focusMin >= 25 && ratio >= 0.1 && ratio <= 0.35) score += 11
  return Math.min(100, Math.round(score * streakBoost(streak)))
}

export type Period = 'today' | 'week' | 'month' | '3m' | '6m' | 'year' | 'all'

export function periodRange(p: Period, now: number, firstTs: number): { from: number; to: number } {
  const to = startOfDay(now) + 86400000
  const today = startOfDay(now)
  switch (p) {
    case 'today': return { from: today, to }
    case 'week': return { from: addDays(new Date(today), -6).getTime(), to }
    case 'month': return { from: addDays(new Date(today), -29).getTime(), to }
    case '3m': return { from: addDays(new Date(today), -89).getTime(), to }
    case '6m': return { from: addDays(new Date(today), -181).getTime(), to }
    case 'year': return { from: addDays(new Date(today), -364).getTime(), to }
    case 'all': return { from: Math.min(startOfDay(firstTs), today), to }
  }
}

export interface Bucket {
  label: string
  from: number
  to: number
  focusMs: number
}

/** Découpe une période en barres : heures, jours, semaines ou mois selon la longueur. */
export function buckets(p: Period, range: { from: number; to: number }, sessions: SessionLog[], lang: string): Bucket[] {
  const out: Bucket[] = []
  const locale = lang === 'fr' ? 'fr-FR' : 'en-US'
  if (p === 'today') {
    for (let h = 0; h < 24; h++) {
      const from = range.from + h * 3600000
      out.push({ label: String(h), from, to: from + 3600000, focusMs: 0 })
    }
  } else if (p === 'week' || p === 'month') {
    for (let t = range.from; t < range.to; t = addDays(new Date(t), 1).getTime()) {
      const d = new Date(t)
      const label = p === 'week' ? d.toLocaleDateString(locale, { weekday: 'short' }) : String(d.getDate())
      out.push({ label, from: t, to: addDays(d, 1).getTime(), focusMs: 0 })
    }
  } else if (p === '3m' || p === '6m') {
    for (let t = range.from; t < range.to; t = addDays(new Date(t), 7).getTime()) {
      const d = new Date(t)
      out.push({ label: d.toLocaleDateString(locale, { day: 'numeric', month: 'short' }), from: t, to: Math.min(range.to, addDays(d, 7).getTime()), focusMs: 0 })
    }
  } else {
    const start = new Date(range.from)
    let d = new Date(start.getFullYear(), start.getMonth(), 1)
    while (d.getTime() < range.to) {
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      out.push({ label: d.toLocaleDateString(locale, { month: 'short' }), from: Math.max(d.getTime(), range.from), to: next.getTime(), focusMs: 0 })
      d = next
    }
  }
  for (const s of sessions) {
    if (s.type !== 'focus' || s.end < range.from || s.end >= range.to) continue
    const b = out.find((x) => s.end >= x.from && s.end < x.to)
    if (b) b.focusMs += s.ms
  }
  return out
}

/** Minutes de focus par jour sur les 365 derniers jours (pour la heatmap). */
export function dailyFocus(sessions: SessionLog[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const s of sessions) {
    if (s.type !== 'focus') continue
    const k = dayKey(s.end)
    m.set(k, (m.get(k) || 0) + s.ms)
  }
  return m
}
