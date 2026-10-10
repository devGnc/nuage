export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

/** L'événement d'installation arrive tôt : on le capte dès le chargement. */
export let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    listeners.forEach((l) => l())
  })
}

export function onInstallable(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export async function promptInstall() {
  await deferredPrompt?.prompt()
  deferredPrompt = null
}
