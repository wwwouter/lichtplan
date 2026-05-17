import { create } from 'zustand'
import { ALL_SYMBOLS } from '../symbols'

export const UI_PREFERENCES_STORAGE_KEY = 'lichtplan-ui-preferences'

interface PersistedUIPreferences {
  showItemId: boolean
  showGroup: boolean
  showLabel: boolean
  hiddenSymbolIds: string[]
}

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

interface QuestionDialogState {
  symbolId: string
  currentQuestion: string
}

interface ForTypeDialogState {
  symbolId: string
  currentForSymbolId?: string
}

interface IdDialogState {
  symbolId: string
  currentId: string
}

export type InteractionMode = 'default' | 'calibrate' | 'measure' | 'draw-line'
export type UINotification = {
  id: number
  type: 'success' | 'error'
  message: string
}

interface UIState {
  sidebarCollapsed: boolean
  contextMenu: { x: number; y: number; symbolId: string } | null
  labelDialog: LabelDialogState | null
  groupDialog: GroupDialogState | null
  locationDialog: LocationDialogState | null
  idDialog: IdDialogState | null
  descriptionDialog: DescriptionDialogState | null
  questionDialog: QuestionDialogState | null
  forTypeDialog: ForTypeDialogState | null
  itemsListOpen: boolean
  pdfExportDialogOpen: boolean
  expandedCategories: Record<string, boolean>
  hiddenSymbolIds: Set<string>
  showItemId: boolean
  showGroup: boolean
  showLabel: boolean
  loading: string | null
  notification: UINotification | null
  interactionMode: InteractionMode
  calibrationPixels: number | null

  toggleSidebar: () => void
  setContextMenu: (menu: { x: number; y: number; symbolId: string } | null) => void
  setLabelDialog: (dialog: LabelDialogState | null) => void
  setGroupDialog: (dialog: GroupDialogState | null) => void
  setLocationDialog: (dialog: LocationDialogState | null) => void
  setIdDialog: (dialog: IdDialogState | null) => void
  setDescriptionDialog: (dialog: DescriptionDialogState | null) => void
  setQuestionDialog: (dialog: QuestionDialogState | null) => void
  setForTypeDialog: (dialog: ForTypeDialogState | null) => void
  setItemsListOpen: (open: boolean) => void
  setPdfExportDialogOpen: (open: boolean) => void
  toggleCategory: (category: string) => void
  toggleSymbolVisibility: (symbolId: string) => void
  setLoading: (message: string | null) => void
  setNotification: (notification: Omit<UINotification, 'id'> | null) => void
  clearNotification: () => void
  setInteractionMode: (mode: InteractionMode) => void
  setCalibrationPixels: (pixels: number | null) => void
  toggleShowItemId: () => void
  toggleShowGroup: () => void
  toggleShowLabel: () => void
  showOnlySymbol: (symbolId: string) => void
  hideOnlySymbol: (symbolId: string) => void
}

const knownSymbolIds = new Set(ALL_SYMBOLS.map((symbol) => symbol.id))
const annotationSymbolIds = new Set(['tekst', 'lijn'])
const defaultPreferences: PersistedUIPreferences = {
  showItemId: true,
  showGroup: true,
  showLabel: true,
  hiddenSymbolIds: []
}

function isAnnotationSymbolId(symbolId: string): boolean {
  return annotationSymbolIds.has(symbolId)
}

function addHiddenAnnotations(next: Set<string>, hiddenSymbolIds: Set<string>): void {
  annotationSymbolIds.forEach((symbolId) => {
    if (hiddenSymbolIds.has(symbolId)) next.add(symbolId)
  })
}

function readUIPreferences(): PersistedUIPreferences {
  if (typeof window === 'undefined') return defaultPreferences

  try {
    const raw = window.localStorage.getItem(UI_PREFERENCES_STORAGE_KEY)
    if (!raw) return defaultPreferences
    const parsed = JSON.parse(raw) as Partial<PersistedUIPreferences>

    return {
      showItemId:
        typeof parsed.showItemId === 'boolean'
          ? parsed.showItemId
          : defaultPreferences.showItemId,
      showGroup:
        typeof parsed.showGroup === 'boolean' ? parsed.showGroup : defaultPreferences.showGroup,
      showLabel:
        typeof parsed.showLabel === 'boolean' ? parsed.showLabel : defaultPreferences.showLabel,
      hiddenSymbolIds: Array.isArray(parsed.hiddenSymbolIds)
        ? parsed.hiddenSymbolIds.filter(
            (symbolId): symbolId is string =>
              typeof symbolId === 'string' && knownSymbolIds.has(symbolId)
          )
        : defaultPreferences.hiddenSymbolIds
    }
  } catch {
    return defaultPreferences
  }
}

