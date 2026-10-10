import { useEffect, useState } from 'react'
import { useT } from '../../i18n'
import { onWakeLockChange, wakeLockSupported } from '../../lib/browser'
import { deferredPrompt, onInstallable, promptInstall } from '../../lib/install'
import { useSettings } from '../../store/settings'
import type { Lang, SettingsTab } from '../../types'
import { Row, Section, Segmented, Select, ToggleRow } from '../ui'

const ACCENTS = ['#8b9cff', '#a78bfa', '#f472b6', '#fb7185', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#38bdf8', '#e2e8f0']


export function ExtrasSettings() {
  const t = useT()
  const s = useSettings()
  const [lockActive, setLockActive] = useState(false)
  const [canInstall, setCanInstall] = useState(!!deferredPrompt)
  useEffect(() => onWakeLockChange(setLockActive), [])
  useEffect(() => onInstallable(() => setCanInstall(true)), [])
  const tabs: (SettingsTab | 'recent')[] = ['recent', 'themes', 'clock', 'timer', 'stats', 'quotes', 'extras', 'account', 'data', 'help']
  return (
    <div className="settings-page">
      <Section>
        <Row label={t('extras.lang')}>
          <Segmented<Lang> value={s.lang} onChange={(v) => s.set({ lang: v })} options={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }]} />
        </Row>
        <Row label={t('extras.accent')}>
          <div className="accent-row">
            {ACCENTS.map((c) => (
              <button key={c} type="button" className={`color-opt ${s.accent === c ? 'active' : ''}`} style={{ background: c }} onClick={() => s.set({ accent: c })} aria-label={c} />
            ))}
            <input type="color" className="color-input" value={s.accent} onChange={(e) => s.set({ accent: e.target.value })} aria-label={t('extras.accent')} />
          </div>
        </Row>
      </Section>
      <Section>
        <ToggleRow label={t('extras.animated')} desc={t('extras.animatedDesc')} checked={s.disableAnimated} onChange={(v) => s.set({ disableAnimated: v })} />
        <ToggleRow label={t('extras.clear')} desc={t('extras.clearDesc')} checked={s.clearMode} onChange={(v) => s.set({ clearMode: v })} />
        <ToggleRow
          label={t('extras.sleep')}
          desc={`${t('extras.sleepDesc')} ${!wakeLockSupported() ? t('extras.sleepNo') : s.preventSleep ? `· ${lockActive ? t('extras.sleepActive') : t('extras.sleepInactive')}` : ''}`}
          checked={s.preventSleep}
          disabled={!wakeLockSupported()}
          onChange={(v) => s.set({ preventSleep: v })}
        />
        <ToggleRow label={t('extras.shortcuts')} checked={s.shortcuts} onChange={(v) => s.set({ shortcuts: v })} />
        <Row label={t('extras.defaultTab')}>
          <Select<SettingsTab | 'recent'>
            value={s.defaultTab}
            onChange={(v) => s.set({ defaultTab: v })}
            options={tabs.map((x) => ({ value: x, label: x === 'recent' ? t('extras.recent') : t(`set.${x}`) }))}
          />
        </Row>
      </Section>
      <Section title={t('extras.install')} desc={t('extras.installDesc')}>
        {canInstall ? (
          <button
            type="button"
            className="btn primary"
            onClick={async () => {
              await promptInstall()
              setCanInstall(false)
            }}
          >
            {t('extras.installBtn')}
          </button>
        ) : (
          <p className="hint subtle">{t('extras.installHint')}</p>
        )}
      </Section>
    </div>
  )
}
