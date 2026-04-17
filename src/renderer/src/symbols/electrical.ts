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
      { type: 'arc', x: 13, y: 16, innerRadius: 0, outerRadius: 12, angle: 180, rotation: -180, stroke: color, strokeWidth: 2, fill: '#ffffff' },
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
      { type: 'arc', x: 13, y: 20, innerRadius: 0, outerRadius: 12, angle: 180, rotation: -180, stroke: color, strokeWidth: 2, fill: '#ffffff' },
      { type: 'line', points: [1, 20, 25, 20], stroke: color, strokeWidth: 2 },
      { type: 'arc', x: 13, y: 16, innerRadius: 0, outerRadius: 12, angle: 180, rotation: -180, stroke: color, strokeWidth: 2, fill: '#ffffff' },
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
      { type: 'arc', x: 13, y: 20, innerRadius: 0, outerRadius: 12, angle: 180, rotation: -180, stroke: color, strokeWidth: 2, fill: '#ffffff' },
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
      { type: 'arc', x: 13, y: 20, innerRadius: 0, outerRadius: 12, angle: 180, rotation: -180, stroke: color, strokeWidth: 2, fill: '#ffffff' },
      { type: 'line', points: [1, 20, 25, 20], stroke: color, strokeWidth: 2 },
      { type: 'arc', x: 13, y: 16, innerRadius: 0, outerRadius: 12, angle: 180, rotation: -180, stroke: color, strokeWidth: 2, fill: '#ffffff' },
      { type: 'line', points: [1, 16, 25, 16], stroke: color, strokeWidth: 2 },
      { type: 'line', points: [13, 16, 13, 4], stroke: color, strokeWidth: 2 },
      { type: 'line', points: [7, 4, 19, 4], stroke: color, strokeWidth: 2 }
    ]
  },
  {
    id: 'cat6a-contactdoos',
    name: 'Cat6a contactdoos',
    category: SymbolCategory.Elektra,
    width: 26,
    height: 24,
    shapes: [
      { type: 'line', points: [1, 24, 25, 24, 13, 2], stroke: color, strokeWidth: 2, closed: true, fill: '#ffffff' },
      { type: 'text', x: 6, y: 13, text: '6a', fontSize: 9, fill: color, fontStyle: 'bold' }
    ]
  },
  {
    id: 'cat5e-uutp-contactdoos',
    name: 'Cat5e U/UTP contactdoos',
    category: SymbolCategory.Elektra,
    width: 26,
    height: 24,
    shapes: [
      { type: 'line', points: [1, 24, 25, 24, 13, 2], stroke: color, strokeWidth: 2, closed: true, fill: '#ffffff' },
      { type: 'text', x: 6, y: 13, text: '5e', fontSize: 9, fill: color, fontStyle: 'bold' }
    ]
  }
]
