import { CircleCheck, Clock, Coffee, Flame, Gauge, Timer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLang, useT } from '../../i18n'
import { aggregate, bestStreak, buckets, currentStreak, dailyFocus, focusScore, periodRange, type Period } from '../../lib/stats'
import { addDays, dayKey, fmtHourMinute, fmtHuman, startOfDay } from '../../lib/time'
import { useSettings } from '../../store/settings'
import { useStats } from '../../store/stats'
import { Section, Segmented } from '../ui'

function Card({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-head">
        <span>{label}</span>
        {icon}
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

function BarChart({ data }: { data: { label: string; focusMs: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.focusMs))
  const step = Math.ceil(data.length / 12)
  return (
    <div className="chart">
      <div className="chart-bars">
        {data.map((d, i) => (
          <div key={i} className="chart-col" title={`${d.label} · ${fmtHuman(d.focusMs)}`}>
            <div className="chart-bar" style={{ height: `${(d.focusMs / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="chart-labels">
        {data.map((d, i) => (
          <span key={i}>{i % step === 0 ? d.label : ''}</span>
        ))}
      </div>
      <div className="chart-max">{fmtHuman(max)}</div>
    </div>
  )
}

function Heatmap() {
  const t = useT()
  const lang = useLang()
  const sessions = useStats((s) => s.sessions)
  const map = useMemo(() => dailyFocus(sessions), [sessions])
  const today = new Date(startOfDay(Date.now()))
  // commence un lundi, 53 semaines en arrière
  const start = addDays(today, -364)
  const offset = (start.getDay() + 6) % 7
  const first = addDays(start, -offset)
  const weeks: { key: string; ms: number; future: boolean; date: Date }[][] = []
  let d = first
  while (d <= today) {
    const week = []
    for (let i = 0; i < 7; i++) {
      week.push({ key: dayKey(d), ms: map.get(dayKey(d)) || 0, future: d > today, date: d })
      d = addDays(d, 1)
    }
    weeks.push(week)
  }
  const level = (ms: number) => (ms <= 0 ? 0 : ms < 30 * 60000 ? 1 : ms < 90 * 60000 ? 2 : ms < 180 * 60000 ? 3 : 4)
  const locale = lang === 'fr' ? 'fr-FR' : 'en-US'
  return (
    <div className="heatmap-wrap">
      <div className="heatmap">
        {weeks.map((w, i) => (
          <div key={i} className="hm-week">
            {w.map((c) => (
              <span key={c.key} className={`hm-cell l${level(c.ms)} ${c.future ? 'future' : ''}`} title={`${c.date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} · ${fmtHuman(c.ms)}`} />
            ))}
          </div>
        ))}
      </div>
      <div className="hm-legend">
        <span>{t('stats.less')}</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className={`hm-cell l${l}`} />
        ))}
        <span>{t('stats.more')}</span>
      </div>
    </div>
  )
}

export function StatsSettings() {
  const t = useT()
  const lang = useLang()
  const sessions = useStats((s) => s.sessions)
  const tasksDone = useStats((s) => s.tasksDone)
  const activeDays = useStats((s) => s.activeDays)
  const weekendsSafe = useSettings((s) => s.weekendsSafe)
  const h24 = useSettings((s) => s.clock24)
  const [period, setPeriod] = useState<Period>('today')
  const [showHow, setShowHow] = useState(false)

  const now = Date.now()
  const firstTs = sessions[0]?.start ?? now
  const range = periodRange(period, now, firstTs)
  const agg = aggregate(sessions, tasksDone, range.from, range.to)
  const streak = currentStreak(activeDays, weekendsSafe)
  const best = bestStreak(activeDays, weekendsSafe)

  // Focus Score : celui du jour, ou la moyenne des jours actifs de la période
  const perDay = useMemo(() => {
    const m = new Map<string, ReturnType<typeof aggregate>>()
    const get = (k: string) => {
      let a = m.get(k)
      if (!a) m.set(k, (a = { focusMs: 0, breakMs: 0, sessions: 0, qualifying: 0, tasks: 0 }))
      return a
    }
    for (const s of sessions) {
      const a = get(dayKey(s.end))
      if (s.type === 'focus') {
        a.focusMs += s.ms
        if (s.completed) a.sessions++
        if (s.completed && s.ms >= 10 * 60000) a.qualifying++
      } else a.breakMs += s.ms
    }
    for (const x of tasksDone) get(dayKey(x.at)).tasks++
    return m
  }, [sessions, tasksDone])

  let score: number
  if (period === 'today') score = focusScore(agg, streak)
  else {
    const scores: number[] = []
    for (const [k, a] of perDay) {
      const ts = new Date(k + 'T12:00:00').getTime()
      if (ts >= range.from && ts < range.to && a.focusMs > 0) scores.push(focusScore(a, streak))
    }
    score = scores.length ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length) : 0
  }

  const data = buckets(period, range, sessions, lang)
  const recent = [...sessions].reverse().slice(0, 12)
  const locale = lang === 'fr' ? 'fr-FR' : 'en-US'

  return (
    <div className="settings-page">
      <Segmented<Period>
        wrap
        value={period}
        onChange={setPeriod}
        options={(['today', 'week', 'month', '3m', '6m', 'year', 'all'] as Period[]).map((p) => ({ value: p, label: t(`stats.p.${p}`) }))}
      />
      <div className="stat-grid">
        <Card tone="fire" icon={<Flame size={18} />} label={t('stats.streak')} value={t('stats.days', { n: streak })} sub={t('stats.best', { n: best })} />
        <Card tone="sun" icon={<Clock size={18} />} label={t('stats.focus')} value={fmtHuman(agg.focusMs)} />
        <Card tone="violet" icon={<Gauge size={18} />} label={t('stats.score')} value={`${score}`} sub={period === 'today' ? '/ 100' : t('stats.scoreAvg')} />
        <Card tone="green" icon={<CircleCheck size={18} />} label={t('stats.tasks')} value={String(agg.tasks)} />
        <Card tone="blue" icon={<Timer size={18} />} label={t('stats.sessions')} value={String(agg.sessions)} />
        <Card tone="pink" icon={<Coffee size={18} />} label={t('stats.breaks')} value={fmtHuman(agg.breakMs)} />
      </div>
      <button type="button" className="link-btn" onClick={() => setShowHow(!showHow)}>{t('stats.how')}</button>
      {showHow && <p className="hint">{t('stats.howText')}</p>}

      <Section title={t('stats.chart')}>
        <BarChart data={data} />
      </Section>
      <Section title={t('stats.heatmap')}>
        <Heatmap />
      </Section>
      <Section title={t('stats.recent')}>
        {recent.length === 0 ? (
          <p className="hint subtle">{t('stats.none')}</p>
        ) : (
          <ul className="recent">
            {recent.map((s) => (
              <li key={s.id}>
                <span className={`recent-dot ${s.type}`} />
                <span className="recent-when">
                  {new Date(s.end).toLocaleDateString(locale, { day: 'numeric', month: 'short' })} · {fmtHourMinute(s.start, h24)}
                </span>
                <span className="recent-what">
                  {s.type === 'focus' ? t('phase.focus') : t('phase.break')}
                  {s.taskTitle ? ` · ${s.taskTitle}` : ''}
                  {!s.completed && s.type === 'focus' ? ` (${t('stats.incomplete')})` : ''}
                </span>
                <span className="recent-ms">{fmtHuman(s.ms)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}
