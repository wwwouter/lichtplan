import { describe, expect, it } from 'vitest'
import { getGroupBadgePosition } from '../components/symbolBadges'
import { getPlacedSymbolBounds, getPlacedSymbolDetailScale, getPlacedSymbolIconScale } from '../components/symbolSizing'
import { getSymbolById, SymbolCategory } from '../symbols'

describe('symbol group badges', () => {
  it('keeps switch group badges clear of the red contact dot', () => {
    const definition = getSymbolById('dimmer')!
    const bounds = getPlacedSymbolBounds(definition)
    const badge = getGroupBadgePosition({
      category: definition.category,
      offsetX: bounds.offsetX,
      offsetY: bounds.offsetY,
      definitionWidth: bounds.width,
      scale: getPlacedSymbolDetailScale(definition)
    })
    const iconScale = getPlacedSymbolIconScale(definition)
    const contactDot = {
      x: (5 - definition.width / 2) * iconScale,
      y: (21 - definition.height / 2) * iconScale,
      radius: 4 * iconScale
    }
    const distance = Math.hypot(badge.x - contactDot.x, badge.y - contactDot.y)

    expect(distance).toBeGreaterThan(badge.radius + contactDot.radius)
  })

  it('keeps non-switch group badges in the compact bottom-left position', () => {
    const badge = getGroupBadgePosition({
      category: SymbolCategory.Verlichting,
      offsetX: 10,
      offsetY: 10,
      definitionWidth: 20,
      scale: 0.5
    })

    expect(badge).toEqual({
      x: -7.5,
      y: 6.5,
      radius: 3.5
    })
  })
})
