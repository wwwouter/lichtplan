import type { SymbolDefinition } from '../symbols'
import { DIAGRAM_LINE_SYMBOL_ID } from './diagramLine'

export const PLACED_SYMBOL_ICON_SCALE = 0.5
export const PLACED_SYMBOL_DETAIL_SCALE = PLACED_SYMBOL_ICON_SCALE

const UNSCALED_SYMBOL_IDS = new Set([DIAGRAM_LINE_SYMBOL_ID])

export interface PlacedSymbolBounds {
  width: number
  height: number
  offsetX: number
  offsetY: number
}

export function getPlacedSymbolIconScale(definition: Pick<SymbolDefinition, 'id'>): number {
  return UNSCALED_SYMBOL_IDS.has(definition.id) ? 1 : PLACED_SYMBOL_ICON_SCALE
}

export function getPlacedSymbolDetailScale(_definition: Pick<SymbolDefinition, 'id'>): number {
  return PLACED_SYMBOL_DETAIL_SCALE
}

export function getPlacedSymbolBounds(
  definition: Pick<SymbolDefinition, 'id' | 'width' | 'height'>
): PlacedSymbolBounds {
  const iconScale = getPlacedSymbolIconScale(definition)
  const width = definition.width * iconScale
  const height = definition.height * iconScale

  return {
    width,
    height,
    offsetX: width / 2,
    offsetY: height / 2
  }
}
