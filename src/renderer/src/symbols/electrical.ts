import { SymbolDefinition, SymbolCategory, CATEGORY_COLORS } from './types'

const color = CATEGORY_COLORS[SymbolCategory.Elektra]

export const electricalSymbols: SymbolDefinition[] = [
  {
    id: 'enkelvoudig-stopcontact',
    name: 'Enkelvoudig stopcontact',
    category: SymbolCategory.Elektra,
    width: 26,
    height: 20,
    shapes: [
      { type: 'arc', x: 13, y: 16, innerRadius: 0, outerRadius: 12, angle: 180, rotation: -180, stroke: color, strokeWidth: 2, fill: 'transparent' },
      { type: 'line', points: [1, 16, 25, 16], stroke: color, strokeWidth: 2 }
    ]
  },
  {
    id: 'dubbel-stopcontact',
    name: 'Dubbel stopcontact',
    category: SymbolCategory.Elektra,
    width: 26,
    height: 24,
    shapes: [
      { type: 'arc', x: 13, y: 20, innerRadius: 0, outerRadius: 12, angle: 180, rotation: -180, stroke: color, strokeWidth: 2, fill: 'transparent' },
      { type: 'line', points: [1, 20, 25, 20], stroke: color, strokeWidth: 2 },
      { type: 'arc', x: 13, y: 16, innerRadius: 0, outerRadius: 12, angle: 180, rotation: -180, stroke: color, strokeWidth: 2, fill: 'transparent' },
      { type: 'line', points: [1, 16, 25, 16], stroke: color, strokeWidth: 2 }
    ]
  },
  {
    id: 'geaard-stopcontact',
    name: 'Geaard stopcontact',
    category: SymbolCategory.Elektra,
    width: 26,
    height: 24,
    shapes: [
      { type: 'arc', x: 13, y: 20, innerRadius: 0, outerRadius: 12, angle: 180, rotation: -180, stroke: color, strokeWidth: 2, fill: 'transparent' },
      { type: 'line', points: [1, 20, 25, 20], stroke: color, strokeWidth: 2 },
      { type: 'line', points: [13, 20, 13, 8], stroke: color, strokeWidth: 2 },
      { type: 'line', points: [7, 8, 19, 8], stroke: color, strokeWidth: 2 }
    ]
  },
  {
    id: 'dubbel-geaard-stopcontact',
    name: 'Dubbel geaard stopcontact',
    category: SymbolCategory.Elektra,
    width: 26,
    height: 24,
    shapes: [
      { type: 'arc', x: 13, y: 20, innerRadius: 0, outerRadius: 12, angle: 180, rotation: -180, stroke: color, strokeWidth: 2, fill: 'transparent' },
      { type: 'line', points: [1, 20, 25, 20], stroke: color, strokeWidth: 2 },
      { type: 'arc', x: 13, y: 16, innerRadius: 0, outerRadius: 12, angle: 180, rotation: -180, stroke: color, strokeWidth: 2, fill: 'transparent' },
      { type: 'line', points: [1, 16, 25, 16], stroke: color, strokeWidth: 2 },
      { type: 'line', points: [13, 16, 13, 4], stroke: color, strokeWidth: 2 },
      { type: 'line', points: [7, 4, 19, 4], stroke: color, strokeWidth: 2 }
    ]
  }
]
