import { Grip, Settings } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { openSettingsDefault } from '../components/settings/tabs'
import { useT } from '../i18n'
import { useUI } from '../store/ui'
import { goTo, useRoute } from './router'
import { TOOLS, ToolIcon } from './tools'

/** Coin haut gauche : le bouton grille qui ouvre le lanceur d'outils, et le nom de la suite. */
export function SuiteBar() {
  const t = useT()
  const tool = useRoute((s) => s.tool)
  const open = useUI((s) => s.launcherOpen)
  const ref = useRef<HTMLDivElement>(null)
  const menu = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    // au clavier, on arrive directement sur l'outil en cours
    menu.current?.querySelector<HTMLButtonElement>('.suite-tile[aria-current]')?.focus({ preventScroll: true })
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) useUI.getState().closeLauncher()
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  return (
    <div className="suite-bar" ref={ref}>
      <button
        type="button"
        className={`suite-launcher ${open ? 'active' : ''}`}
        aria-expanded={open}
        aria-controls="suite-menu"
        aria-label={t('suite.launcher')}
        title={t('suite.launcher')}
        onClick={() => useUI.getState().toggleLauncher()}
      >
        <Grip size={18} />
      </button>
      <span className="wordmark">nuage</span>
      <div
        id="suite-menu"
        ref={menu}
        className={`suite-menu ${open ? 'open' : ''}`}
        role="dialog"
        aria-label={t('suite.tools')}
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        <div className="suite-tiles">
          {TOOLS.map((d) => (
            <button
              key={d.id}
              type="button"
              className="suite-tile"
              aria-current={tool === d.id ? 'page' : undefined}
              onClick={() => {
                useUI.getState().closeLauncher()
                goTo(d.id)
              }}
            >
              <ToolIcon id={d.id} />
              <span>{t(d.name)}</span>
            </button>
          ))}
        </div>
        <button type="button" className="suite-menu-settings" onClick={openSettingsDefault}>
          <Settings size={17} />
          {t('suite.settings')}
        </button>
      </div>
    </div>
  )
}
