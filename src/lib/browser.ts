import confetti from 'canvas-confetti'

// ——— Notifications ———

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestNotifications(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported'
  if (Notification.permission === 'granted' || Notification.permission === 'denied') return Notification.permission
  return Notification.requestPermission()
}

export function notify(title: string, body: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  try {
    const n = new Notification(title, { body, icon: './icons/icon-192.png', silent: true, tag: 'nuage-timer' })
    n.onclick = () => {
      window.focus()
      n.close()
    }
  } catch {
    // Certains navigateurs mobiles n'autorisent les notifications que via un service worker.
    navigator.serviceWorker?.ready
      .then((reg) => reg.showNotification(title, { body, icon: './icons/icon-192.png', silent: true, tag: 'nuage-timer' }))
      .catch(() => {})
  }
}

// ——— Écran toujours allumé (Screen Wake Lock) ———

let lock: WakeLockSentinel | null = null
let wanted = false
const listeners = new Set<(active: boolean) => void>()

export function wakeLockSupported() {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator
}

function emit() {
  for (const l of listeners) l(!!lock)
}

async function acquire() {
  if (!wakeLockSupported() || lock || document.visibilityState !== 'visible') return
  try {
    lock = await navigator.wakeLock.request('screen')
    lock.addEventListener('release', () => {
      lock = null
      emit()
    })
    emit()
  } catch {
    lock = null
    emit()
  }
}

export function setWakeLock(on: boolean) {
  wanted = on
  if (on) acquire()
  else if (lock) {
    lock.release().catch(() => {})
    lock = null
    emit()
  }
}

export function onWakeLockChange(fn: (active: boolean) => void) {
  listeners.add(fn)
  fn(!!lock)
  return () => {
    listeners.delete(fn)
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (wanted && document.visibilityState === 'visible') acquire()
  })
}

// ——— Plein écran ———

export function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  else document.documentElement.requestFullscreen?.().catch(() => {})
}

// ——— Confettis ———

export function celebrate(accent: string) {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduce) return
  confetti({ particleCount: 90, spread: 75, startVelocity: 38, origin: { y: 0.65 }, colors: [accent, '#ffffff', '#ffd6a5', '#bde0fe', '#ffc8dd'], disableForReducedMotion: true })
}

// ——— Téléchargement de fichier ———

export function downloadText(filename: string, text: string, type = 'text/plain') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
