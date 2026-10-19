/** La journée de révision commence à 4 h, comme dans Anki : une séance tardive compte pour la veille. */
export const DAY_START_HOUR = 4

export function studyDayStart(now = Date.now()): number {
  const d = new Date(now)
  if (d.getHours() < DAY_START_HOUR) d.setDate(d.getDate() - 1)
  d.setHours(DAY_START_HOUR, 0, 0, 0)
  return d.getTime()
}

export const studyDayEnd = (now = Date.now()) => studyDayStart(now) + 24 * 3600_000
