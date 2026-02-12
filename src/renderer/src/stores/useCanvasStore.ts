import { create } from 'zustand'

export type ActiveTool = 'select' | 'pan'

interface CanvasState {
  stageX: number
  stageY: number
  scale: number
  selectedSymbolId: string | null
  activeTool: ActiveTool
  dragSymbolId: string | null

  setStagePosition: (x: number, y: number) => void
  setScale: (scale: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  setSelectedSymbol: (id: string | null) => void
  setActiveTool: (tool: ActiveTool) => void
  setDragSymbolId: (id: string | null) => void
}

const MIN_SCALE = 0.1
const MAX_SCALE = 5
const ZOOM_STEP = 1.2

export const useCanvasStore = create<CanvasState>((set) => ({
  stageX: 0,
  stageY: 0,
  scale: 1,
  selectedSymbolId: null,
  activeTool: 'select',
  dragSymbolId: null,

  setStagePosition: (x, y) => set({ stageX: x, stageY: y }),

  setScale: (scale) =>
    set({ scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale)) }),

  zoomIn: () =>
    set((state) => ({
      scale: Math.min(MAX_SCALE, state.scale * ZOOM_STEP)
    })),

  zoomOut: () =>
    set((state) => ({
      scale: Math.max(MIN_SCALE, state.scale / ZOOM_STEP)
    })),

  resetZoom: () => set({ scale: 1, stageX: 0, stageY: 0 }),

  setSelectedSymbol: (id) => set({ selectedSymbolId: id }),

  setActiveTool: (tool) => set({ activeTool: tool, selectedSymbolId: null }),

  setDragSymbolId: (id) => set({ dragSymbolId: id })
}))
