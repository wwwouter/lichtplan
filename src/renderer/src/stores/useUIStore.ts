import { create } from 'zustand'
import { ALL_SYMBOLS } from '../symbols'

interface LabelDialogState {
  symbolId: string
  currentLabel: string
}

interface GroupDialogState {
  symbolId: string
  currentGroup: string
}

interface LocationDialogState {
  symbolId: string
  currentLocation: string
}

interface DescriptionDialogState {
  symbolId: string
  currentDescription: string
}

interface IdDialogState {
  symbolId: string
  currentId: string
}

export type InteractionMode = 'default' | 'calibrate' | 'measure'

interface UIState {
  sidebarCollapsed: boolean
  contextMenu: { x: number; y: number; symbolId: string } | null
  labelDialog: LabelDialogState | null
  groupDialog: GroupDialogState | null
  locationDialog: LocationDialogState | null
  idDialog: IdDialogState | null
  descriptionDialog: DescriptionDialogState | null
  itemsListOpen: boolean
  pdfExportDialogOpen: boolean
  expandedCategories: Record<string, boolean>
  hiddenSymbolIds: Set<string>
  showItemId: boolean
  showGroup: boolean
  showLabel: boolean
  loading: string | null
  interactionMode: InteractionMode
  calibrationPixels: number | null

  toggleSidebar: () => void
  setContextMenu: (menu: { x: number; y: number; symbolId: string } | null) => void
  setLabelDialog: (dialog: LabelDialogState | null) => void
  setGroupDialog: (dialog: GroupDialogState | null) => void
  setLocationDialog: (dialog: LocationDialogState | null) => void
  setIdDialog: (dialog: IdDialogState | null) => void
  setDescriptionDialog: (dialog: DescriptionDialogState | null) => void
  setItemsListOpen: (open: boolean) => void
  setPdfExportDialogOpen: (open: boolean) => void
  toggleCategory: (category: string) => void
  toggleSymbolVisibility: (symbolId: string) => void
  setLoading: (message: string | null) => void
  setInteractionMode: (mode: InteractionMode) => void
  setCalibrationPixels: (pixels: number | null) => void
  toggleShowItemId: () => void
  toggleShowGroup: () => void
  toggleShowLabel: () => void
  showOnlySymbol: (symbolId: string) => void
  hideOnlySymbol: (symbolId: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  contextMenu: null,
  labelDialog: null,
  groupDialog: null,
  locationDialog: null,
  idDialog: null,
  descriptionDialog: null,
  itemsListOpen: false,
  pdfExportDialogOpen: false,
  expandedCategories: {
    Verlichting: true,
    Elektra: true,
    Schakelaars: true,
    Overig: true
  },
  hiddenSymbolIds: new Set(),
  showItemId: true,
  showGroup: true,
  showLabel: true,
  loading: null,
  interactionMode: 'default',
  calibrationPixels: null,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setContextMenu: (menu) => set({ contextMenu: menu }),

  setLabelDialog: (dialog) => set({ labelDialog: dialog }),

  setGroupDialog: (dialog) => set({ groupDialog: dialog }),

  setLocationDialog: (dialog) => set({ locationDialog: dialog }),

  setIdDialog: (dialog) => set({ idDialog: dialog }),

  setDescriptionDialog: (dialog) => set({ descriptionDialog: dialog }),

  setItemsListOpen: (open) => set({ itemsListOpen: open }),

  setPdfExportDialogOpen: (open) => set({ pdfExportDialogOpen: open }),

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

  setCalibrationPixels: (pixels) => set({ calibrationPixels: pixels }),

  toggleShowItemId: () => set((state) => ({ showItemId: !state.showItemId })),

  toggleShowGroup: () => set((state) => ({ showGroup: !state.showGroup })),

  toggleShowLabel: () => set((state) => ({ showLabel: !state.showLabel })),

  showOnlySymbol: (symbolId) =>
    set(() => {
      const next = new Set<string>()
      ALL_SYMBOLS.forEach((s) => {
        if (s.id !== symbolId) next.add(s.id)
      })
      return { hiddenSymbolIds: next }
    }),

  hideOnlySymbol: (symbolId) =>
    set(() => {
      const next = new Set<string>([symbolId])
      return { hiddenSymbolIds: next }
    })
}))
