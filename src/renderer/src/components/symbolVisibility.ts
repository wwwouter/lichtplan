import { SELECTABLE_SYMBOLS } from '../symbols'
import type { SymbolDefinition } from '../symbols'
import type { PlacedSymbol } from '../types/project'
import { DIAGRAM_LINE_SYMBOL_ID } from './diagramLine'

export const TEXT_SYMBOL_ID = 'tekst'

const ANNOTATION_SYMBOL_IDS = new Set([TEXT_SYMBOL_ID, DIAGRAM_LINE_SYMBOL_ID])

export function isAnnotationSymbolId(symbolId: string): boolean {
  return ANNOTATION_SYMBOL_IDS.has(symbolId)
}

export function getForTypeOptions(): SymbolDefinition[] {
  return SELECTABLE_SYMBOLS.filter((symbol) => !isAnnotationSymbolId(symbol.id))
}

export function isPlacedSymbolVisible(
  symbol: Pick<PlacedSymbol, 'symbolId' | 'forSymbolId'>,
  hiddenSymbolIds: Set<string>
): boolean {
  if (hiddenSymbolIds.has(symbol.symbolId)) return false
  if (isAnnotationSymbolId(symbol.symbolId) && symbol.forSymbolId) {
    return !hiddenSymbolIds.has(symbol.forSymbolId)
  }
  return true
}
