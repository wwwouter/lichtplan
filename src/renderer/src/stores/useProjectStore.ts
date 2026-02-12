import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { Project, Floor, PlacedSymbol, FloorPlanImage } from '../types/project'

const MAX_HISTORY = 50

interface ProjectState {
  project: Project
  activeFloorId: string
  filePath: string | null
  isDirty: boolean

  // Undo/Redo
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void

  // Project actions
  newProject: () => void
  setProject: (project: Project, filePath?: string) => void
  setProjectName: (name: string) => void
  setFilePath: (path: string | null) => void
  markClean: () => void

  // Floor actions
  addFloor: (name: string) => void
  removeFloor: (floorId: string) => void
  renameFloor: (floorId: string, name: string) => void
  setActiveFloor: (floorId: string) => void
  setFloorImage: (floorId: string, image: FloorPlanImage) => void
  getActiveFloor: () => Floor | undefined

  // Symbol actions
  addSymbol: (floorId: string, symbol: PlacedSymbol) => void
  updateSymbol: (floorId: string, symbolId: string, updates: Partial<PlacedSymbol>) => void
  removeSymbol: (floorId: string, symbolId: string) => void
  duplicateSymbol: (floorId: string, symbolId: string) => string | null
}

// Internal state not exposed to consumers
interface HistoryState {
  past: Project[]
  future: Project[]
}

const createDefaultProject = (): Project => {
  const floorId = uuidv4()
  return {
    id: uuidv4(),
    name: 'Nieuw project',
    floors: [
      {
        id: floorId,
        name: 'Begane grond',
        floorPlanImage: null,
        symbols: [],
        order: 0
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

// History is stored outside Zustand to avoid serialization/snapshot issues
let history: HistoryState = { past: [], future: [] }

function pushHistory(project: Project): void {
  history.past = [...history.past.slice(-(MAX_HISTORY - 1)), structuredClone(project)]
  history.future = []
}

function clearHistory(): void {
  history = { past: [], future: [] }
}

export const useProjectStore = create<ProjectState>((set, get) => {
  const defaultProject = createDefaultProject()

  // Helper: set project with history tracking
  const setWithHistory = (
    updater: (state: ProjectState) => Partial<ProjectState>
  ): void => {
    const current = get()
    pushHistory(current.project)
    set((state) => {
      const updates = updater(state)
      return {
        ...updates,
        canUndo: true,
        canRedo: false
      }
    })
  }

  return {
    project: defaultProject,
    activeFloorId: defaultProject.floors[0].id,
    filePath: null,
    isDirty: false,
    canUndo: false,
    canRedo: false,

    undo: () => {
      if (history.past.length === 0) return
      const current = get()
      const previous = history.past[history.past.length - 1]
      history.past = history.past.slice(0, -1)
      history.future = [structuredClone(current.project), ...history.future]
      set({
        project: previous,
        canUndo: history.past.length > 0,
        canRedo: true,
        isDirty: true
      })
    },

    redo: () => {
      if (history.future.length === 0) return
      const current = get()
      const next = history.future[0]
      history.future = history.future.slice(1)
      history.past = [...history.past, structuredClone(current.project)]
      set({
        project: next,
        canUndo: true,
        canRedo: history.future.length > 0,
        isDirty: true
      })
    },

    newProject: () => {
      clearHistory()
      const project = createDefaultProject()
      set({
        project,
        activeFloorId: project.floors[0].id,
        filePath: null,
        isDirty: false,
        canUndo: false,
        canRedo: false
      })
    },

    setProject: (project, filePath) => {
      clearHistory()
      set({
        project,
        activeFloorId: project.floors[0]?.id ?? '',
        filePath: filePath ?? null,
        isDirty: false,
        canUndo: false,
        canRedo: false
      })
    },

    setProjectName: (name) =>
      setWithHistory((state) => ({
        project: { ...state.project, name, updatedAt: new Date().toISOString() },
        isDirty: true
      })),

    setFilePath: (path) => set({ filePath: path }),

    markClean: () => set({ isDirty: false }),

    addFloor: (name) => {
      const newFloor: Floor = {
        id: uuidv4(),
        name,
        floorPlanImage: null,
        symbols: [],
        order: get().project.floors.length
      }
      setWithHistory((state) => ({
        project: {
          ...state.project,
          floors: [...state.project.floors, newFloor],
          updatedAt: new Date().toISOString()
        },
        activeFloorId: newFloor.id,
        isDirty: true
      }))
    },

    removeFloor: (floorId) => {
      const state = get()
      const floors = state.project.floors.filter((f) => f.id !== floorId)
      if (floors.length === 0) return
      const activeFloorId =
        state.activeFloorId === floorId ? floors[0].id : state.activeFloorId
      setWithHistory(() => ({
        project: {
          ...state.project,
          floors,
          updatedAt: new Date().toISOString()
        },
        activeFloorId,
        isDirty: true
      }))
    },

    renameFloor: (floorId, name) =>
      setWithHistory((state) => ({
        project: {
          ...state.project,
          floors: state.project.floors.map((f) => (f.id === floorId ? { ...f, name } : f)),
          updatedAt: new Date().toISOString()
        },
        isDirty: true
      })),

    setActiveFloor: (floorId) => set({ activeFloorId: floorId }),

    setFloorImage: (floorId, image) =>
      setWithHistory((state) => ({
        project: {
          ...state.project,
          floors: state.project.floors.map((f) =>
            f.id === floorId ? { ...f, floorPlanImage: image } : f
          ),
          updatedAt: new Date().toISOString()
        },
        isDirty: true
      })),

    getActiveFloor: () => {
      const state = get()
      return state.project.floors.find((f) => f.id === state.activeFloorId)
    },

    addSymbol: (floorId, symbol) =>
      setWithHistory((state) => ({
        project: {
          ...state.project,
          floors: state.project.floors.map((f) =>
            f.id === floorId ? { ...f, symbols: [...f.symbols, symbol] } : f
          ),
          updatedAt: new Date().toISOString()
        },
        isDirty: true
      })),

    updateSymbol: (floorId, symbolId, updates) =>
      setWithHistory((state) => ({
        project: {
          ...state.project,
          floors: state.project.floors.map((f) =>
            f.id === floorId
              ? {
                  ...f,
                  symbols: f.symbols.map((s) =>
                    s.id === symbolId ? { ...s, ...updates } : s
                  )
                }
              : f
          ),
          updatedAt: new Date().toISOString()
        },
        isDirty: true
      })),

    removeSymbol: (floorId, symbolId) =>
      setWithHistory((state) => ({
        project: {
          ...state.project,
          floors: state.project.floors.map((f) =>
            f.id === floorId
              ? { ...f, symbols: f.symbols.filter((s) => s.id !== symbolId) }
              : f
          ),
          updatedAt: new Date().toISOString()
        },
        isDirty: true
      })),

    duplicateSymbol: (floorId, symbolId) => {
      const state = get()
      const floor = state.project.floors.find((f) => f.id === floorId)
      const original = floor?.symbols.find((s) => s.id === symbolId)
      if (!original) return null

      const OFFSET = 30
      const newId = uuidv4()
      const duplicate: PlacedSymbol = {
        ...original,
        id: newId,
        x: original.x + OFFSET,
        y: original.y + OFFSET
      }

      setWithHistory((s) => ({
        project: {
          ...s.project,
          floors: s.project.floors.map((f) =>
            f.id === floorId ? { ...f, symbols: [...f.symbols, duplicate] } : f
          ),
          updatedAt: new Date().toISOString()
        },
        isDirty: true
      }))

      return newId
    }
  }
})
