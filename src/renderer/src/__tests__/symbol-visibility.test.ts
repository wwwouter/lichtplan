import { describe, expect, it } from 'vitest'
import { getForTypeOptions, isPlacedSymbolVisible } from '../components/symbolVisibility'
import type { PlacedSymbol } from '../types/project'

function symbol(overrides: Partial<PlacedSymbol>): PlacedSymbol {
  return {
    id: 'symbol-1',
    symbolId: 'lichtpunt-plafond',
    x: 0,
    y: 0,
    rotation: 0,
    ...overrides
  }
}

describe('linked annotation visibility', () => {
  it('keeps regular symbols controlled by their own type visibility', () => {
    expect(
      isPlacedSymbolVisible(symbol({ symbolId: 'lichtpunt-plafond' }), new Set())
    ).toBe(true)
    expect(
      isPlacedSymbolVisible(symbol({ symbolId: 'lichtpunt-plafond' }), new Set(['lichtpunt-plafond']))
    ).toBe(false)
  })

  it('hides text and line annotations when their linked type is hidden', () => {
    const hidden = new Set(['wandlamp'])

    expect(
      isPlacedSymbolVisible(symbol({ symbolId: 'tekst', forSymbolId: 'wandlamp' }), hidden)
    ).toBe(false)
    expect(
      isPlacedSymbolVisible(symbol({ symbolId: 'lijn', forSymbolId: 'wandlamp' }), hidden)
    ).toBe(false)
  })

  it('uses both the annotation visibility and linked icon visibility for annotations', () => {
    expect(
      isPlacedSymbolVisible(symbol({ symbolId: 'tekst', forSymbolId: 'wandlamp' }), new Set())
    ).toBe(true)
    expect(
      isPlacedSymbolVisible(symbol({ symbolId: 'tekst', forSymbolId: 'wandlamp' }), new Set(['tekst']))
    ).toBe(false)
    expect(
      isPlacedSymbolVisible(symbol({ symbolId: 'tekst', forSymbolId: 'wandlamp' }), new Set(['wandlamp']))
    ).toBe(false)
  })

  it('keeps unlinked annotations controlled by their own annotation visibility', () => {
    expect(isPlacedSymbolVisible(symbol({ symbolId: 'tekst' }), new Set(['wandlamp']))).toBe(true)
    expect(isPlacedSymbolVisible(symbol({ symbolId: 'tekst' }), new Set(['tekst']))).toBe(false)
  })

  it('offers all icon types except Tekst and Lijn for the Voor type dropdown', () => {
    const optionIds = getForTypeOptions().map((option) => option.id)

    expect(optionIds).toContain('lichtpunt-plafond')
    expect(optionIds).toContain('wandlamp')
    expect(optionIds).not.toContain('cat5e-uutp-contactdoos')
    expect(optionIds).not.toContain('tekst')
    expect(optionIds).not.toContain('lijn')
  })
})
