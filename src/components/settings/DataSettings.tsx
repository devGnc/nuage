import { Download, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useT } from '../../i18n'
import { makeBackup, resetEverything, restoreBackup } from '../../lib/backup'
import { downloadText } from '../../lib/browser'
import { dayKey } from '../../lib/time'
import { useStats } from '../../store/stats'
import { Row, Section } from '../ui'

export function DataSettings() {
  const t = useT()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const appUrl = location.origin + location.pathname
  return (
    <div className="settings-page">
      <Section>
        <Row label={t('data.export')} desc={t('data.exportDesc')}>
          <button type="button" className="btn" onClick={() => downloadText(`nuage-${dayKey()}.json`, JSON.stringify(makeBackup(), null, 2), 'application/json')}>
            <Download size={15} /> JSON
          </button>
        </Row>
        <Row label={t('data.import')} desc={t('data.importDesc')}>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            <Upload size={15} /> JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              try {
                const ok = restoreBackup(JSON.parse(await f.text()))
                setMsg(ok ? t('data.importOk') : t('data.importErr'))
              } catch {
                setMsg(t('data.importErr'))
              }
              e.target.value = ''
            }}
          />
        </Row>
        {msg && <p className="hint">{msg}</p>}
      </Section>
      <Section title={t('data.embed')} desc={t('data.embedDesc')}>
        <div className="url-row">
          <input className="input" readOnly value={appUrl} onFocus={(e) => e.target.select()} />
          <button
            type="button"
            className="btn"
            onClick={() => {
              navigator.clipboard?.writeText(appUrl).then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              })
            }}
          >
            {copied ? t('common.copied') : t('common.copy')}
          </button>
        </div>
      </Section>
      <Section>
        <Row label={t('data.resetStats')}>
          <button type="button" className="btn danger" onClick={() => window.confirm(t('data.resetStatsConfirm')) && useStats.getState().clear()}>
            {t('common.reset')}
          </button>
        </Row>
        <Row label={t('data.resetAll')}>
          <button type="button" className="btn danger" onClick={() => window.confirm(t('data.resetAllConfirm')) && resetEverything()}>
            {t('common.reset')}
          </button>
        </Row>
      </Section>
    </div>
  )
}
