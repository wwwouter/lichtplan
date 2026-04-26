import { create } from 'zustand'

interface LabelDialogState {
  symbolId: string
  currentLabel: string
}

interface PropertyDialogState {
  symbolId: string
  group: string
  location: string
}

export type InteractionMode = 'default' | 'calibrate' | 'measure'

interface UIState {
  sidebarCollapsed: boolean
  contextMenu: { x: number; y: number; symbolId: string } | null
  labelDialog: LabelDialogState | null
  propertyDialog: PropertyDialogState | null
  itemsListOpen: boolean
  expandedCategories: Record<string, boolean>
  hiddenSymbolIds: Set<string>
  loading: string | null
  interactionMode: InteractionMode
  calibrationPixels: number | null

  toggleSidebar: () => void
  setContextMenu: (menu: { x: number; y: number; symbolId: string } | null) => void
  setLabelDialog: (dialog: LabelDialogState | null) => void
  setPropertyDialog: (dialog: PropertyDialogState | null) => void
  setItemsListOpen: (open: boolean) => void
  toggleCategory: (category: string) => void
  toggleSymbolVisibility: (symbolId: string) => void
  setLoading: (message: string | null) => void
  setInteractionMode: (mode: InteractionMode) => void
  setCalibrationPixels: (pixels: number | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  contextMenu: null,
  labelDialog: null,
  propertyDialog: null,
  itemsListOpen: false,
  expandedCategories: {
    Verlichting: true,
    Elektra: true,
    Schakelaars: true,
    Overig: true
  },
  hiddenSymbolIds: new Set(),
  loading: null,
  interactionMode: 'default',
  calibrationPixels: null,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setContextMenu: (menu) => set({ contextMenu: menu }),

  setLabelDialog: (dialog) => set({ labelDialog: dialog }),

  setPropertyDialog: (dialog) => set({ propertyDialog: dialog }),

  setItemsListOpen: (open) => set({ itemsListOpen: open }),

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

  setLoading: (message) => set({ loading: message }),

  setInteractionMode: (mode) => set({ interactionMode: mode, calibrationPixels: null }),

  setCalibrationPixels: (pixels) => set({ calibrationPixels: pixels })
}))
