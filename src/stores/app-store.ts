import { create } from 'zustand'

type AppState = {
  selectedTaskId: string | null
  setSelectedTask: (id: string | null) => void
  isInspectorOpen: boolean
  toggleInspector: () => void
  setInspectorOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedTaskId: null,
  setSelectedTask: (id) => set({ selectedTaskId: id, isInspectorOpen: !!id }),
  isInspectorOpen: false,
  toggleInspector: () => set((state) => ({ isInspectorOpen: !state.isInspectorOpen })),
  setInspectorOpen: (open) => set({ isInspectorOpen: open }),
}))
