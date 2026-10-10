export const pad = (n: number) => String(Math.floor(n)).padStart(2, '0')

/** Affichage d'un timer : MM:SS, ou H:MM:SS au-delà d'une heure. */
export function fmtTimer(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** Le timer arrondit au-dessus pour qu'un compte à rebours affiche 25:00 puis 24:59. */
export function fmtCountdown(ms: number): string {
  return fmtTimer(Math.ceil(Math.max(0, ms) / 1000) * 1000)
}

/** Durée lisible : « 2 h 05 », « 45 min », « 30 s ». */
export function fmtHuman(ms: number): string {
  const totalMin = Math.round(ms / 60000)
  if (ms > 0 && ms < 60000) return `${Math.round(ms / 1000)} s`
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${pad(m)}`
}

/** Clé de jour en heure locale : 2026-10-10 */
export function dayKey(d: Date | number = new Date()): string {
  const x = typeof d === 'number' ? new Date(d) : d
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`
}

export function parseDayKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** Lundi de la semaine (heure locale). */
export function startOfWeek(ts: number): number {
  const d = new Date(startOfDay(ts))
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  return d.getTime()
}

export function fmtClock(date: Date, h24: boolean, seconds: boolean): { time: string; suffix: string } {
  let h = date.getHours()
  let suffix = ''
  if (!h24) {
    suffix = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
  }
  const hh = h24 ? pad(h) : String(h)
  const time = `${hh}:${pad(date.getMinutes())}${seconds ? ':' + pad(date.getSeconds()) : ''}`
  return { time, suffix }
}

export function fmtHourMinute(ts: number, h24: boolean): string {
  const { time, suffix } = fmtClock(new Date(ts), h24, false)
  return suffix ? `${time} ${suffix}` : time
}
