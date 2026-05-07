import type { PlacedSymbol } from '../types/project'

export interface SymbolTooltipRow {
  label: string
  value: string
}

export function getSymbolTooltipRows(
  symbol: Pick<PlacedSymbol, 'location' | 'description'>
): SymbolTooltipRow[] {
  const location = normalizeTooltipValue(symbol.location)
  const description = normalizeTooltipValue(symbol.description)

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

  return rows.map(formatSymbolTooltipRow).join('\n')
}

function normalizeTooltipValue(value: string | undefined): string | undefined {
  const normalized = value?.replace(/\r\n?/g, '\n').trim()
  return normalized && normalized.length > 0 ? normalized : undefined
}

function formatSymbolTooltipRow(row: SymbolTooltipRow): string {
  if (row.value.includes('\n')) {
    return `${row.label}:\n${row.value}`
  }

  return `${row.label}: ${row.value}`
}
