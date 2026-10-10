import type { SupabaseClient } from '@supabase/supabase-js'

const RUNTIME_KEY = 'nuage:supabase'

export interface SupaConfig {
  url: string
  key: string
  source: 'build' | 'runtime'
}

export function getConfig(): SupaConfig | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (url && key) return { url, key, source: 'build' }
  try {
    const raw = localStorage.getItem(RUNTIME_KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as { url: string; key: string }
    if (c.url && c.key) return { ...c, source: 'runtime' }
  } catch {
    /* config illisible */
  }
  return null
}

export function saveRuntimeConfig(url: string, key: string) {
  localStorage.setItem(RUNTIME_KEY, JSON.stringify({ url: url.trim().replace(/\/$/, ''), key: key.trim() }))
  client = null
  loading = null
}

export function clearRuntimeConfig() {
  localStorage.removeItem(RUNTIME_KEY)
  client = null
  loading = null
}

let client: SupabaseClient | null = null
let loading: Promise<SupabaseClient | null> | null = null

/** Charge le SDK Supabase à la demande : il n'alourdit pas l'app pour ceux qui ne s'en servent pas. */
export function loadSupa(): Promise<SupabaseClient | null> {
  if (client) return Promise.resolve(client)
  if (loading) return loading
  const c = getConfig()
  if (!c) return Promise.resolve(null)
  loading = import('@supabase/supabase-js').then(({ createClient }) => {
    client = createClient(c.url, c.key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'nuage:auth', flowType: 'pkce' },
    })
    return client
  })
  return loading
}

/** Client déjà chargé (ou null). */
export function supa(): SupabaseClient | null {
  return client
}

export const appUrl = () => location.origin + location.pathname
