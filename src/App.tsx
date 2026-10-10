import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { installAudioUnlock } from './audio/engine'
import { syncMix, usePlayback } from './audio/mixer'
import { AmbientView, FocusView } from './components/FocusView'
import { HomeView } from './components/HomeView'
import { PipController } from './components/Pip'
import { QuoteLine } from './components/QuoteLine'
import { SoundsPanel } from './components/SoundsPanel'
import { TasksPanel } from './components/TasksPanel'
import { Toolbar, openSettingsDefault, setMode } from './components/Toolbar'
import { loadFont } from './data/fonts'
import { t } from './i18n'
import { setWakeLock, toggleFullscreen } from './lib/browser'
import { fmtCountdown, fmtTimer } from './lib/time'
import { useSettings } from './store/settings'
import { useTimer } from './store/timer'
import { useUI } from './store/ui'
import { initSync } from './sync/sync'
import { THEME_MAP, randomTheme } from './themes/catalog'
import { Background } from './themes/Background'
import { displayMs, isStopwatch, phaseLabelKey, reset, skip, toggle } from './timer/engine'
import { startTicker } from './timer/ticker'
import type { Mode } from './types'

function useGlobalEffects() {
  useEffect(() => {
    const stop = startTicker()
    installAudioUnlock()
    initSync()

    // thème aléatoire au chargement
    const s = useSettings.getState()
    if (s.randomizer !== 'off') {
      const themes = { ...s.themes }
      for (const m of ['home', 'focus', 'ambient'] as Mode[]) if (THEME_MAP.has(themes[m]) || themes[m] === 'aube') themes[m] = randomTheme(s.randomizer, themes[m])
      s.set({ themes })
    }

    // mixeur audio ↔ réglages
    const sync = () => {
      const st = useSettings.getState()
      syncMix(st.mix, st.masterVolume, usePlayback.getState().playing)
    }
    const unsubA = useSettings.subscribe((a, b) => {
      if (a.mix !== b.mix || a.masterVolume !== b.masterVolume) sync()
      if (Object.keys(a.mix).length === 0 && usePlayback.getState().playing) usePlayback.setState({ playing: false })
    })
    const unsubB = usePlayback.subscribe((a, b) => a.playing !== b.playing && sync())

    // titre de l'onglet
    let lastTitle = ''
    const unsubT = useTimer.subscribe((rt) => {
      const st = useSettings.getState()
      let title = 'Nuage'
      if (st.titleTime && rt.status !== 'idle') {
        const ms = displayMs(rt)
        const text = isStopwatch() ? fmtTimer(ms) : fmtCountdown(ms)
        const label = st.timerMode === 'stopwatch' ? t('phase.stopwatch') : t(phaseLabelKey(st.timerMode, rt.phase))
        title = `${rt.status === 'paused' ? '⏸ ' : ''}${text} · ${label} — Nuage`
      }
      if (title !== lastTitle) {
        document.title = title
        lastTitle = title
      }
    })

    const onFs = () => useUI.setState({ fullscreen: !!document.fullscreenElement })
    document.addEventListener('fullscreenchange', onFs)
    return () => {
      stop()
      unsubA()
      unsubB()
      unsubT()
      document.removeEventListener('fullscreenchange', onFs)
    }
  }, [])
}

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useUI.getState().closePanel()
        return
      }
      if (!useSettings.getState().shortcuts) return
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, select, [contenteditable="true"], .ProseMirror')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (useUI.getState().settingsOpen) return
      const ui = useUI.getState()
      switch (e.key.toLowerCase()) {
        case ' ':
          if (el.tagName === 'BUTTON') return
          e.preventDefault()
          toggle()
          break
        case 'r': reset(); break
        case 's': skip(); break
        case '1': setMode('home'); break
        case '2': setMode('focus'); break
        case '3': setMode('ambient'); break
        case 't': ui.togglePanel('tasks'); break
        case 'm': ui.togglePanel('sounds'); break
        case 'n': ui.togglePanel('notes'); break
        case 'f': toggleFullscreen(); break
        case 'p': useUI.setState({ pipOpen: !ui.pipOpen }); break
        case ',': openSettingsDefault(); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

/** Mode épuré : on masque l'interface après quelques secondes d'inactivité ou si la souris sort. */
function useClearMode(enabled: boolean) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!enabled) {
      useUI.setState({ idle: false })
      return
    }
    const wake = () => {
      useUI.setState({ idle: false })
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        const ui = useUI.getState()
        if (!ui.panel && !ui.settingsOpen) useUI.setState({ idle: true })
      }, 3500)
    }
    const leave = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        const ui = useUI.getState()
        if (!ui.panel && !ui.settingsOpen) useUI.setState({ idle: true })
      }
    }
    wake()
    window.addEventListener('mousemove', wake)
    window.addEventListener('keydown', wake)
    window.addEventListener('pointerdown', wake)
    document.addEventListener('mouseout', leave)
    return () => {
      if (timer.current) clearTimeout(timer.current)
      window.removeEventListener('mousemove', wake)
      window.removeEventListener('keydown', wake)
      window.removeEventListener('pointerdown', wake)
      document.removeEventListener('mouseout', leave)
    }
  }, [enabled])
}

