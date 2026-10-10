import { useEffect, useRef } from 'react'
import { useSettings } from '../store/settings'
import { parseMusicUrl, type ParsedMusic } from './parse'

interface YTPlayer {
  setVolume: (v: number) => void
  destroy: () => void
  playVideo: () => void
}

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: unknown) => YTPlayer }
    onYouTubeIframeAPIReady?: () => void
  }
}

let ytReady: Promise<void> | null = null
function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve()
  if (ytReady) return ytReady
  ytReady = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(s)
  })
  return ytReady
}

function YouTubePlayer({ p }: { p: ParsedMusic }) {
  const host = useRef<HTMLDivElement>(null)
  const player = useRef<YTPlayer | null>(null)
  const volume = useSettings((s) => s.musicVolume)

  useEffect(() => {
    let cancelled = false
    const mount = document.createElement('div')
    host.current?.appendChild(mount)
    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT) return
      const playerVars: Record<string, unknown> = { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 }
      if (p.listId) {
        playerVars.listType = 'playlist'
        playerVars.list = p.listId
      }
      player.current = new window.YT.Player(mount, {
        width: '100%',
        height: '100%',
        videoId: p.videoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars,
        events: {
          onReady: (e: { target: YTPlayer }) => {
            e.target.setVolume(Math.round(useSettings.getState().musicVolume * 100))
            e.target.playVideo()
          },
        },
      })
    })
    return () => {
      cancelled = true
      try {
        player.current?.destroy()
      } catch {
        /* rien */
      }
      player.current = null
      mount.remove()
    }
  }, [p.videoId, p.listId])

  useEffect(() => {
    try {
      player.current?.setVolume(Math.round(volume * 100))
    } catch {
      /* lecteur pas encore prêt */
    }
  }, [volume])

  return <div ref={host} className="yt-host" style={{ height: p.height }} />
}

export function MusicPlayer({ url }: { url: string }) {
  const p = parseMusicUrl(url)
  if (!p) return null
  if (p.provider === 'youtube') return <YouTubePlayer key={url} p={p} />
  return (
    <iframe
      key={url}
      className="music-frame"
      src={p.embed}
      height={p.height}
      title="music"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
    />
  )
}
