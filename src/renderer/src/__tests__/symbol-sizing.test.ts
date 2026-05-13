import { describe, expect, it } from 'vitest'
import { getSymbolById } from '../symbols'
import {
  getPlacedSymbolBounds,
  getPlacedSymbolIconScale,
  PLACED_SYMBOL_ICON_SCALE
} from '../components/symbolSizing'

describe('placed symbol sizing', () => {
  it('renders placed icons at 33 percent of their symbol definition size', () => {
    const definition = getSymbolById('lichtpunt-plafond')!
    const bounds = getPlacedSymbolBounds(definition)

    expect(getPlacedSymbolIconScale(definition)).toBe(PLACED_SYMBOL_ICON_SCALE)
    expect(bounds.width).toBeCloseTo(definition.width * 0.33)
    expect(bounds.height).toBeCloseTo(definition.height * 0.33)
  })

  it('keeps text and drawn lines at their authored size', () => {
    expect(getPlacedSymbolIconScale(getSymbolById('tekst')!)).toBe(1)
    expect(getPlacedSymbolIconScale(getSymbolById('lijn')!)).toBe(1)
  })
})
