import type { PlacedSymbol } from '../types/project'

export interface SymbolTooltipRow {
  label: string
  value: string
}

export function getSymbolTooltipRows(
  symbol: Pick<PlacedSymbol, 'location' | 'description'>
): SymbolTooltipRow[] {
  const location = symbol.location?.trim()
  const description = symbol.description?.trim()

  if (!location && !description) {
    return []
  }

  return [
    { label: 'Locatie', value: location || '-' },
    { label: 'Omschrijving', value: description || '-' }
  ]
}

export function formatSymbolTooltipText(
  symbol: Pick<PlacedSymbol, 'location' | 'description'>
): string | null {
  const rows = getSymbolTooltipRows(symbol)
  if (rows.length === 0) {
    return null
  }

  return rows.map((row) => `${row.label}: ${row.value}`).join('\n')
}
