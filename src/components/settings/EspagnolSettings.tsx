import { Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useT } from '../../i18n'
import { useSettings } from '../../store/settings'
import { onVoicesChanged, spanishVoices, speak, speechSupported } from '../../tools/espagnol/speech'
import { NumberField, Row, Section, Select, ToggleRow } from '../ui'

export function EspagnolSettings() {
  const t = useT()
  const s = useSettings()
  const [voices, setVoices] = useState(spanishVoices)
  useEffect(() => onVoicesChanged(() => setVoices(spanishVoices())), [])
  return (
    <div className="settings-page">
      <Section title={t('es.set.daily')} desc={t('es.set.dailyDesc')}>
        <Row label={t('es.set.newPerDay')} desc={t('es.set.newPerDayDesc')}>
          <NumberField value={s.esNewPerDay} min={0} max={200} onChange={(v) => s.set({ esNewPerDay: v })} suffix={t('es.set.cards')} />
        </Row>
        <Row label={t('es.set.maxReviews')} desc={t('es.set.maxReviewsDesc')}>
          <NumberField value={s.esMaxReviews} min={10} max={2000} onChange={(v) => s.set({ esMaxReviews: v })} suffix={t('es.set.cards')} />
        </Row>
      </Section>
      <Section title={t('es.set.voice')} desc={speechSupported() ? t('es.set.voiceDesc') : t('es.set.voiceNo')}>
        {speechSupported() && (
          <>
            <Row label={t('es.set.voicePick')}>
              <div className="voice-row">
                <Select
                  value={s.esVoice}
                  onChange={(v) => s.set({ esVoice: v })}
                  options={[{ value: '', label: t('es.set.voiceAuto') }, ...voices.map((v) => ({ value: v.voiceURI, label: `${v.name} (${v.lang})` }))]}
                />
                <button type="button" className="icon-btn" onClick={() => speak('¿Qué tal? Vamos a la playa.', s.esVoice)} aria-label={t('es.listen')} title={t('es.listen')}>
                  <Volume2 size={17} />
                </button>
              </div>
            </Row>
            <ToggleRow label={t('es.set.autoSpeak')} desc={t('es.set.autoSpeakDesc')} checked={s.esAutoSpeak} onChange={(v) => s.set({ esAutoSpeak: v })} />
          </>
        )}
      </Section>
    </div>
  )
}
