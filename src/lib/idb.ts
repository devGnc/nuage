import { del, get, set } from 'idb-keyval'
import { createJSONStorage, type StateStorage } from 'zustand/middleware'

const idbState: StateStorage = {
  getItem: async (name) => ((await get<string>(name)) ?? null),
  setItem: async (name, value) => {
    await set(name, value)
  },
  removeItem: async (name) => {
    await del(name)
  },
}

export const idbStorage = createJSONStorage(() => idbState)

export async function saveBlob(key: string, blob: Blob) {
  await set(key, blob)
}

export async function loadBlob(key: string): Promise<Blob | undefined> {
  return get<Blob>(key)
}

export async function removeBlob(key: string) {
  await del(key)
}
