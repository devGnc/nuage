import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { t as translate, useT } from '../i18n'
import { fmtCountdown, fmtTimer } from '../lib/time'
import { useSettings } from '../store/settings'
import { currentTask, useTasks } from '../store/tasks'
import { useTimer } from '../store/timer'
import { useUI } from '../store/ui'
import { displayMs, isStopwatch, phaseLabelKey, progressOf, toggle } from '../timer/engine'

interface DocPiP {
  requestWindow: (opts: { width: number; height: number }) => Promise<Window>
  window: Window | null
}

declare global {
  interface Window {
    documentPictureInPicture?: DocPiP
  }
}

function copyStyles(target: Document) {
  for (const sheet of [...document.styleSheets]) {
    try {
      const css = [...sheet.cssRules].map((r) => r.cssText).join('\n')
      const style = target.createElement('style')
      style.textContent = css
      target.head.appendChild(style)
    } catch {
      if (sheet.href) {
        const link = target.createElement('link')
        link.rel = 'stylesheet'
        link.href = sheet.href
        target.head.appendChild(link)
      }
    }
  }
}

function labelFor() {
  const mode = useSettings.getState().timerMode
  const phase = useTimer.getState().phase
  if (mode === 'stopwatch') return translate('phase.stopwatch')
  if (mode === 'countdown') return translate('phase.countdown')
  return translate(phaseLabelKey(mode, phase))
}

function PipView() {
  const t = useT()
  const rt = useTimer()
  const showTask = useSettings((s) => s.pipShowTask)
  const accent = useSettings((s) => s.accent)
  const tasks = useTasks((s) => s.tasks)
  const task = currentTask(tasks)
  const ms = displayMs(rt)
  const text = isStopwatch() ? fmtTimer(ms) : fmtCountdown(ms)
  const running = rt.status === 'running'
  return (
    <div className="pip-root" style={{ ['--accent' as string]: accent }}>
      <div className="pip-phase">{labelFor()}</div>
      <div className="pip-time">{text}</div>
      {showTask && task && <div className="pip-task">{task.emoji} {task.title}</div>}
      <div className="pip-bar"><span style={{ width: `${progressOf(rt) * 100}%` }} /></div>
      <button type="button" className="pip-btn" onClick={toggle} aria-label={running ? t('ctl.pause') : t('ctl.start')}>
        {running ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
      </button>
    </div>
  )
}

/** Repli pour Safari : une vidéo dessinée sur un canvas, en image dans l'image classique. */
async function openVideoPip(onClose: () => void): Promise<() => void> {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 360
  const c = canvas.getContext('2d')!
  const draw = () => {
    const rt = useTimer.getState()
    const s = useSettings.getState()
    const ms = displayMs(rt)
    const text = isStopwatch() ? fmtTimer(ms) : fmtCountdown(ms)
    const g = c.createLinearGradient(0, 0, 640, 360)
    g.addColorStop(0, '#141631')
    g.addColorStop(1, '#2b2266')
    c.fillStyle = g
    c.fillRect(0, 0, 640, 360)
    c.fillStyle = 'rgba(255,255,255,.7)'
    c.font = '600 30px Manrope, sans-serif'
    c.textAlign = 'center'
    c.fillText(labelFor(), 320, 80)
    c.fillStyle = '#fff'
    c.font = '700 150px Outfit, sans-serif'
    c.fillText(text, 320, 230)
    const task = currentTask(useTasks.getState().tasks)
    if (s.pipShowTask && task) {
      c.font = '500 28px Manrope, sans-serif'
      c.fillStyle = 'rgba(255,255,255,.85)'
      c.fillText(`${task.emoji} ${task.title}`.trim().slice(0, 40), 320, 300)
    }
    c.fillStyle = 'rgba(255,255,255,.15)'
    c.fillRect(80, 330, 480, 6)
    c.fillStyle = s.accent
    c.fillRect(80, 330, 480 * progressOf(rt), 6)
  }
  draw()
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.srcObject = canvas.captureStream(4)
  video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;bottom:0;left:0'
  document.body.appendChild(video)
  const id = window.setInterval(draw, 500)
  const cleanup = () => {
    clearInterval(id)
    video.remove()
  }
  video.addEventListener('leavepictureinpicture', () => {
    cleanup()
    onClose()
  })
  await video.play()
  await (video as HTMLVideoElement & { requestPictureInPicture: () => Promise<unknown> }).requestPictureInPicture()
  return () => {
    if (document.pictureInPictureElement === video) document.exitPictureInPicture().catch(() => {})
    cleanup()
  }
}

export function PipController() {
  const open = useUI((s) => s.pipOpen)
  const [win, setWin] = useState<Window | null>(null)
  const closer = useRef<(() => void) | null>(null)

  useEffect(() => {
    let cancelled = false
    const close = () => useUI.setState({ pipOpen: false })
    if (open) {
      if (window.documentPictureInPicture) {
        window.documentPictureInPicture
          .requestWindow({ width: 300, height: 190 })
          .then((w) => {
            if (cancelled) {
              w.close()
              return
            }
            copyStyles(w.document)
            w.document.body.className = 'pip-body'
            w.addEventListener('pagehide', () => {
              setWin(null)
              close()
            })
            setWin(w)
            closer.current = () => w.close()
          })
          .catch(() => close())
      } else if (document.pictureInPictureEnabled) {
        openVideoPip(close)
          .then((fn) => {
            if (cancelled) fn()
            else closer.current = fn
          })
          .catch(() => close())
      } else {
        useUI.getState().showToast(translate('pip.unsupported'))
        close()
      }
    } else {
      closer.current?.()
      closer.current = null
      setWin(null)
    }
    return () => {
      cancelled = true
    }
  }, [open])

  return win ? createPortal(<PipView />, win.document.body) : null
}
