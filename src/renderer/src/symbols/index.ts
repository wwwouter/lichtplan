import { SymbolDefinition, SymbolCategory } from './types'
import { lightingSymbols } from './lighting'
import { electricalSymbols } from './electrical'
import { switchSymbols } from './switches'
import { otherSymbols } from './other'
import { annotationSymbols } from './annotations'

export const ALL_SYMBOLS: SymbolDefinition[] = [
  ...lightingSymbols,
  ...electricalSymbols,
  ...switchSymbols,
  ...otherSymbols,
  ...annotationSymbols
]

const HIDDEN_SYMBOL_IDS = new Set(['bewegingssensor', 'cat5e-uutp-contactdoos'])

export const SELECTABLE_SYMBOLS: SymbolDefinition[] = ALL_SYMBOLS.filter(
  (symbol) => !HIDDEN_SYMBOL_IDS.has(symbol.id)
)

export const SYMBOLS_BY_CATEGORY: Record<SymbolCategory, SymbolDefinition[]> = {
  [SymbolCategory.Verlichting]: lightingSymbols,
  [SymbolCategory.Elektra]: electricalSymbols,
  [SymbolCategory.Schakelaars]: switchSymbols,
  [SymbolCategory.Overig]: otherSymbols,
  [SymbolCategory.Annotaties]: annotationSymbols
}

export const PALETTE_SYMBOLS_BY_CATEGORY: Record<SymbolCategory, SymbolDefinition[]> = {
  [SymbolCategory.Verlichting]: lightingSymbols.filter(
    (symbol) => !HIDDEN_SYMBOL_IDS.has(symbol.id)
  ),
  [SymbolCategory.Elektra]: electricalSymbols.filter(
    (symbol) => !HIDDEN_SYMBOL_IDS.has(symbol.id)
  ),
  [SymbolCategory.Schakelaars]: switchSymbols.filter(
    (symbol) => !HIDDEN_SYMBOL_IDS.has(symbol.id)
  ),
  [SymbolCategory.Overig]: otherSymbols.filter((symbol) => !HIDDEN_SYMBOL_IDS.has(symbol.id)),
  [SymbolCategory.Annotaties]: annotationSymbols.filter(
    (symbol) => !HIDDEN_SYMBOL_IDS.has(symbol.id)
  )
}

export const getSymbolById = (id: string): SymbolDefinition | undefined =>
  ALL_SYMBOLS.find((s) => s.id === id)

export { SymbolCategory, CATEGORY_COLORS } from './types'
export type { SymbolDefinition, SymbolShape } from './types'
