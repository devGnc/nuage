import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { useT } from '../i18n'
import { useUI } from '../store/ui'

export function Panel({ open, title, icon, actions, children, className = '', wide }: { open: boolean; title: ReactNode; icon?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; wide?: boolean }) {
  const t = useT()
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    // rend le clavier aux raccourcis quand le panneau se ferme
    if (!open && ref.current?.contains(document.activeElement)) (document.activeElement as HTMLElement).blur()
  }, [open])
  return (
    <section ref={ref} className={`panel ${open ? 'open' : ''} ${wide ? 'wide' : ''} ${className}`} aria-hidden={!open} inert={!open ? true : undefined}>
      <header className="panel-head">
        <div className="panel-title">
          {icon && <span className="panel-icon">{icon}</span>}
          <h2>{title}</h2>
        </div>
        <div className="panel-actions">
          {actions}
          <button type="button" className="icon-btn" aria-label={t('common.close')} title={t('common.close')} onClick={() => useUI.getState().closePanel()}>
            <X size={18} />
          </button>
        </div>
      </header>
      <div className="panel-body">{children}</div>
    </section>
  )
}
