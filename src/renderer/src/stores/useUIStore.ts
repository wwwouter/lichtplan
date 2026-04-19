import { create } from 'zustand'

interface LabelDialogState {
  symbolId: string
  currentLabel: string
}

interface UIState {
  sidebarCollapsed: boolean
  contextMenu: { x: number; y: number; symbolId: string } | null
  labelDialog: LabelDialogState | null
  expandedCategories: Record<string, boolean>
  hiddenSymbolIds: Set<string>
  loading: string | null

  toggleSidebar: () => void
  setContextMenu: (menu: { x: number; y: number; symbolId: string } | null) => void
  setLabelDialog: (dialog: LabelDialogState | null) => void
  toggleCategory: (category: string) => void
  toggleSymbolVisibility: (symbolId: string) => void
  setLoading: (message: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  contextMenu: null,
  labelDialog: null,
  expandedCategories: {
    Verlichting: true,
    Elektra: true,
    Schakelaars: true,
    Overig: true
  },
  hiddenSymbolIds: new Set(),
  loading: null,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setContextMenu: (menu) => set({ contextMenu: menu }),

  setLabelDialog: (dialog) => set({ labelDialog: dialog }),

  toggleCategory: (category) =>
    set((state) => ({
      expandedCategories: {
        ...state.expandedCategories,
        [category]: !state.expandedCategories[category]
      }
    })),

  toggleSymbolVisibility: (symbolId) =>
    set((state) => {
      const next = new Set(state.hiddenSymbolIds)
      if (next.has(symbolId)) next.delete(symbolId)
      else next.add(symbolId)
      return { hiddenSymbolIds: next }
    }),

  setLoading: (message) => set({ loading: message })
}))
