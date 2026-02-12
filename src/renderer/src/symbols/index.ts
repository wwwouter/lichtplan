import { SymbolDefinition, SymbolCategory } from './types'
import { lightingSymbols } from './lighting'
import { electricalSymbols } from './electrical'
import { switchSymbols } from './switches'
import { otherSymbols } from './other'

export const ALL_SYMBOLS: SymbolDefinition[] = [
  ...lightingSymbols,
  ...electricalSymbols,
  ...switchSymbols,
  ...otherSymbols
]

export const SYMBOLS_BY_CATEGORY: Record<SymbolCategory, SymbolDefinition[]> = {
  [SymbolCategory.Verlichting]: lightingSymbols,
  [SymbolCategory.Elektra]: electricalSymbols,
  [SymbolCategory.Schakelaars]: switchSymbols,
  [SymbolCategory.Overig]: otherSymbols
}

export const getSymbolById = (id: string): SymbolDefinition | undefined =>
  ALL_SYMBOLS.find((s) => s.id === id)

export { SymbolCategory, CATEGORY_COLORS } from './types'
export type { SymbolDefinition, SymbolShape } from './types'
