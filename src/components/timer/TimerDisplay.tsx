import { useEffect, useRef, useState } from 'react'
import { FONT_MAP } from '../../data/fonts'
import { fmtCountdown, fmtTimer } from '../../lib/time'
import { useSettings } from '../../store/settings'
import { useTimer } from '../../store/timer'
import { displayMs, isStopwatch, progressOf } from '../../timer/engine'

export function useTimerView() {
  const rt = useTimer()
  // relit les réglages pour recalculer quand les durées changent
  useSettings((s) => s.lengths)
  useSettings((s) => s.timerMode)
  useSettings((s) => s.taskEtaMode)
  const ms = displayMs(rt)
  const sw = isStopwatch()
  return {
    rt,
    ms,
    text: sw ? fmtTimer(ms) : fmtCountdown(ms),
    progress: progressOf(rt),
  }
}

// ——— Flip clock ———

function FlipDigit({ d }: { d: string }) {
  const [prev, setPrev] = useState(d)
  const [flipping, setFlipping] = useState(false)
  const cur = useRef(d)
  useEffect(() => {
    if (d === cur.current) return
    setPrev(cur.current)
    cur.current = d
    setFlipping(true)
    const id = setTimeout(() => setFlipping(false), 600)
    return () => clearTimeout(id)
  }, [d])
  return (
    <span className={`flip-digit ${flipping ? 'is-flipping' : ''}`}>
      <span className="flip-half flip-top"><span>{d}</span></span>
      <span className="flip-half flip-bottom"><span>{flipping ? prev : d}</span></span>
      {flipping && (
        <>
          <span className="flip-half flip-top flap-down"><span>{prev}</span></span>
          <span className="flip-half flip-bottom flap-up"><span>{d}</span></span>
        </>
      )}
    </span>
  )
}

function FlipClock({ text, theme }: { text: string; theme: string }) {
  const groups = text.split(':')
  return (
    <div className={`flipclock flip-${theme}`} aria-label={text}>
      {groups.map((g, gi) => (
        <span className="flip-group" key={gi}>
          {gi > 0 && <span className="flip-colon">:</span>}
          {g.split('').map((ch, i) => (
            <FlipDigit key={i} d={ch} />
          ))}
        </span>
      ))}
    </div>
  )
}

// ——— Matrice de points ———

const DOT_FONT: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ':': ['0', '0', '1', '0', '1', '0', '0'],
}

function DotMatrix({ text }: { text: string }) {
  const cell = 10
  let x = 0
  const dots: { cx: number; cy: number; on: boolean }[] = []
  for (const ch of text) {
    const g = DOT_FONT[ch]
    if (!g) continue
    const w = g[0].length
    g.forEach((row, ry) => row.split('').forEach((b, rx) => dots.push({ cx: x + rx * cell + cell / 2, cy: ry * cell + cell / 2, on: b === '1' })))
    x += (w + 1) * cell
  }
  const width = x - cell
  return (
    <svg className="dotmatrix" viewBox={`0 0 ${width} ${7 * cell}`} role="img" aria-label={text}>
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={cell * 0.36} className={d.on ? 'on' : 'off'} />
      ))}
    </svg>
  )
}

// ——— Jauge et camembert ———

function Gauge({ text, progress }: { text: string; progress: number }) {
  const r = 46
  const c = 2 * Math.PI * r
  return (
    <div className="gauge">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={r} className="gauge-track" />
        <circle cx="50" cy="50" r={r} className="gauge-fill" strokeDasharray={c} strokeDashoffset={c * progress} transform="rotate(-90 50 50)" />
      </svg>
      <span className="timer-digits">{text}</span>
    </div>
  )
}

function Pie({ text, progress }: { text: string; progress: number }) {
  const left = 1 - progress
  const a = left * 2 * Math.PI
  const x = 50 + 46 * Math.sin(a)
  const y = 50 - 46 * Math.cos(a)
  const large = left > 0.5 ? 1 : 0
  const d = left >= 0.9999 ? 'M50 4 A46 46 0 1 1 49.99 4 Z' : left <= 0.0001 ? '' : `M50 50 L50 4 A46 46 0 ${large} 1 ${x} ${y} Z`
  return (
    <div className="pie-wrap">
      <svg className="pie" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="46" className="pie-track" />
        {d && <path d={d} className="pie-fill" />}
      </svg>
      <span className="timer-digits small">{text}</span>
    </div>
  )
}

export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
    </div>
  )
}

export function TimerDisplay() {
  const { text, progress } = useTimerView()
  const style = useSettings((s) => s.timerStyle)
  const flipTheme = useSettings((s) => s.flipTheme)
  const size = useSettings((s) => s.clockSize)
  const fontId = useSettings((s) => s.clockFont)
  const showProgress = useSettings((s) => s.showProgress)
  const font = FONT_MAP.get(fontId) ?? FONT_MAP.get('outfit')!
  const fontStyle = { fontFamily: font.family, fontWeight: font.weight, letterSpacing: font.tracking } as React.CSSProperties

  let body: React.ReactNode
  switch (style) {
    case 'flip':
      body = <FlipClock text={text} theme={flipTheme} />
      break
    case 'dots':
      body = <DotMatrix text={text} />
      break
    case 'gauge':
      body = <Gauge text={text} progress={progress} />
      break
    case 'pie':
      body = <Pie text={text} progress={progress} />
      break
    case 'bar':
      body = (
        <>
          <span className="timer-digits">{text}</span>
          <ProgressBar progress={progress} />
        </>
      )
      break
    default:
      body = <span className="timer-digits">{text}</span>
  }
  return (
    <div className={`timer timer-${style} size-${size}`} style={fontStyle}>
      {body}
      {showProgress && style !== 'bar' && style !== 'gauge' && style !== 'pie' && <ProgressBar progress={progress} />}
    </div>
  )
}
