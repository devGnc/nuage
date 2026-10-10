import { useEffect } from 'react'
import { FONTS, loadAllFonts } from '../../data/fonts'
import { useT } from '../../i18n'
import { useSettings } from '../../store/settings'
import type { ClockSize, Greetings } from '../../types'
import { Row, Section, Segmented, ToggleRow } from '../ui'

export function ClockSettings() {
  const t = useT()
  const s = useSettings()
  useEffect(() => loadAllFonts(), [])
  return (
    <div className="settings-page">
      <Section>
        <Row label={t('clock.name')}>
          <input className="input" value={s.displayName} maxLength={40} onChange={(e) => s.set({ displayName: e.target.value })} placeholder={t('clock.namePh')} />
        </Row>
        <Row label={t('clock.format')}>
          <Segmented value={s.clock24 ? '24' : '12'} onChange={(v) => s.set({ clock24: v === '24' })} options={[{ value: '24', label: t('clock.h24') }, { value: '12', label: t('clock.h12') }]} />
        </Row>
        <ToggleRow label={t('clock.seconds')} checked={s.showSeconds} onChange={(v) => s.set({ showSeconds: v })} />
        <ToggleRow label={t('clock.date')} checked={s.showDate} onChange={(v) => s.set({ showDate: v })} />
        <Row label={t('clock.greetings')}>
          <Segmented<Greetings>
            value={s.greetings}
            onChange={(v) => s.set({ greetings: v })}
            options={[{ value: 'dynamic', label: t('clock.g.dynamic') }, { value: 'generic', label: t('clock.g.generic') }, { value: 'off', label: t('clock.g.off') }]}
          />
        </Row>
      </Section>
      <Section title={t('clock.size')}>
        <div className="size-picks">
          {(['s', 'm', 'l'] as ClockSize[]).map((z) => (
            <button key={z} type="button" className={`size-pick size-${z} ${s.clockSize === z ? 'active' : ''}`} onClick={() => s.set({ clockSize: z })}>
              <span className="size-sample">14:24</span>
              <span>{t(`clock.${z}`)}</span>
            </button>
          ))}
        </div>
      </Section>
      <Section title={t('clock.font')}>
        <div className="font-grid">
          {FONTS.map((f) => (
            <button key={f.id} type="button" className={`font-pick ${s.clockFont === f.id ? 'active' : ''}`} onClick={() => s.set({ clockFont: f.id })}>
              <span className="font-sample" style={{ fontFamily: f.family, fontWeight: f.weight, letterSpacing: f.tracking }}>
                25:00
              </span>
              <span className="font-name">{f.label}</span>
            </button>
          ))}
        </div>
      </Section>
    </div>
  )
}
