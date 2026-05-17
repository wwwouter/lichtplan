import type { PlacedSymbol } from '../types/project'
import { DIAGRAM_LINE_SYMBOL_ID } from './diagramLine'

function withSelectedLast(symbols: PlacedSymbol[], selectedSymbolId: string | null): PlacedSymbol[] {
  if (!selectedSymbolId) return symbols
  const selected = symbols.find((symbol) => symbol.id === selectedSymbolId)
  if (!selected) return symbols
  return [...symbols.filter((symbol) => symbol.id !== selectedSymbolId), selected]
}

export function orderSymbolsForCanvas(
  symbols: PlacedSymbol[],
  selectedSymbolId: string | null
): PlacedSymbol[] {
  const diagramLines = symbols.filter((symbol) => symbol.symbolId === DIAGRAM_LINE_SYMBOL_ID)
  const regularSymbols = symbols.filter((symbol) => symbol.symbolId !== DIAGRAM_LINE_SYMBOL_ID)

  return [
    ...withSelectedLast(diagramLines, selectedSymbolId),
    ...withSelectedLast(regularSymbols, selectedSymbolId)
  ]
}
