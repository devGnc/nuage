import { Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useT } from '../../i18n'
import { useSettings } from '../../store/settings'
import { onVoicesChanged, spanishVoices, speak, speechSupported } from '../../tools/espagnol/speech'
import { Row, Section, Segmented, Select, ToggleRow } from '../ui'

const SIZES = ['10', '15', '20', '30'] as const

export function EspagnolSettings() {
  const t = useT()
  const s = useSettings()
  const [voices, setVoices] = useState(spanishVoices)
  useEffect(() => onVoicesChanged(() => setVoices(spanishVoices())), [])
  const size = (SIZES as readonly string[]).includes(String(s.esReviewSize)) ? (String(s.esReviewSize) as (typeof SIZES)[number]) : '15'
  return (
    <div className="settings-page">
      <Section title={t('es.set.practice')} desc={t('es.set.practiceDesc')}>
        <Row label={t('es.set.reviewSize')} desc={t('es.set.reviewSizeDesc')}>
          <Segmented value={size} onChange={(v) => s.set({ esReviewSize: Number(v) })} options={SIZES.map((n) => ({ value: n, label: n }))} />
        </Row>
        <ToggleRow label={t('es.set.tolerant')} desc={t('es.set.tolerantDesc')} checked={s.esAccentTolerant} onChange={(v) => s.set({ esAccentTolerant: v })} />
      </Section>
      <Section title={t('es.set.voice')} desc={speechSupported() ? t('es.set.voiceDesc') : t('es.set.voiceNo')}>
        {speechSupported() && (
          <>
            <Row label={t('es.set.voicePick')}>
              <div className="voice-row">
                <Select
                  value={s.esVoice}
                  onChange={(v) => s.set({ esVoice: v })}
                  label={t('es.set.voicePick')}
                  options={[{ value: '', label: t('es.set.voiceAuto') }, ...voices.map((v) => ({ value: v.voiceURI, label: `${v.name} (${v.lang})` }))]}
                />
                <button type="button" className="icon-btn" onClick={() => speak('¡Hola! ¿Qué tal? Me llamo Lucía.', { voice: s.esVoice })} aria-label={t('es.listen')} title={t('es.listen')}>
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
