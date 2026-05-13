import { describe, expect, it } from 'vitest'
import { getSymbolById } from '../symbols'
import {
  getPlacedSymbolDetailScale,
  getPlacedSymbolBounds,
  getPlacedSymbolIconScale,
  PLACED_SYMBOL_DETAIL_SCALE,
  PLACED_SYMBOL_ICON_SCALE
} from '../components/symbolSizing'

describe('placed symbol sizing', () => {
  it('renders placed icons at 50 percent of their symbol definition size', () => {
    const definition = getSymbolById('lichtpunt-plafond')!
    const bounds = getPlacedSymbolBounds(definition)

    expect(getPlacedSymbolIconScale(definition)).toBe(PLACED_SYMBOL_ICON_SCALE)
    expect(bounds.width).toBeCloseTo(definition.width * 0.5)
    expect(bounds.height).toBeCloseTo(definition.height * 0.5)
  })

  it('uses the same 50 percent scale for placed symbol labels and badges', () => {
    expect(getPlacedSymbolDetailScale(getSymbolById('lichtpunt-plafond')!)).toBe(
      PLACED_SYMBOL_DETAIL_SCALE
    )
  })

  it('also scales text symbols and line labels while keeping drawn lines at their authored size', () => {
    expect(getPlacedSymbolIconScale(getSymbolById('tekst')!)).toBe(PLACED_SYMBOL_ICON_SCALE)
    expect(getPlacedSymbolDetailScale(getSymbolById('tekst')!)).toBe(PLACED_SYMBOL_DETAIL_SCALE)
    expect(getPlacedSymbolIconScale(getSymbolById('lijn')!)).toBe(1)
    expect(getPlacedSymbolDetailScale(getSymbolById('lijn')!)).toBe(PLACED_SYMBOL_DETAIL_SCALE)
  })
})
