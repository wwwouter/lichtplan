export interface Project {
  id: string
  name: string
  floors: Floor[]
  createdAt: string
  updatedAt: string
}

export interface Floor {
  id: string
  name: string
  floorPlanImage: FloorPlanImage | null
  symbols: PlacedSymbol[]
  order: number
}

export interface FloorPlanImage {
  data: string // base64 encoded
  width: number
  height: number
  fileName: string
}

export interface PlacedSymbol {
  id: string
  symbolId: string
  x: number
  y: number
  rotation: number
  label?: string
}
