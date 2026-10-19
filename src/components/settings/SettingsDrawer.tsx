import { ChartColumn, CircleHelp, Clock, Database, Palette, Quote, SlidersHorizontal, Timer, User, X } from 'lucide-react'
import { useEffect } from 'react'
import { useT } from '../../i18n'
import { useUI } from '../../store/ui'
import type { SettingsTab } from '../../types'
import { ALL_TABS, SETTINGS_GROUPS } from './tabs'
import { AccountSettings } from './AccountSettings'
import { ClockSettings } from './ClockSettings'
import { DataSettings } from './DataSettings'
import { ExtrasSettings } from './ExtrasSettings'
import { HelpSettings } from './HelpSettings'
import { QuotesSettings } from './QuotesSettings'
import { StatsSettings } from './StatsSettings'
import { ThemesSettings } from './ThemesSettings'
import { TimerSettings } from './TimerSettings'

const ICONS: Record<SettingsTab, React.ReactNode> = {
  themes: <Palette size={17} />,
  extras: <SlidersHorizontal size={17} />,
  account: <User size={17} />,
  data: <Database size={17} />,
  help: <CircleHelp size={17} />,
  timer: <Timer size={17} />,
  clock: <Clock size={17} />,
  stats: <ChartColumn size={17} />,
  quotes: <Quote size={17} />,
}

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
  const stored = useUI((s) => s.settingsTab)
  // un onglet inconnu (ancienne version, autre appareil) retombe sur Apparence
  const tab: SettingsTab = ALL_TABS.includes(stored) ? stored : 'themes'
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
          {SETTINGS_GROUPS.map((g) => (
            <div key={g.label} className="nav-group" role="group" aria-label={t(g.label)}>
              <span className="nav-group-label">{t(g.label)}</span>
              {g.tabs.map((id) => (
                <button key={id} type="button" className={`nav-item ${tab === id ? 'active' : ''}`} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>
                  {ICONS[id]}
                  <span>{t(`set.${id}`)}</span>
                </button>
              ))}
            </div>
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
