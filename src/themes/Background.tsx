import { useEffect, useLayoutEffect, useState } from 'react'
import { loadBlob } from '../lib/idb'
import { useSettings } from '../store/settings'
import type { Mode } from '../types'
import { AnimatedLayer } from './Animated'
import { THEME_MAP, UPLOAD_ID, URL_PREFIX, YT_PREFIX, type ThemeDef } from './catalog'

export function useUploadUrl(mode: Mode, enabled: boolean, version = 0) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!enabled) {
      setUrl(null)
      return
    }
    let obj: string | null = null
    let cancelled = false
    loadBlob(`bg-${mode}`).then((b) => {
      if (cancelled || !b) return
      obj = URL.createObjectURL(b)
      setUrl(obj)
    })
    return () => {
      cancelled = true
      if (obj) URL.revokeObjectURL(obj)
    }
  }, [mode, enabled, version])
  return url
}

export function resolveTheme(id: string): ThemeDef | null {
  return THEME_MAP.get(id) ?? null
}

/** Encre (couleur du texte) adaptée au fond. */
export function themeInk(id: string): 'light' | 'dark' {
  return THEME_MAP.get(id)?.ink === 'dark' ? 'dark' : 'light'
}

const HEX = /#[0-9a-f]{3,8}\b/gi

/** Couleurs du haut et du bas du fond : début et fin du dernier dégradé linéaire, sinon sa dernière couleur. */
function themeEdges(id: string): { top: string; bottom: string } {
  if (id.startsWith(YT_PREFIX)) return { top: '#000', bottom: '#000' }
  if (id === UPLOAD_ID || id.startsWith(URL_PREFIX)) return { top: '#111', bottom: '#111' }
  const bg = (THEME_MAP.get(id) ?? THEME_MAP.get('aube')!).bg
  const linear = (bg.match(/linear-gradient\((?:[^()]|\([^()]*\))*\)/g) ?? []).map((g) => g.match(HEX)).filter((h): h is RegExpMatchArray => h !== null)
  const stops = linear[linear.length - 1]
  if (stops) return { top: stops[0], bottom: stops[stops.length - 1] }
  const all = bg.match(HEX)
  const c = all ? all[all.length - 1] : '#0f1226'
  return { top: c, bottom: c }
}

/** Assombrit une couleur comme le voile noir posé sur le fond. */
function shade(hex: string, dim: number): string {
  let h = hex.slice(1)
  if (h.length <= 4) h = [...h].map((c) => c + c).join('')
  const [r, g, b] = [0, 2, 4].map((i) => Math.round(parseInt(h.slice(i, i + 2), 16) * (1 - dim)))
  return `rgb(${r}, ${g}, ${b})`
}

export function YouTubeBackground({ id }: { id: string }) {
  const src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&playsinline=1&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1`
  return (
    <div className="bg-video" aria-hidden="true">
      <iframe src={src} title="background video" allow="autoplay; encrypted-media" tabIndex={-1} />
    </div>
  )
}

export function Background({ mode, uploadVersion }: { mode: Mode; uploadVersion: number }) {
  const themeId = useSettings((s) => s.themes[mode])
  const dim = useSettings((s) => s.dim[mode])
  const blur = useSettings((s) => s.blur[mode])
  const still = useSettings((s) => s.disableAnimated)
  const uploadUrl = useUploadUrl(mode, themeId === UPLOAD_ID, uploadVersion)

  useEffect(() => {
    document.documentElement.dataset.ink = themeInk(themeId)
  }, [themeId])

  const edges = themeEdges(themeId)
  const top = shade(edges.top, dim)
  const bottom = shade(edges.bottom, dim)

  // couleur de la page, visible là où le fond ne va pas
  useLayoutEffect(() => {
    document.documentElement.style.backgroundColor = bottom
  }, [bottom])

  let layer: React.ReactNode = null
  const def = resolveTheme(themeId)
  if (themeId === UPLOAD_ID) {
    layer = uploadUrl ? <div className="bg-layer" style={{ background: `#111 url("${uploadUrl}") center / cover no-repeat` }} /> : <div className="bg-layer" style={{ background: '#111' }} />
  } else if (themeId.startsWith(URL_PREFIX)) {
    const url = themeId.slice(URL_PREFIX.length).replace(/"/g, '%22')
    layer = <div className="bg-layer" style={{ background: `#111 url("${url}") center / cover no-repeat` }} />
  } else if (themeId.startsWith(YT_PREFIX)) {
    layer = (
      <>
        <div className="bg-layer" style={{ background: '#000' }} />
        <YouTubeBackground id={themeId.slice(YT_PREFIX.length)} />
      </>
    )
  } else if (def) {
    layer = (
      <>
        <div
          className={`bg-layer ${def.anim === 'flow' && !still ? 'bg-flow' : ''}`}
          style={{ background: def.bg, backgroundSize: def.size }}
        />
        {def.anim && def.anim !== 'flow' && <AnimatedLayer kind={def.anim} themeId={def.id} still={still} />}
      </>
    )
  } else {
    layer = <div className="bg-layer" style={{ background: THEME_MAP.get('aube')!.bg }} />
  }

  return (
    <>
      <div className="bg" key={themeId + mode} style={{ filter: blur ? `blur(${blur}px)` : undefined, transform: blur ? 'scale(1.05)' : undefined }}>
        {layer}
        <div className="bg-grain" />
        <div className="bg-dim" style={{ opacity: dim }} />
      </div>
      {/* hors de .bg : son flou (transform) décalerait ces éléments fixes */}
      <div className="bg-edge bg-edge-top" style={{ backgroundColor: top }} />
      <div className="bg-edge bg-edge-bottom" style={{ backgroundColor: bottom }} />
    </>
  )
}
