import { Headphones, Heart, Music, Pause, Play, Save, Square, Trash2, Volume2 } from 'lucide-react'
import { useState } from 'react'
import { setPlaying, usePlayback } from '../audio/mixer'
import { PRESETS, SOUND_CATEGORIES, SOUNDS, type SoundCategory } from '../audio/sounds'
import { useLang, useT } from '../i18n'
import { uid } from '../lib/id'
import { MusicPlayer } from '../music/MusicPlayer'
import { LIBRARY, defaultName, parseMusicUrl } from '../music/parse'
import { useMusic } from '../music/store'
import { useSettings } from '../store/settings'
import { useUI } from '../store/ui'
import { Panel } from './Panel'
import { Select, Slider } from './ui'

function SoundsTab() {
  const t = useT()
  const lang = useLang()
  const mix = useSettings((s) => s.mix)
  const master = useSettings((s) => s.masterVolume)
  const saved = useSettings((s) => s.savedMixes)
  const set = useSettings((s) => s.set)
  const playing = usePlayback((s) => s.playing)
  const loading = usePlayback((s) => s.loading)
  const [cat, setCat] = useState<'all' | SoundCategory>('all')
  const activeCount = Object.keys(mix).length

  const toggleSound = (id: string) => {
    const next = { ...mix }
    if (id in next && playing) delete next[id]
    else next[id] = next[id] ?? 0.5
    set({ mix: next })
    if (!playing && Object.keys(next).length) setPlaying(true)
  }
  const applyMix = (sounds: Record<string, number>) => {
    set({ mix: { ...sounds } })
    setPlaying(true)
  }
  const saveMix = () => {
    if (!activeCount) return
    const name = window.prompt(t('sounds.mixName'))
    if (!name?.trim()) return
    set({ savedMixes: [...saved, { id: uid(), name: name.trim(), sounds: { ...mix } }] })
  }
  const list = SOUNDS.filter((s) => cat === 'all' || s.cat === cat)
  const hasBinaural = Object.keys(mix).some((id) => id.startsWith('bin-'))

  return (
    <div className="sounds-tab">
      <div className="sounds-toolbar">
        <button type="button" className="pill-btn" onClick={() => setPlaying(!playing)} disabled={!activeCount} aria-label={playing ? t('sounds.pause') : t('sounds.play')}>
          {playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
          <span>{activeCount ? t('sounds.active', { n: activeCount }) : t('sounds.play')}</span>
        </button>
        <div className="master">
          <Volume2 size={16} />
          <Slider value={master} onChange={(v) => set({ masterVolume: v })} label={t('sounds.master')} />
        </div>
        <button type="button" className="icon-btn" onClick={() => set({ mix: {} })} disabled={!activeCount} aria-label={t('sounds.clear')} title={t('sounds.clear')}>
          <Square size={15} />
        </button>
        <button type="button" className="icon-btn" onClick={saveMix} disabled={!activeCount} aria-label={t('sounds.saveMix')} title={t('sounds.saveMix')}>
          <Save size={16} />
        </button>
        <Select
          value={cat}
          onChange={(v) => setCat(v)}
          label="Catégorie"
          options={[{ value: 'all' as const, label: t('sounds.cat.all') }, ...SOUND_CATEGORIES.map((c) => ({ value: c, label: t(`sounds.cat.${c}`) }))]}
        />
      </div>

      <div className="mix-chips">
        {saved.map((m) => (
          <span key={m.id} className="chip mine">
            <button type="button" onClick={() => applyMix(m.sounds)}>💾 {m.name}</button>
            <button type="button" className="chip-x" aria-label={t('common.delete')} onClick={() => set({ savedMixes: saved.filter((x) => x.id !== m.id) })}>×</button>
          </span>
        ))}
        {PRESETS.map((p) => (
          <button key={p.id} type="button" className="chip" onClick={() => applyMix(p.sounds)}>
            {p.name[lang]}
          </button>
        ))}
      </div>

      {hasBinaural && (
        <p className="hint">
          <Headphones size={14} /> {t('sounds.headphones')}
        </p>
      )}

      <div className="sound-grid">
        {list.map((s) => {
          const on = s.id in mix
          const live = on && playing
          return (
            <div key={s.id} className={`sound-tile ${live ? 'on' : on ? 'armed' : ''} ${loading === s.id ? 'loading' : ''}`}>
              <button type="button" className="sound-btn" onClick={() => toggleSound(s.id)} aria-pressed={live} title={s.hint?.[lang]}>
                <span className="sound-emoji">{s.emoji}</span>
                <span className="sound-name">{s.name[lang]}</span>
              </button>
              {on && (
                <Slider value={mix[s.id]} onChange={(v) => set({ mix: { ...mix, [s.id]: v } })} label={s.name[lang]} />
              )}
            </div>
          )
        })}
      </div>
      <p className="hint subtle">{activeCount ? '' : t('sounds.empty') + ' '}{t('sounds.generated')}</p>
    </div>
  )
}

function MusicTab() {
  const t = useT()
  const favorites = useSettings((s) => s.musicFavorites)
  const set = useSettings((s) => s.set)
  const play = useMusic((s) => s.play)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const valid = !!parseMusicUrl(url)

  const load = () => {
    if (!valid) return setError(t('music.invalid'))
    setError('')
    play(url.trim(), defaultName(url.trim()))
  }
  const fav = () => {
    if (!valid) return setError(t('music.invalid'))
    const name = window.prompt(t('music.namePrompt'), defaultName(url.trim()))
    if (name === null) return
    set({ musicFavorites: [...favorites, { id: uid(), name: name.trim() || defaultName(url), url: url.trim() }] })
    setUrl('')
  }
  return (
    <div className="music-tab">
      <form
        className="url-row"
        onSubmit={(e) => {
          e.preventDefault()
          load()
        }}
      >
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t('music.paste')} aria-label={t('music.paste')} />
        <button type="submit" className="btn primary">{t('music.load')}</button>
        <button type="button" className="icon-btn" onClick={fav} aria-label={t('music.fav')} title={t('music.fav')}>
          <Heart size={16} />
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      <h4 className="sub-title">{t('music.favorites')}</h4>
      {favorites.length === 0 ? (
        <p className="hint subtle">{t('music.noFav')}</p>
      ) : (
        <ul className="fav-list">
          {favorites.map((f) => (
            <li key={f.id}>
              <button type="button" className="fav-play" onClick={() => play(f.url, f.name)}>
                <Play size={14} fill="currentColor" /> {f.name}
              </button>
              <button type="button" className="icon-btn" aria-label={t('common.delete')} onClick={() => set({ musicFavorites: favorites.filter((x) => x.id !== f.id) })}>
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function LibraryTab() {
  const t = useT()
  const lang = useLang()
  const play = useMusic((s) => s.play)
  const current = useMusic((s) => s.current)
  return (
    <div className="library-tab">
      <p className="hint subtle">{t('music.libraryHint')}</p>
      <div className="library-grid">
        {LIBRARY.map((l) => (
          <button key={l.id} type="button" className={`library-item ${current === l.url ? 'on' : ''}`} onClick={() => play(l.url, l.name[lang])}>
            <span className="library-emoji">{l.emoji}</span>
            <span className="library-name">{l.name[lang]}</span>
            <span className="library-by">{l.by}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function NowPlaying() {
  const t = useT()
  const current = useMusic((s) => s.current)
  const name = useMusic((s) => s.name)
  const stop = useMusic((s) => s.stop)
  const volume = useSettings((s) => s.musicVolume)
  const set = useSettings((s) => s.set)
  if (!current) return null
  const p = parseMusicUrl(current)
  return (
    <div className="now-playing">
      <div className="now-head">
        <span className="now-label">
          <Music size={14} /> {t('music.now')} · {name}
        </span>
        <button type="button" className="btn small" onClick={stop}>
          {t('music.stop')}
        </button>
      </div>
      {p?.provider === 'youtube' ? (
        <div className="master">
          <Volume2 size={16} />
          <Slider value={volume} onChange={(v) => set({ musicVolume: v })} label={t('music.volume')} />
        </div>
      ) : null}
      <MusicPlayer url={current} />
      {p?.provider === 'spotify' && <p className="hint subtle">{t('music.spotifyHint')}</p>}
    </div>
  )
}

export function SoundsPanel() {
  const t = useT()
  const open = useUI((s) => s.panel === 'sounds')
  const tab = useUI((s) => s.soundsTab)
  const setTab = useUI((s) => s.setSoundsTab)
  return (
    <Panel
      open={open}
      wide
      className="sounds-panel"
      title={
        <span className="tabs" role="tablist">
          {(['sounds', 'music', 'library'] as const).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>
              {t(`sounds.tab.${k}`)}
            </button>
          ))}
        </span>
      }
    >
      {tab === 'sounds' && <SoundsTab />}
      {tab === 'music' && <MusicTab />}
      {tab === 'library' && <LibraryTab />}
      {/* Le lecteur reste monté en permanence pour que la musique continue panneau fermé */}
      <div className={tab === 'sounds' ? 'player-hidden' : ''}>
        <NowPlaying />
      </div>
    </Panel>
  )
}

