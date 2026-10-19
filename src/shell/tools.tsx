import { Timer } from 'lucide-react'
import type { TKey } from '../i18n'
import type { ToolId } from './router'

export interface ToolDef {
  id: ToolId
  name: TKey
}

/** Ordre d'affichage dans le lanceur. Un nouvel outil s'ajoute ici et dans router.ts. */
export const TOOLS: ToolDef[] = [
  { id: 'pomodoro', name: 'tool.pomodoro' },
  { id: 'espagnol', name: 'tool.espagnol' },
]

/** Icône d'outil, comme une icône d'app : ses couleurs sont fixes, elles ne suivent pas le thème. */
export function ToolIcon({ id, large = false }: { id: ToolId; large?: boolean }) {
  return (
    <span className={`tool-icon tool-icon-${id} ${large ? 'large' : ''}`} aria-hidden="true">
      {id === 'pomodoro' ? <Timer size={large ? 34 : 24} strokeWidth={2.2} /> : <span className="tool-glyph">Es</span>}
    </span>
  )
}
