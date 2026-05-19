import { describe, expect, it } from 'vitest'
import { ALL_SYMBOLS, PALETTE_SYMBOLS_BY_CATEGORY, SymbolCategory, getSymbolById } from '../symbols'

describe('symbols', () => {
  it('provides a 12V lasdoos icon in the electrical palette', () => {
    const symbol = getSymbolById('12v-lasdoos')

    expect(symbol).toMatchObject({
      id: '12v-lasdoos',
      name: '12V lasdoos',
      category: SymbolCategory.Elektra
    })
    expect(PALETTE_SYMBOLS_BY_CATEGORY[SymbolCategory.Elektra].map((item) => item.id)).toContain(
      '12v-lasdoos'
    )
  })

  it('keeps Bewegingssensor compatible but removes it from the sidebar palette', () => {
    expect(ALL_SYMBOLS.map((item) => item.id)).toContain('bewegingssensor')
    expect(PALETTE_SYMBOLS_BY_CATEGORY[SymbolCategory.Overig].map((item) => item.id)).not.toContain(
      'bewegingssensor'
    )
  })
})
