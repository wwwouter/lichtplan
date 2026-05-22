import { describe, expect, it } from 'vitest'
import type { Floor } from '../types/project'
import { DIAGRAM_LINE_SYMBOL_ID } from '../components/diagramLine'
import { getFloorContentBounds } from '../components/floorBounds'
import { TEXT_SYMBOL_ID } from '../components/symbolVisibility'

function floor(overrides: Partial<Floor>): Floor {
  return {
    id: 'floor-1',
    name: 'Opmerkingen',
    order: 0,
    floorPlanImage: null,
    symbols: [],
    ...overrides
  }
}

describe('floor content bounds', () => {
  it('uses stable page-sized bounds for empty floors', () => {
    expect(getFloorContentBounds(floor({}), { hiddenSymbolIds: new Set() })).toEqual({
      x: 0,
      y: 0,
      width: 1000,
      height: 700
    })
  })

  it('includes text annotation dimensions instead of only the anchor point', () => {
    const bounds = getFloorContentBounds(
      floor({
        symbols: [
          {
            id: 'text-1',
            symbolId: TEXT_SYMBOL_ID,
            x: 500,
            y: 300,
            rotation: 0,
            label: 'Voor dimmers\nVoor ander schakelaars\nKomt Shelly'
          }
        ]
      }),
      { hiddenSymbolIds: new Set() }
    )

    expect(bounds.x).toBeLessThan(500)
    expect(bounds.width).toBeGreaterThan(150)
    expect(bounds.x + bounds.width).toBeGreaterThan(600)
  })

  it('includes diagram line endpoints and label dimensions', () => {
    const bounds = getFloorContentBounds(
      floor({
        symbols: [
          {
            id: 'line-1',
            symbolId: DIAGRAM_LINE_SYMBOL_ID,
            x: 100,
            y: 200,
            rotation: 0,
            label: 'lange leiding',
            diagramLine: {
              endX: 420,
              endY: -80,
              type: 'dotted'
            }
          }
        ]
      }),
      { hiddenSymbolIds: new Set() }
    )

    expect(bounds.x).toBeLessThanOrEqual(50)
    expect(bounds.y).toBeLessThanOrEqual(70)
    expect(bounds.x + bounds.width).toBeGreaterThanOrEqual(570)
    expect(bounds.y + bounds.height).toBeGreaterThanOrEqual(250)
  })

  it('uses the floor plan image as part of the exported area', () => {
    const bounds = getFloorContentBounds(
      floor({
        floorPlanImage: {
          data: 'data:image/png;base64,image',
          width: 120,
          height: 80,
          fileName: 'floor.png'
        }
      }),
      { hiddenSymbolIds: new Set() }
    )

    expect(bounds).toEqual({ x: -40, y: -40, width: 200, height: 160 })
  })

  it('honors export profile visibility when calculating bounds', () => {
    const bounds = getFloorContentBounds(
      floor({
        symbols: [
          {
            id: 'hidden-text',
            symbolId: TEXT_SYMBOL_ID,
            x: 2000,
            y: 2000,
            rotation: 0,
            label: 'Verborgen tekst die niet mag meetellen'
          },
          {
            id: 'visible-text',
            symbolId: TEXT_SYMBOL_ID,
            x: 100,
            y: 100,
            rotation: 0,
            label: 'Zichtbaar'
          }
        ]
      }),
      {
        hiddenSymbolIds: new Set(),
        visibleSymbolIds: new Set(['visible-text'])
      }
    )

    expect(bounds.x + bounds.width).toBeLessThan(250)
    expect(bounds.y + bounds.height).toBeLessThan(200)
  })
})
