import { ChartColumn, CircleHelp, Clock, Database, Palette, Quote, Sparkles, Timer, User, X } from 'lucide-react'
import { useEffect } from 'react'
import { useT } from '../../i18n'
import { useUI } from '../../store/ui'
import type { SettingsTab } from '../../types'
import { AccountSettings } from './AccountSettings'
import { ClockSettings } from './ClockSettings'
import { DataSettings } from './DataSettings'
import { ExtrasSettings } from './ExtrasSettings'
import { HelpSettings } from './HelpSettings'
import { QuotesSettings } from './QuotesSettings'
import { StatsSettings } from './StatsSettings'
import { ThemesSettings } from './ThemesSettings'
import { TimerSettings } from './TimerSettings'

const NAV: { id: SettingsTab; icon: React.ReactNode }[] = [
  { id: 'themes', icon: <Palette size={17} /> },
  { id: 'clock', icon: <Clock size={17} /> },
  { id: 'timer', icon: <Timer size={17} /> },
  { id: 'stats', icon: <ChartColumn size={17} /> },
  { id: 'quotes', icon: <Quote size={17} /> },
  { id: 'extras', icon: <Sparkles size={17} /> },
  { id: 'account', icon: <User size={17} /> },
  { id: 'data', icon: <Database size={17} /> },
  { id: 'help', icon: <CircleHelp size={17} /> },
]

const SUBTITLE = {
  themes: 'themes.subtitle',
  clock: 'clock.subtitle',
  timer: 'timer.subtitle',
  stats: 'stats.subtitle',
  quotes: 'quotes.subtitle',
  extras: 'extras.subtitle',
  account: 'account.subtitle',
  data: 'data.subtitle',
  help: 'help.subtitle',
} as const

export function SettingsDrawer() {
  const t = useT()
  const open = useUI((s) => s.settingsOpen)
  const tab = useUI((s) => s.settingsTab)
  const setTab = useUI((s) => s.setTab)
  const close = useUI((s) => s.closeSettings)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  return (
    <>
      <div className={`scrim ${open ? 'open' : ''}`} onClick={close} aria-hidden="true" />
      <aside className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open} inert={!open ? true : undefined} aria-label={t('set.title')}>
        <nav className="drawer-nav">
          <div className="drawer-brand">
            <span className="logo-mark" aria-hidden="true">☁</span> Nuage
          </div>
          {NAV.map((n) => (
            <button key={n.id} type="button" className={`nav-item ${tab === n.id ? 'active' : ''}`} onClick={() => setTab(n.id)}>
              {n.icon}
              <span>{t(`set.${n.id}`)}</span>
            </button>
          ))}
        </nav>
        <div className="drawer-main">
          <header className="drawer-head">
            <div>
              <h2>{t(`set.${tab}`)}</h2>
              <p>{t(SUBTITLE[tab])}</p>
            </div>
            <button type="button" className="icon-btn" onClick={close} aria-label={t('common.close')} title={t('common.close')}>
              <X size={20} />
            </button>
          </header>
          <div className="drawer-content">
            {open && (
              <>
                {tab === 'themes' && <ThemesSettings />}
                {tab === 'clock' && <ClockSettings />}
                {tab === 'timer' && <TimerSettings />}
                {tab === 'stats' && <StatsSettings />}
                {tab === 'quotes' && <QuotesSettings />}
                {tab === 'extras' && <ExtrasSettings />}
                {tab === 'account' && <AccountSettings />}
                {tab === 'data' && <DataSettings />}
                {tab === 'help' && <HelpSettings />}
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
