import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface MusicStore {
  /** Lien en cours de lecture (null = rien). */
  current: string | null
  name: string
  play: (url: string, name: string) => void
  stop: () => void
}

export const useMusic = create<MusicStore>()(
  persist(
    (set) => ({
      current: null,
      name: '',
      play: (url, name) => set({ current: url, name }),
      stop: () => set({ current: null, name: '' }),
    }),
    {
      name: 'nuage:music',
      // On ne relance pas la musique au rechargement (autoplay bloqué), on garde juste le dernier lien.
      partialize: () => ({}),
    },
  ),
)
