export enum SymbolCategory {
  Verlichting = 'Verlichting',
  Elektra = 'Elektra',
  Schakelaars = 'Schakelaars',
  Overig = 'Overig'
}

export const CATEGORY_COLORS: Record<SymbolCategory, string> = {
  [SymbolCategory.Verlichting]: '#F59E0B',
  [SymbolCategory.Elektra]: '#3B82F6',
  [SymbolCategory.Schakelaars]: '#EF4444',
  [SymbolCategory.Overig]: '#8B5CF6'
}

export type SymbolShape =
  | { type: 'circle'; x: number; y: number; radius: number; fill?: string; stroke?: string; strokeWidth?: number }
  | { type: 'line'; points: number[]; stroke?: string; strokeWidth?: number; dash?: number[]; closed?: boolean; fill?: string }
  | { type: 'arc'; x: number; y: number; innerRadius: number; outerRadius: number; angle: number; rotation?: number; fill?: string; stroke?: string; strokeWidth?: number }
  | { type: 'rect'; x: number; y: number; width: number; height: number; fill?: string; stroke?: string; strokeWidth?: number }
  | { type: 'text'; x: number; y: number; text: string; fontSize: number; fill?: string; fontStyle?: string }
  | { type: 'path'; data: string; fill?: string; stroke?: string; strokeWidth?: number }

export interface SymbolDefinition {
  id: string
  name: string
  category: SymbolCategory
  shapes: SymbolShape[]
  width: number
  height: number
}
