import { tick } from './engine'

/**
 * Les navigateurs ralentissent fortement setInterval dans les onglets en arrière-plan.
 * Un Web Worker n'est pas soumis au même bridage : il réveille le timer à l'heure.
 */
export function startTicker() {
  let worker: Worker | null = null
  try {
    const code = 'setInterval(function(){postMessage(0)},250)'
    const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }))
    worker = new Worker(url)
    worker.onmessage = () => tick()
  } catch {
    worker = null
  }
  const fallback = worker ? null : window.setInterval(() => tick(), 250)
  const onVis = () => tick()
  document.addEventListener('visibilitychange', onVis)
  window.addEventListener('focus', onVis)
  return () => {
    worker?.terminate()
    if (fallback) clearInterval(fallback)
    document.removeEventListener('visibilitychange', onVis)
    window.removeEventListener('focus', onVis)
  }
}
