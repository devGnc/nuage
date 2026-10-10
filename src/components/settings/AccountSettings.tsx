import { LogOut, Mail, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useLang, useT } from '../../i18n'
import { appUrl, clearRuntimeConfig, getConfig, loadSupa, saveRuntimeConfig } from '../../sync/client'
import { initSync, syncNow, useSync } from '../../sync/sync'
import { Row, Section } from '../ui'

function ConfigForm({ onDone }: { onDone: () => void }) {
  const t = useT()
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [err, setErr] = useState('')
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault()
        try {
          const u = new URL(url.trim())
          if (u.protocol !== 'https:') throw new Error()
          if (key.trim().length < 20) throw new Error()
          saveRuntimeConfig(url, key)
          initSync()
          onDone()
        } catch {
          setErr('URL ou clé invalide / Invalid URL or key')
        }
      }}
    >
      <label className="field">
        <span>{t('account.url')}</span>
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://xxxx.supabase.co" />
      </label>
      <label className="field">
        <span>{t('account.key')}</span>
        <input className="input" value={key} onChange={(e) => setKey(e.target.value)} placeholder="eyJhbGciOi… / sb_publishable_…" />
      </label>
      {err && <p className="error">{err}</p>}
      <button type="submit" className="btn primary">{t('account.saveConfig')}</button>
    </form>
  )
}

function AuthForm({ c }: { c: SupabaseClient }) {
  const t = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const run = async (fn: () => Promise<{ error: { message: string } | null }>, okMsg = '') => {
    setBusy(true)
    setMsg('')
    const { error } = await fn()
    setBusy(false)
    setMsg(error ? error.message : okMsg)
  }
  return (
    <div className="stack">
      <button type="button" className="btn google" disabled={busy} onClick={() => run(() => c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: appUrl() } }))}>
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
        {t('account.google')}
      </button>
      <div className="or">{t('account.or')}</div>
      <label className="field">
        <span>{t('account.email')}</span>
        <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="field">
        <span>{t('account.password')}</span>
        <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <div className="btn-row">
        <button type="button" className="btn primary" disabled={busy || !email || !password} onClick={() => run(() => c.auth.signInWithPassword({ email, password }))}>
          {t('account.signIn')}
        </button>
        <button type="button" className="btn" disabled={busy || !email || password.length < 6} onClick={() => run(() => c.auth.signUp({ email, password, options: { emailRedirectTo: appUrl() } }), t('account.checkEmail'))}>
          {t('account.signUp')}
        </button>
      </div>
      <button type="button" className="link-btn" disabled={busy || !email} onClick={() => run(() => c.auth.signInWithOtp({ email, options: { emailRedirectTo: appUrl() } }), t('account.checkEmail'))}>
        <Mail size={14} /> {t('account.magic')}
      </button>
      {msg && <p className="hint">{msg}</p>}
    </div>
  )
}

export function AccountSettings() {
  const t = useT()
  const lang = useLang()
  const [, force] = useState(0)
  const config = getConfig()
  const user = useSync((s) => s.user)
  const status = useSync((s) => s.status)
  const error = useSync((s) => s.error)
  const lastSync = useSync((s) => s.lastSync)
  const locale = lang === 'fr' ? 'fr-FR' : 'en-US'
  const [client, setClient] = useState<SupabaseClient | null>(null)
  useEffect(() => {
    if (config) loadSupa().then(setClient)
  }, [config?.url, config?.key])

  return (
    <div className="settings-page">
      <Section>
        <p>{t('account.intro')}</p>
        <p className="hint subtle">{t('account.guide')}</p>
      </Section>
      {!config && (
        <Section title={t('account.notConfigured')}>
          <ConfigForm onDone={() => force((x) => x + 1)} />
        </Section>
      )}
      {config && !user && client && (
        <Section>
          <AuthForm c={client} />
        </Section>
      )}
      {config && user && (
        <Section>
          <Row label={t('account.signedIn', { email: user.email })} desc={status === 'syncing' ? t('account.syncing') : t('account.lastSync', { time: lastSync ? new Date(lastSync).toLocaleString(locale) : t('account.never') })}>
            <button type="button" className="btn" onClick={() => syncNow()} disabled={status === 'syncing'}>
              <RefreshCw size={14} className={status === 'syncing' ? 'spin' : ''} /> {t('account.syncNow')}
            </button>
          </Row>
          {status === 'error' && <p className="error">{error}</p>}
          <button type="button" className="btn ghost" onClick={() => client?.auth.signOut()}>
            <LogOut size={14} /> {t('account.signOut')}
          </button>
        </Section>
      )}
      {config && (
        <Section>
          <p className="hint subtle">{config.source === 'build' ? t('account.configFromBuild') : config.url}</p>
          {config.source === 'runtime' && (
            <button
              type="button"
              className="link-btn danger"
              onClick={() => {
                const done = () => {
                  clearRuntimeConfig()
                  location.reload()
                }
                if (client) client.auth.signOut().finally(done)
                else done()
              }}
            >
              {t('account.removeConfig')}
            </button>
          )}
        </Section>
      )}
    </div>
  )
}
