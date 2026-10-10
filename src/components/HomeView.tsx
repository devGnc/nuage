import { useEffect, useState } from 'react'
import { greeting } from '../data/greetings'
import { useLang } from '../i18n'
import { fmtClock } from '../lib/time'
import { useSettings } from '../store/settings'
import { FONT_MAP } from '../data/fonts'

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export function HomeView() {
  const lang = useLang()
  const s = useSettings()
  const now = useNow(s.showSeconds ? 250 : 1000)
  const { time, suffix } = fmtClock(now, s.clock24, s.showSeconds)
  const date = now.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <div className="home">
      {s.greetings !== 'off' && <h1 className="greeting">{greeting(lang, s.greetings, s.displayName, now)}</h1>}
      <div className={`clock size-${s.clockSize}`} style={clockFontStyle(s.clockFont)}>
        <span className="clock-time">{time}</span>
        {suffix && <span className="clock-suffix">{suffix}</span>}
      </div>
      {s.showDate && <div className="clock-date">{date}</div>}
    </div>
  )
}

export function clockFontStyle(id: string): React.CSSProperties {
  const f = FONT_MAP.get(id) ?? FONT_MAP.get('outfit')!
  return { fontFamily: f.family, fontWeight: Math.max(f.weight, 500), letterSpacing: f.tracking }
}
