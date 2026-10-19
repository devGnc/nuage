import { ImageUp, Shuffle } from 'lucide-react'
import { useRef, useState } from 'react'
import { useLang, useT } from '../../i18n'
import { saveBlob } from '../../lib/idb'
import { parseMusicUrl } from '../../music/parse'
import { useRoute } from '../../shell/router'
import { useSettings } from '../../store/settings'
import { useUI } from '../../store/ui'
import { useUploadUrl } from '../../themes/Background'
import { THEMES, THEME_CATS, THEME_MAP, UPLOAD_ID, URL_PREFIX, YT_PREFIX, photoUrl, randomTheme, type ThemeCat, type ThemeDef } from '../../themes/catalog'
import type { Mode } from '../../types'
import { Row, Section, Segmented, Select, Slider, ToggleRow } from '../ui'

const ACCENTS = ['#8b9cff', '#a78bfa', '#f472b6', '#fb7185', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#38bdf8', '#e2e8f0']

function Thumb({ def, active, onClick, label }: { def: ThemeDef; active: boolean; onClick: () => void; label: string }) {
  const t = useT()
  const bg = def.photo ? `#1c1f2b url(${photoUrl(def.photo.id, 320, 180)}) center / cover` : def.bg
  return (
    <button type="button" className={`thumb ${active ? 'active' : ''}`} onClick={onClick} title={def.photo ? `${label} — ${def.photo.author}` : label}>
      <span className="thumb-img" style={{ background: bg, backgroundSize: def.size && !def.photo ? def.size : undefined }} />
      {def.anim && <span className="thumb-badge">{t('themes.animated')}</span>}
      <span className="thumb-name">{label}</span>
    </button>
  )
}

export function ThemesSettings() {
  const t = useT()
  const lang = useLang()
  const current = useSettings((s) => s.mode)
  // ouvert depuis un outil de révision, on montre le fond qu'il utilise : celui du mode Focus
  const [mode, setMode] = useState<Mode>(useRoute.getState().tool === 'pomodoro' ? current : 'focus')
  const themes = useSettings((s) => s.themes)
  const dim = useSettings((s) => s.dim[mode])
  const blur = useSettings((s) => s.blur[mode])
  const uploads = useSettings((s) => s.uploads)
  const randomizer = useSettings((s) => s.randomizer)
  const accent = useSettings((s) => s.accent)
  const still = useSettings((s) => s.disableAnimated)
  const setFor = useSettings((s) => s.setFor)
  const set = useSettings((s) => s.set)
  const bgVersion = useUI((s) => s.bgVersion)
  const uploadUrl = useUploadUrl(mode, uploads[mode], bgVersion)
  const [cat, setCat] = useState<'all' | ThemeCat>('all')
  const [imgUrl, setImgUrl] = useState('')
  const [ytUrl, setYtUrl] = useState('')
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const selected = themes[mode]

  const pick = (id: string) => setFor('themes', mode, id)

  const onFile = async (f: File | undefined) => {
    if (!f) return
    if (!f.type.startsWith('image/')) return setErr(t('themes.badUrl'))
    if (f.size > 10 * 1024 * 1024) return setErr(t('themes.tooBig'))
    setErr('')
    await saveBlob(`bg-${mode}`, f)
    setFor('uploads', mode, true)
    useUI.getState().bumpBg()
    pick(UPLOAD_ID)
  }

  const applyUrl = () => {
    try {
      const u = new URL(imgUrl.trim())
      if (!/^https?:$/.test(u.protocol)) throw new Error()
      pick(URL_PREFIX + u.href)
      setErr('')
    } catch {
      setErr(t('themes.badUrl'))
    }
  }

  const applyYt = () => {
    const p = parseMusicUrl(ytUrl)
    if (p?.provider === 'youtube' && p.videoId) {
      pick(YT_PREFIX + p.videoId)
      setErr('')
    } else setErr(t('themes.badUrl'))
  }

  const applyToAll = () => {
    for (const m of ['home', 'focus', 'ambient'] as Mode[]) {
      setFor('dim', m, dim)
      setFor('blur', m, blur)
      if (selected !== UPLOAD_ID) setFor('themes', m, selected)
    }
  }

  const def = THEME_MAP.get(selected)
  const previewBg =
    selected === UPLOAD_ID ? (uploadUrl ? `#111 url("${uploadUrl}") center / cover` : '#111')
    : selected.startsWith(URL_PREFIX) ? `#111 url("${selected.slice(URL_PREFIX.length)}") center / cover`
    : selected.startsWith(YT_PREFIX) ? `#000 url(https://i.ytimg.com/vi/${selected.slice(YT_PREFIX.length)}/hqdefault.jpg) center / cover`
    : def?.photo ? `#1c1f2b url(${photoUrl(def.photo.id, 640, 360)}) center / cover`
    : def?.bg ?? '#111'

  const cats = cat === 'all' ? THEME_CATS : [cat]

  return (
    <div className="settings-page">
      <Section>
        <Row label={t('extras.accent')}>
          <div className="accent-row">
            {ACCENTS.map((c) => (
              <button key={c} type="button" className={`color-opt ${accent === c ? 'active' : ''}`} style={{ background: c }} onClick={() => set({ accent: c })} aria-label={c} />
            ))}
            <input type="color" className="color-input" value={accent} onChange={(e) => set({ accent: e.target.value })} aria-label={t('extras.accent')} />
          </div>
        </Row>
        <ToggleRow label={t('extras.animated')} desc={t('extras.animatedDesc')} checked={still} onChange={(v) => set({ disableAnimated: v })} />
      </Section>

      <Section title={t('themes.backgrounds')} desc={t('themes.backgroundsDesc')}>
        <Segmented
          value={mode}
          onChange={setMode}
          options={(['home', 'focus', 'ambient'] as Mode[]).map((m) => ({ value: m, label: t(`mode.${m}`) }))}
        />
      </Section>
      <div className="theme-preview" style={{ background: previewBg, backgroundSize: def?.size }}>
        <span className="theme-preview-dim" style={{ opacity: dim, backdropFilter: blur ? `blur(${blur / 2}px)` : undefined }} />
        <span className="theme-preview-time">25:00</span>
        <span className="theme-preview-name">{def ? def.name[lang] : selected === UPLOAD_ID ? t('themes.uploaded') : selected.startsWith(YT_PREFIX) ? 'YouTube' : t('themes.url')}</span>
      </div>

      <Section>
        <div className="slider-row">
          <span>{t('themes.dim')}</span>
          <Slider value={dim} max={0.85} onChange={(v) => setFor('dim', mode, v)} label={t('themes.dim')} />
        </div>
        <div className="slider-row">
          <span>{t('themes.blur')}</span>
          <Slider value={blur} max={24} step={1} onChange={(v) => setFor('blur', mode, v)} label={t('themes.blur')} />
        </div>
        <button type="button" className="link-btn" onClick={applyToAll}>{t('themes.allModes')}</button>
      </Section>

      <Section title={t('themes.custom')}>
        <div
          className="dropzone"
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            onFile(e.dataTransfer.files[0])
          }}
        >
          <ImageUp size={22} />
          <span>{t('themes.drop')}</span>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
        {uploads[mode] && uploadUrl && (
          <button type="button" className={`upload-thumb ${selected === UPLOAD_ID ? 'active' : ''}`} onClick={() => pick(UPLOAD_ID)}>
            <span style={{ background: `url("${uploadUrl}") center / cover` }} />
            {t('themes.uploaded')}
          </button>
        )}
        <p className="hint subtle">{t('themes.localOnly')}</p>
        <form className="url-row" onSubmit={(e) => { e.preventDefault(); applyUrl() }}>
          <input className="input" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder={t('themes.url') + ' (https://…)'} />
          <button type="submit" className="btn">{t('themes.apply')}</button>
        </form>
        <form className="url-row" onSubmit={(e) => { e.preventDefault(); applyYt() }}>
          <input className="input" value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} placeholder={t('themes.youtube') + ' (youtube.com/watch?v=…)'} />
          <button type="submit" className="btn">{t('themes.apply')}</button>
        </form>
        {err && <p className="error">{err}</p>}
      </Section>

      <Section title={t('themes.library')}>
        <div className="randomizer">
          <span>{t('themes.randomizer')}</span>
          <Select
            value={randomizer}
            onChange={(v) => set({ randomizer: v })}
            options={[
              { value: 'off', label: t('common.off') },
              { value: 'all', label: t('themes.cat.all') },
              ...THEME_CATS.map((c) => ({ value: c, label: t(`themes.cat.${c}`) })),
            ]}
          />
          <button type="button" className="btn small" onClick={() => pick(randomTheme(randomizer === 'off' ? 'all' : randomizer, selected))}>
            <Shuffle size={14} /> {t('themes.randomNow')}
          </button>
        </div>
        <div className="chips">
          {(['all', ...THEME_CATS] as const).map((c) => (
            <button key={c} type="button" className={`chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
              {t(`themes.cat.${c}`)}
            </button>
          ))}
        </div>
        {cats.map((c) => (
          <div key={c} className="theme-group">
            {cat === 'all' && <h4 className="sub-title">{t(`themes.cat.${c}`)}</h4>}
            <div className="thumb-grid">
              {THEMES.filter((x) => x.cat === c).map((x) => (
                <Thumb key={x.id} def={x} active={selected === x.id} onClick={() => pick(x.id)} label={x.name[lang]} />
              ))}
            </div>
          </div>
        ))}
        <p className="hint subtle">{t('themes.credit')}</p>
      </Section>
    </div>
  )
}
