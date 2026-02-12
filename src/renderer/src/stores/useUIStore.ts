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

  toggleSidebar: () => void
  setContextMenu: (menu: { x: number; y: number; symbolId: string } | null) => void
  setLabelDialog: (dialog: LabelDialogState | null) => void
  toggleCategory: (category: string) => void
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

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setContextMenu: (menu) => set({ contextMenu: menu }),

  setLabelDialog: (dialog) => set({ labelDialog: dialog }),

  toggleCategory: (category) =>
    set((state) => ({
      expandedCategories: {
        ...state.expandedCategories,
        [category]: !state.expandedCategories[category]
      }
    }))
}))
