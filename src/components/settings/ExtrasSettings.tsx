import { useEffect, useState } from 'react'
import { useT } from '../../i18n'
import { onWakeLockChange, wakeLockSupported } from '../../lib/browser'
import { deferredPrompt, onInstallable, promptInstall } from '../../lib/install'
import { useSettings } from '../../store/settings'
import type { Lang, SettingsTab } from '../../types'
import { Row, Section, Segmented, Select, ToggleRow } from '../ui'
import { ALL_TABS } from './tabs'

export function ExtrasSettings() {
  const t = useT()
  const s = useSettings()
  const [lockActive, setLockActive] = useState(false)
  const [canInstall, setCanInstall] = useState(!!deferredPrompt)
  useEffect(() => onWakeLockChange(setLockActive), [])
  useEffect(() => onInstallable(() => setCanInstall(true)), [])
  const tabs: (SettingsTab | 'recent')[] = ['recent', ...ALL_TABS]
  return (
    <div className="settings-page">
      <Section>
        <Row label={t('extras.lang')}>
          <Segmented<Lang> value={s.lang} onChange={(v) => s.set({ lang: v })} options={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }]} />
        </Row>
      </Section>
      <Section>
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
