import { Play } from 'lucide-react'
import { useState } from 'react'
import { ALERTS, playAlert } from '../../audio/alerts'
import { useLang, useT } from '../../i18n'
import { notificationsSupported, requestNotifications } from '../../lib/browser'
import { useSettings } from '../../store/settings'
import { changeMode } from '../../timer/engine'
import type { FlipTheme, Lengths, TimerMode, TimerStyle } from '../../types'
import { NumberField, Row, Section, Select, Slider, ToggleRow } from '../ui'

const TALLIES = ['dots', '🍅', '⭐', '🔥', '💜', '✅', '🌱', '☁️']

export function TimerSettings() {
  const t = useT()
  const lang = useLang()
  const s = useSettings()
  const [notifErr, setNotifErr] = useState('')
  const L = s.lengths
  const len = (key: keyof Lengths, label: string, max = 600) => (
    <Row label={label}>
      <NumberField value={L[key]} max={max} onChange={(v) => s.setLength(key, v)} suffix={key === 'longEvery' ? t('timer.l.sessions') : t('common.min')} />
    </Row>
  )
  const modes: TimerMode[] = ['pomodoro', 'countdown', 'stopwatch', 'animedoro', 'fiftytwo']
  const styles: TimerStyle[] = ['default', 'flip', 'bar', 'gauge', 'dots', 'pie']

  return (
    <div className="settings-page">
      <Section title={t('timer.mode')}>
        <div className="mode-picks">
          {modes.map((m) => (
            <button
              key={m}
              type="button"
              className={`mode-pick ${s.timerMode === m ? 'active' : ''}`}
              onClick={() => {
                if (s.timerMode === m) return
                s.set({ timerMode: m })
                changeMode()
              }}
            >
              <strong>{t(`timer.m.${m}`)}</strong>
              <span>{t(`timer.d.${m}`)}</span>
            </button>
          ))}
        </div>
        {s.timerMode !== 'stopwatch' && (
          <ToggleRow label={t('timer.eta')} desc={t('timer.etaDesc')} checked={s.taskEtaMode} onChange={(v) => s.set({ taskEtaMode: v })} />
        )}
      </Section>

      {s.timerMode !== 'stopwatch' && (
        <Section title={t('timer.lengths')}>
          {s.timerMode === 'pomodoro' && (
            <>
              {len('focus', t('timer.l.focus'))}
              {len('short', t('timer.l.short'))}
              {len('long', t('timer.l.long'))}
              {len('longEvery', t('timer.l.every'), 12)}
            </>
          )}
          {s.timerMode === 'countdown' && len('countdown', t('timer.l.countdown'), 1440)}
          {s.timerMode === 'animedoro' && (
            <>
              {len('animeFocus', t('timer.l.focus'))}
              {len('animeWatch', t('timer.l.watch'))}
            </>
          )}
          {s.timerMode === 'fiftytwo' && (
            <>
              {len('ftFocus', t('timer.l.focus'))}
              {len('ftBreak', t('timer.l.break'))}
            </>
          )}
        </Section>
      )}

      <Section title={t('timer.style')}>
        <div className="style-picks">
          {styles.map((st) => (
            <button key={st} type="button" className={`style-pick style-${st} ${s.timerStyle === st ? 'active' : ''}`} onClick={() => s.set({ timerStyle: st })}>
              <span className="style-sample" aria-hidden="true" />
              <span>{t(`timer.s.${st}`)}</span>
            </button>
          ))}
        </div>
        {s.timerStyle === 'flip' && (
          <Row label={t('timer.flip')}>
            <Select<FlipTheme>
              value={s.flipTheme}
              onChange={(v) => s.set({ flipTheme: v })}
              options={(['dark', 'light', 'accent', 'glass'] as FlipTheme[]).map((f) => ({ value: f, label: t(`timer.f.${f}`) }))}
            />
          </Row>
        )}
        {s.timerStyle !== 'bar' && s.timerStyle !== 'gauge' && s.timerStyle !== 'pie' && (
          <ToggleRow label={t('timer.progress')} checked={s.showProgress} onChange={(v) => s.set({ showProgress: v })} />
        )}
      </Section>

      <Section>
        <ToggleRow label={t('timer.autoStart')} desc={t('timer.autoStartDesc')} checked={s.autoStart} onChange={(v) => s.set({ autoStart: v })} />
        <ToggleRow
          label={t('timer.notif')}
          desc={notifErr || t('timer.notifDesc')}
          checked={s.notifications}
          disabled={!notificationsSupported()}
          onChange={async (v) => {
            if (!v) return s.set({ notifications: false })
            const p = await requestNotifications()
            if (p === 'granted') {
              setNotifErr('')
              s.set({ notifications: true })
            } else setNotifErr(t('timer.notifDenied'))
          }}
        />
        <ToggleRow label={t('timer.confetti')} checked={s.confetti} onChange={(v) => s.set({ confetti: v })} />
        <ToggleRow label={t('timer.title')} checked={s.titleTime} onChange={(v) => s.set({ titleTime: v })} />
        <ToggleRow label={t('timer.pipTask')} checked={s.pipShowTask} onChange={(v) => s.set({ pipShowTask: v })} />
        <ToggleRow label={t('timer.streak')} checked={s.showStreak} onChange={(v) => s.set({ showStreak: v })} />
        <ToggleRow label={t('timer.weekends')} checked={s.weekendsSafe} onChange={(v) => s.set({ weekendsSafe: v })} />
        <ToggleRow label={t('extras.clear')} desc={t('extras.clearDesc')} checked={s.clearMode} onChange={(v) => s.set({ clearMode: v })} />
      </Section>

      <Section title={t('timer.alert')}>
        <div className="alert-picks">
          {ALERTS.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`chip ${s.alertSound === a.id ? 'active' : ''}`}
              onClick={() => {
                s.set({ alertSound: a.id })
                playAlert(a.id, s.alertVolume)
              }}
            >
              {a.id !== 'none' && <Play size={11} fill="currentColor" />} {a.name[lang]}
            </button>
          ))}
        </div>
        <div className="slider-row">
          <span>{t('timer.alertVolume')}</span>
          <Slider value={s.alertVolume} onChange={(v) => s.set({ alertVolume: v })} label={t('timer.alertVolume')} />
        </div>
      </Section>

      <Section title={t('timer.tally')}>
        <div className="tally-picks">
          {TALLIES.map((ic) => (
            <button key={ic} type="button" className={`tally-pick ${s.tallyIcon === ic ? 'active' : ''}`} onClick={() => s.set({ tallyIcon: ic })}>
              {ic === 'dots' ? <span className="tally-dots-sample"><i /><i /><i className="off" /></span> : ic}
            </button>
          ))}
        </div>
      </Section>
    </div>
  )
}
