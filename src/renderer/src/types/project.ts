export interface Project {
  id: string
  name: string
  floors: Floor[]
  exportProfiles?: ExportProfile[]
  createdAt: string
  updatedAt: string
}

export interface ExportProfile {
  id: string
  name: string
  symbolIds: string[]
}

export interface Floor {
  id: string
  name: string
  floorPlanImage: FloorPlanImage | null
  symbols: PlacedSymbol[]
  order: number
  pixelsPerMm?: number
}

export interface FloorPlanImage {
  data: string // base64 encoded
  width: number
  height: number
  fileName: string
  grayscale?: boolean
}

export type DiagramLineType = 'straight' | 'dotted'

export interface DiagramLine {
  endX: number
  endY: number
  type: DiagramLineType
}

export interface PlacedSymbol {
  id: string
  symbolId: string
  x: number
  y: number
  rotation: number
  label?: string
  group?: string
  location?: string
  description?: string
  question?: string
  itemId?: string
  forSymbolId?: string
  diagramLine?: DiagramLine
}