function writeUIPreferences(preferences: PersistedUIPreferences): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(UI_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // Ignore storage failures; the live UI state should still update.
  }
}

function persistVisibilityPreferences(
  state: Pick<UIState, 'showItemId' | 'showGroup' | 'showLabel' | 'hiddenSymbolIds'>,
  overrides: Partial<PersistedUIPreferences> = {}
): void {
  writeUIPreferences({
    showItemId: state.showItemId,
    showGroup: state.showGroup,
    showLabel: state.showLabel,
    hiddenSymbolIds: Array.from(state.hiddenSymbolIds),
    ...overrides
  })
}

const initialPreferences = readUIPreferences()
let notificationId = 0

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  contextMenu: null,
  labelDialog: null,
  groupDialog: null,
  locationDialog: null,
  idDialog: null,
  descriptionDialog: null,
  questionDialog: null,
  forTypeDialog: null,
  itemsListOpen: false,
  pdfExportDialogOpen: false,
  expandedCategories: {
    Verlichting: true,
    Elektra: true,
    Schakelaars: true,
    Overig: true,
    Annotaties: true
  },
  hiddenSymbolIds: new Set(initialPreferences.hiddenSymbolIds),
  showItemId: initialPreferences.showItemId,
  showGroup: initialPreferences.showGroup,
  showLabel: initialPreferences.showLabel,
  loading: null,
  notification: null,
  interactionMode: 'default',
  calibrationPixels: null,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setContextMenu: (menu) => set({ contextMenu: menu }),

  setLabelDialog: (dialog) => set({ labelDialog: dialog }),

  setGroupDialog: (dialog) => set({ groupDialog: dialog }),

  setLocationDialog: (dialog) => set({ locationDialog: dialog }),

  setIdDialog: (dialog) => set({ idDialog: dialog }),

  setDescriptionDialog: (dialog) => set({ descriptionDialog: dialog }),

  setQuestionDialog: (dialog) => set({ questionDialog: dialog }),

  setForTypeDialog: (dialog) => set({ forTypeDialog: dialog }),

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
      persistVisibilityPreferences(state, { hiddenSymbolIds: Array.from(next) })
      return { hiddenSymbolIds: next }
    }),

  setLoading: (message) => set({ loading: message }),

  setNotification: (notification) =>
    set({
      notification: notification ? { ...notification, id: ++notificationId } : null
    }),

  clearNotification: () => set({ notification: null }),

  setInteractionMode: (mode) => set({ interactionMode: mode, calibrationPixels: null }),

  setCalibrationPixels: (pixels) => set({ calibrationPixels: pixels }),

  toggleShowItemId: () =>
    set((state) => {
      const showItemId = !state.showItemId
      persistVisibilityPreferences(state, { showItemId })
      return { showItemId }
    }),

  toggleShowGroup: () =>
    set((state) => {
      const showGroup = !state.showGroup
      persistVisibilityPreferences(state, { showGroup })
      return { showGroup }
    }),

  toggleShowLabel: () =>
    set((state) => {
      const showLabel = !state.showLabel
      persistVisibilityPreferences(state, { showLabel })
      return { showLabel }
    }),

  showOnlySymbol: (symbolId) =>
    set((state) => {
      const next = new Set<string>()
      ALL_SYMBOLS.forEach((s) => {
        if (s.id === symbolId) return
        if (!isAnnotationSymbolId(symbolId) && isAnnotationSymbolId(s.id)) return
        next.add(s.id)
      })
      if (!isAnnotationSymbolId(symbolId)) {
        addHiddenAnnotations(next, state.hiddenSymbolIds)
      }
      persistVisibilityPreferences(state, { hiddenSymbolIds: Array.from(next) })
      return { hiddenSymbolIds: next }
    }),

  hideOnlySymbol: (symbolId) =>
    set((state) => {
      const next = new Set<string>([symbolId])
      if (!isAnnotationSymbolId(symbolId)) {
        addHiddenAnnotations(next, state.hiddenSymbolIds)
      }
      persistVisibilityPreferences(state, { hiddenSymbolIds: Array.from(next) })
      return { hiddenSymbolIds: next }
    })
}))

export function clearTransientUIState(): void {
  useUIStore.setState({ loading: null })
}

if (import.meta.hot) {
  const clearLoadingForHotUpdate = () => clearTransientUIState()

  import.meta.hot.on('vite:beforeUpdate', clearLoadingForHotUpdate)
  import.meta.hot.on('vite:beforeFullReload', clearLoadingForHotUpdate)
  import.meta.hot.dispose(() => {
    import.meta.hot?.off('vite:beforeUpdate', clearLoadingForHotUpdate)
    import.meta.hot?.off('vite:beforeFullReload', clearLoadingForHotUpdate)
    clearLoadingForHotUpdate()
  })
}
