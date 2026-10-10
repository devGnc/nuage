import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Phase } from '../types'

export type TimerStatus = 'idle' | 'running' | 'paused'

export interface TimerRuntime {
  phase: Phase
  status: TimerStatus
  /** Fin prévue du segment quand il tourne (modes à rebours). */
  endAt: number | null
  /** Temps restant quand le segment est en pause. */
  remaining: number
  /** Temps cumulé du chronomètre hors exécution en cours. */
  elapsed: number
  /** Début de l'exécution en cours. */
  runStart: number | null
  /** Temps réellement écoulé dans le segment, hors exécution en cours. */
  segRunMs: number
  segStartedAt: number | null
  /** Sessions de focus terminées dans le cycle Pomodoro en cours. */
  cycle: number
  /** Horloge partagée, mise à jour par le ticker (non persistée). */
  now: number
}

export const initialRuntime: Omit<TimerRuntime, 'now'> = {
  phase: 'focus',
  status: 'idle',
  endAt: null,
  remaining: 0,
  elapsed: 0,
  runStart: null,
  segRunMs: 0,
  segStartedAt: null,
  cycle: 0,
}

export const useTimer = create<TimerRuntime>()(
  persist(() => ({ ...initialRuntime, now: Date.now() }), {
    name: 'nuage:timer',
    version: 1,
    partialize: ({ now, ...rest }) => rest,
  }),
)
