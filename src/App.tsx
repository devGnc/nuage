import { Suspense, lazy, useEffect, useRef } from 'react'
import { installAudioUnlock } from './audio/engine'
import { syncMix, usePlayback } from './audio/mixer'
import { PipController } from './components/Pip'
import { SoundsPanel } from './components/SoundsPanel'
import { setMode } from './components/Toolbar'
import { openSettingsDefault } from './components/settings/tabs'
import { loadFont } from './data/fonts'
import { t } from './i18n'
import { setWakeLock, toggleFullscreen } from './lib/browser'
import { fmtCountdown, fmtTimer } from './lib/time'
import { useMountedOnce } from './shell/hooks'
import { MiniTimer } from './shell/MiniTimer'
import { installRouter, useRoute } from './shell/router'
import { SuiteBar } from './shell/SuiteBar'
import { useSettings } from './store/settings'
import { useTimer } from './store/timer'
import { useUI } from './store/ui'
import { initSync } from './sync/sync'
import { THEME_MAP, randomTheme } from './themes/catalog'
import { Background } from './themes/Background'
import { displayMs, isStopwatch, phaseLabelKey, reset, skip, toggle } from './timer/engine'
import { startTicker } from './timer/ticker'
import { PomodoroTool } from './tools/PomodoroTool'
import type { Mode } from './types'

const EspagnolTool = lazy(() => import('./tools/EspagnolTool'))
const SettingsDrawer = lazy(() => import('./components/settings/SettingsDrawer').then((m) => ({ default: m.SettingsDrawer })))

/** Ce qui tourne quel que soit l'outil affiché : timer, sons, synchro, titre de l'onglet. */
function useGlobalEffects() {
  useEffect(() => {
    const stopRouter = installRouter()
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

    // titre de l'onglet : le timer s'il tourne, sinon l'outil affiché
    let lastTitle = ''
    const updateTitle = () => {
      const rt = useTimer.getState()
      const st = useSettings.getState()
      const tool = useRoute.getState().tool
      let title = tool === 'pomodoro' ? 'Nuage' : `${t(`tool.${tool}`)} — Nuage`
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
    }
    updateTitle()
    const unsubT = useTimer.subscribe(updateTitle)
    const unsubR = useRoute.subscribe(updateTitle)

    const onFs = () => useUI.setState({ fullscreen: !!document.fullscreenElement })
    document.addEventListener('fullscreenchange', onFs)
    return () => {
      stopRouter()
      stop()
      unsubA()
      unsubB()
      unsubT()
      unsubR()
      document.removeEventListener('fullscreenchange', onFs)
    }
  }, [])
}

/** Raccourcis : certains marchent partout, les autres seulement dans le Pomodoro. */
function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const ui = useUI.getState()
        if (ui.launcherOpen) ui.closeLauncher()
        else ui.closePanel()
        return
      }
      if (!useSettings.getState().shortcuts) return
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, select, [contenteditable="true"], .ProseMirror')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const ui = useUI.getState()
      if (ui.settingsOpen) return
      const key = e.key.toLowerCase()

      // partout
      switch (key) {
        case 'g': ui.toggleLauncher(); return
        case 'm': ui.togglePanel('sounds'); return
        case 'f': toggleFullscreen(); return
        case 'p': useUI.setState({ pipOpen: !ui.pipOpen }); return
        case ',': openSettingsDefault(); return
      }
      if (useRoute.getState().tool !== 'pomodoro') return

      // dans le Pomodoro
      switch (key) {
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
        case 'n': ui.togglePanel('notes'); break
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
    const quiet = () => {
      const ui = useUI.getState()
      return !ui.panel && !ui.settingsOpen && !ui.launcherOpen
    }
    const wake = () => {
      useUI.setState({ idle: false })
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        if (quiet()) useUI.setState({ idle: true })
      }, 3500)
    }
    const leave = (e: MouseEvent) => {
      if (!e.relatedTarget && quiet()) useUI.setState({ idle: true })
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

function Toast() {
  const toast = useUI((s) => s.toast)
  return toast ? (
    <div className="toast" role="status" key={toast.id}>
      {toast.text}
    </div>
  ) : null
}

/** La suite Nuage : le fond, le lanceur et les éléments communs, autour de l'outil affiché. */
export default function App() {
  const tool = useRoute((s) => s.tool)
  const mode = useSettings((s) => s.mode)
  const accent = useSettings((s) => s.accent)
  const lang = useSettings((s) => s.lang)
  const clockFont = useSettings((s) => s.clockFont)
  const preventSleep = useSettings((s) => s.preventSleep)
  const clearMode = useSettings((s) => s.clearMode)
  const idle = useUI((s) => s.idle)
  const panel = useUI((s) => s.panel)
  const bgVersion = useUI((s) => s.bgVersion)
  const settingsReady = useMountedOnce(useUI((s) => s.settingsOpen))

  useGlobalEffects()
  useShortcuts()
  useClearMode(clearMode && tool === 'pomodoro')

  // en changeant d'outil, les panneaux de l'outil précédent se ferment
  useEffect(() => {
    useUI.getState().closePanel()
    useUI.getState().closeLauncher()
  }, [tool])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent)
  }, [accent])
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  useEffect(() => loadFont(clockFont), [clockFont])
  useEffect(() => setWakeLock(preventSleep), [preventSleep])

  // le Pomodoro garde un fond par mode ; les outils de révision prennent celui du mode Focus
  const bgMode: Mode = tool === 'pomodoro' ? mode : 'focus'

  return (
    <div className={`app tool-${tool} ${tool === 'pomodoro' ? `mode-${mode}` : ''} ${idle ? 'is-idle' : ''} ${panel ? 'has-panel' : ''}`}>
      <Background mode={bgMode} uploadVersion={bgVersion} />
      {tool === 'pomodoro' ? (
        <PomodoroTool />
      ) : (
        <Suspense fallback={null}>
          <EspagnolTool />
        </Suspense>
      )}
      <SuiteBar />
      {tool !== 'pomodoro' && <MiniTimer />}
      <SoundsPanel />
      <Suspense fallback={null}>{settingsReady && <SettingsDrawer />}</Suspense>
      <PipController />
      <Toast />
    </div>
  )
}
