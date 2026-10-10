import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '../lib/id'
import type { Note } from '../types'

interface NotesStore {
  notes: Note[]
  activeId: string
  create: () => string
  update: (id: string, patch: Partial<Note>) => void
  remove: (id: string) => void
  setActive: (id: string) => void
  replaceAll: (notes: Note[]) => void
}

const first: Note = { id: 'note-1', title: '', html: '', updatedAt: Date.now() }

export const useNotes = create<NotesStore>()(
  persist(
    (set, get) => ({
      notes: [first],
      activeId: first.id,
      create: () => {
        const n: Note = { id: uid(), title: '', html: '', updatedAt: Date.now() }
        set((s) => ({ notes: [n, ...s.notes], activeId: n.id }))
        return n.id
      },
      update: (id, patch) =>
        set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)) })),
      remove: (id) =>
        set((s) => {
          let notes = s.notes.filter((n) => n.id !== id)
          if (notes.length === 0) notes = [{ id: uid(), title: '', html: '', updatedAt: Date.now() }]
          return { notes, activeId: s.activeId === id ? notes[0].id : s.activeId }
        }),
      setActive: (id) => set({ activeId: id }),
      replaceAll: (notes) =>
        set(() => {
          const list = notes.length ? notes : [{ id: uid(), title: '', html: '', updatedAt: Date.now() }]
          const activeId = list.some((n) => n.id === get().activeId) ? get().activeId : list[0].id
          return { notes: list, activeId }
        }),
    }),
    { name: 'nuage:notes', version: 1 },
  ),
)

export function noteTitle(n: Note, untitled: string): string {
  if (n.title.trim()) return n.title.trim()
  const text = n.html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
  return text ? text.slice(0, 40) : untitled
}
