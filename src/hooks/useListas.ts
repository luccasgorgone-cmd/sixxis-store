'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Favoritos ─────────────────────────────────────────────────────────────────
interface FavoritosStore {
  ids: string[]
  toggle: (id: string) => void
  remover: (id: string) => void
  limpar: () => void
}

export const useFavoritos = create<FavoritosStore>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) => set((s) => ({
        ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id],
      })),
      remover: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
      limpar: () => set({ ids: [] }),
    }),
    { name: 'sixxis-favoritos' },
  ),
)

// ── Comparador (máx 3) ────────────────────────────────────────────────────────
interface ComparadorStore {
  ids: string[]
  toggle: (id: string) => void
  remover: (id: string) => void
  limpar: () => void
}

export const useComparador = create<ComparadorStore>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) => set((s) => {
        if (s.ids.includes(id)) return { ids: s.ids.filter((x) => x !== id) }
        if (s.ids.length >= 3) return { ids: [...s.ids.slice(1), id] }
        return { ids: [...s.ids, id] }
      }),
      remover: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
      limpar: () => set({ ids: [] }),
    }),
    { name: 'sixxis-comparador' },
  ),
)

// ── Vistos recentemente (máx 8) ───────────────────────────────────────────────
interface VistosStore {
  ids: string[]
  registrar: (id: string) => void
  limpar: () => void
}

export const useVistos = create<VistosStore>()(
  persist(
    (set) => ({
      ids: [],
      registrar: (id) => set((s) => ({
        ids: [id, ...s.ids.filter((x) => x !== id)].slice(0, 8),
      })),
      limpar: () => set({ ids: [] }),
    }),
    { name: 'sixxis-vistos' },
  ),
)