const NotesPanel = lazy(() => import('./components/NotesPanel').then((m) => ({ default: m.NotesPanel })))
const SettingsDrawer = lazy(() => import('./components/settings/SettingsDrawer').then((m) => ({ default: m.SettingsDrawer })))

/** Monte un composant lourd seulement après sa première ouverture. */
function useMountedOnce(open: boolean) {
  const [mounted, setMounted] = useState(open)
  useEffect(() => {
    if (open) setMounted(true)
  }, [open])
  return mounted || open
}

function Toast() {
  const toast = useUI((s) => s.toast)
  return toast ? (
    <div className="toast" role="status" key={toast.id}>
      {toast.text}
    </div>
  ) : null
}

export default function App() {
  const mode = useSettings((s) => s.mode)
  const accent = useSettings((s) => s.accent)
  const lang = useSettings((s) => s.lang)
  const clockFont = useSettings((s) => s.clockFont)
  const preventSleep = useSettings((s) => s.preventSleep)
  const clearMode = useSettings((s) => s.clearMode)
  const quotesFocus = useSettings((s) => s.quotesFocus)
  const quotesHome = useSettings((s) => s.quotesHome)
  const idle = useUI((s) => s.idle)
  const panel = useUI((s) => s.panel)
  const bgVersion = useUI((s) => s.bgVersion)
  const settingsOpen = useUI((s) => s.settingsOpen)
  const notesReady = useMountedOnce(panel === 'notes')
  const settingsReady = useMountedOnce(settingsOpen)

  useGlobalEffects()
  useShortcuts()
  useClearMode(clearMode)

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent)
  }, [accent])
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  useEffect(() => loadFont(clockFont), [clockFont])
  useEffect(() => setWakeLock(preventSleep), [preventSleep])

  const showQuote = (mode === 'focus' && quotesFocus) || (mode === 'home' && quotesHome)

  return (
    <div className={`app mode-${mode} ${idle ? 'is-idle' : ''} ${panel ? 'has-panel' : ''}`}>
      <Background mode={mode} uploadVersion={bgVersion} />
      <main
        className="stage"
        onClick={(e) => {
          const el = e.target as HTMLElement
          if (el === e.currentTarget || el.classList.contains('center')) useUI.getState().closePanel()
        }}
      >
        <header className="top">
          <span className="wordmark">nuage</span>
          {showQuote && <QuoteLine />}
        </header>
        <div className="center">
          {mode === 'home' && <HomeView />}
          {mode === 'focus' && <FocusView />}
          {mode === 'ambient' && <AmbientView />}
        </div>
        <Toolbar />
      </main>
      <TasksPanel />
      <SoundsPanel />
      <Suspense fallback={null}>
        {notesReady && <NotesPanel />}
        {settingsReady && <SettingsDrawer />}
      </Suspense>
      <PipController />
      <Toast />
    </div>
  )
}
