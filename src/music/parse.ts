export type Provider = 'youtube' | 'spotify' | 'soundcloud' | 'apple' | 'deezer'

export interface ParsedMusic {
  provider: Provider
  /** URL d'intégration (iframe) pour les services hors YouTube. */
  embed?: string
  videoId?: string
  listId?: string
  /** Hauteur conseillée du lecteur intégré. */
  height: number
}

export function parseMusicUrl(raw: string): ParsedMusic | null {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  const host = url.hostname.replace(/^www\.|^m\./, '')
  const path = url.pathname

  if (host === 'youtu.be') {
    const id = path.slice(1).split('/')[0]
    return id ? { provider: 'youtube', videoId: id, listId: url.searchParams.get('list') || undefined, height: 200 } : null
  }
  if (host === 'youtube.com' || host === 'music.youtube.com' || host === 'youtube-nocookie.com') {
    const list = url.searchParams.get('list') || undefined
    const v = url.searchParams.get('v')
    if (v) return { provider: 'youtube', videoId: v, listId: list, height: 200 }
    const m = path.match(/^\/(?:live|shorts|embed)\/([\w-]{6,})/)
    if (m) return { provider: 'youtube', videoId: m[1], listId: list, height: 200 }
    if (list) return { provider: 'youtube', listId: list, height: 200 }
    return null
  }
  if (host === 'open.spotify.com') {
    const m = path.match(/^\/(?:intl-[a-z-]+\/)?(playlist|album|track|episode|show|artist)\/([A-Za-z0-9]+)/)
    if (!m) return null
    const tall = m[1] === 'playlist' || m[1] === 'album' || m[1] === 'artist' || m[1] === 'show'
    return { provider: 'spotify', embed: `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0`, height: tall ? 352 : 152 }
  }
  if (host === 'soundcloud.com' || host === 'on.soundcloud.com') {
    return { provider: 'soundcloud', embed: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.href)}&color=%238b9cff&auto_play=true&visual=true`, height: 300 }
  }
  if (host === 'music.apple.com') {
    return { provider: 'apple', embed: `https://embed.music.apple.com${path}${url.search}`, height: path.includes('/song/') ? 175 : 450 }
  }
  if (host === 'deezer.com') {
    const m = path.match(/^\/(?:[a-z]{2}\/)?(playlist|album|track|artist)\/(\d+)/)
    if (!m) return null
    return { provider: 'deezer', embed: `https://widget.deezer.com/widget/dark/${m[1]}/${m[2]}`, height: m[1] === 'track' ? 150 : 350 }
  }
  return null
}

export function defaultName(raw: string): string {
  const p = parseMusicUrl(raw)
  if (!p) return raw
  const names: Record<Provider, string> = { youtube: 'YouTube', spotify: 'Spotify', soundcloud: 'SoundCloud', apple: 'Apple Music', deezer: 'Deezer' }
  try {
    const u = new URL(raw)
    const last = u.pathname.split('/').filter(Boolean).pop() || ''
    return p.provider === 'youtube' ? names.youtube : `${names[p.provider]} · ${decodeURIComponent(last).slice(0, 24)}`
  } catch {
    return names[p.provider]
  }
}

export const LIBRARY: { id: string; emoji: string; name: { fr: string; en: string }; by: string; url: string }[] = [
  { id: 'lofi', emoji: '📚', name: { fr: 'Lofi pour étudier', en: 'Lofi to study' }, by: 'Lofi Girl · YouTube', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk' },
  { id: 'chillhop', emoji: '🐾', name: { fr: 'Jazz & lofi', en: 'Jazzy lofi' }, by: 'Chillhop Music · YouTube', url: 'https://www.youtube.com/watch?v=5yx6BWlEVcY' },
  { id: 'synthwave', emoji: '🌌', name: { fr: 'Synthwave', en: 'Synthwave' }, by: 'Lofi Girl · YouTube', url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY' },
  { id: 'sleep', emoji: '💤', name: { fr: 'Lofi douce', en: 'Sleepy lofi' }, by: 'Lofi Girl · YouTube', url: 'https://www.youtube.com/watch?v=rUxyKA_-grg' },
  { id: 'piano', emoji: '🎹', name: { fr: 'Piano apaisant', en: 'Peaceful piano' }, by: 'Spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO' },
  { id: 'deepfocus', emoji: '🧠', name: { fr: 'Concentration', en: 'Deep focus' }, by: 'Spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ' },
  { id: 'lofibeats', emoji: '🎧', name: { fr: 'Lofi beats', en: 'Lofi beats' }, by: 'Spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn' },
  { id: 'jazz', emoji: '🎷', name: { fr: 'Jazz en fond', en: 'Background jazz' }, by: 'Spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DWV7EzJMK2FUI' },
  { id: 'classical', emoji: '🎻', name: { fr: 'Classique', en: 'Classical' }, by: 'Spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DWWEJlAGA9gs0' },
]
