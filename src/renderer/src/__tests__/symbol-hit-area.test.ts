import { describe, it, expect } from 'vitest'
import { ALL_SYMBOLS } from '../symbols'
import { buildHitArea } from '../components/hitArea'

/**
 * In Konva, a draggable Group only receives pointer events if at least one
 * child has listening=true. SymbolNode renders all visual shapes with
 * listening={false}, so it MUST include a transparent hit-area Rect to be
 * clickable and draggable.
 */
describe('Symbol hit area', () => {
  it('buildHitArea should return a rect covering the full symbol bounds', () => {
    for (const sym of ALL_SYMBOLS) {
      const hitArea = buildHitArea(sym.width, sym.height)
      expect(hitArea).toEqual({
        x: -(sym.width / 2),
        y: -(sym.height / 2),
        width: sym.width,
        height: sym.height
      })
    }
  })

  it('all symbols should have positive width and height for hit detection', () => {
    for (const sym of ALL_SYMBOLS) {
      expect(sym.width).toBeGreaterThan(0)
      expect(sym.height).toBeGreaterThan(0)
    }
  })
})
