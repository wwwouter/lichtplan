import { describe, expect, it } from 'vitest'
import type { PlacedSymbol } from '../types/project'
import { orderSymbolsForCanvas } from '../components/canvasSymbolOrder'
import { DIAGRAM_LINE_SYMBOL_ID } from '../components/diagramLine'

function symbol(id: string, symbolId: string): PlacedSymbol {
  return {
    id,
    symbolId,
    x: 0,
    y: 0,
    rotation: 0
  }
}

describe('canvas symbol ordering', () => {
  it('renders diagram lines below regular symbols even when the line is last in project order', () => {
    const ordered = orderSymbolsForCanvas(
      [
        symbol('lamp-1', 'lichtpunt-plafond'),
        symbol('line-1', DIAGRAM_LINE_SYMBOL_ID)
      ],
      null
    )

    expect(ordered.map((item) => item.id)).toEqual(['line-1', 'lamp-1'])
  })

  it('keeps selected lines below regular symbols', () => {
    const ordered = orderSymbolsForCanvas(
      [
        symbol('lamp-1', 'lichtpunt-plafond'),
        symbol('line-1', DIAGRAM_LINE_SYMBOL_ID),
        symbol('spot-1', 'inbouwspot')
      ],
      'line-1'
    )

    expect(ordered.map((item) => item.id)).toEqual(['line-1', 'lamp-1', 'spot-1'])
  })

  it('renders a selected regular symbol above other regular symbols', () => {
    const ordered = orderSymbolsForCanvas(
      [
        symbol('lamp-1', 'lichtpunt-plafond'),
        symbol('line-1', DIAGRAM_LINE_SYMBOL_ID),
        symbol('spot-1', 'inbouwspot')
      ],
      'lamp-1'
    )

    expect(ordered.map((item) => item.id)).toEqual(['line-1', 'spot-1', 'lamp-1'])
  })
})
