import { SymbolDefinition, SymbolCategory, CATEGORY_COLORS } from './types'

const color = CATEGORY_COLORS[SymbolCategory.Verlichting]

export const lightingSymbols: SymbolDefinition[] = [
  {
    id: 'lichtpunt-plafond',
    name: 'Lichtpunt plafond',
    category: SymbolCategory.Verlichting,
    width: 30,
    height: 30,
    shapes: [
      { type: 'circle', x: 15, y: 15, radius: 14, stroke: color, strokeWidth: 2 },
      { type: 'line', points: [3, 3, 27, 27], stroke: color, strokeWidth: 2 },
      { type: 'line', points: [27, 3, 3, 27], stroke: color, strokeWidth: 2 }
    ]
  },
  {
    id: 'wandlamp',
    name: 'Wandlamp',
    category: SymbolCategory.Verlichting,
    width: 30,
    height: 24,
    shapes: [
      { type: 'arc', x: 15, y: 20, innerRadius: 0, outerRadius: 12, angle: 180, rotation: -180, fill: color },
      { type: 'line', points: [3, 20, 27, 20], stroke: color, strokeWidth: 2 },
      { type: 'line', points: [9, 8, 6, 2], stroke: color, strokeWidth: 2 },
      { type: 'line', points: [15, 8, 15, 1], stroke: color, strokeWidth: 2 },
      { type: 'line', points: [21, 8, 24, 2], stroke: color, strokeWidth: 2 }
    ]
  },
  {
    id: 'inbouwspot',
    name: 'Inbouwspot',
    category: SymbolCategory.Verlichting,
    width: 26,
    height: 26,
    shapes: [
      { type: 'circle', x: 13, y: 13, radius: 5, fill: color },
      { type: 'line', points: [13, 0, 13, 4], stroke: color, strokeWidth: 1.5 },
      { type: 'line', points: [13, 22, 13, 26], stroke: color, strokeWidth: 1.5 },
      { type: 'line', points: [0, 13, 4, 13], stroke: color, strokeWidth: 1.5 },
      { type: 'line', points: [22, 13, 26, 13], stroke: color, strokeWidth: 1.5 },
      { type: 'line', points: [4, 4, 7, 7], stroke: color, strokeWidth: 1.5 },
      { type: 'line', points: [19, 4, 22, 7], stroke: color, strokeWidth: 1.5, closed: false },
      { type: 'line', points: [4, 19, 7, 22], stroke: color, strokeWidth: 1.5, closed: false },
      { type: 'line', points: [19, 19, 22, 22], stroke: color, strokeWidth: 1.5 }
    ]
  },
  {
    id: 'led-strip',
    name: 'LED strip',
    category: SymbolCategory.Verlichting,
    width: 40,
    height: 10,
    shapes: [
      { type: 'line', points: [2, 5, 38, 5], stroke: color, strokeWidth: 3, dash: [4, 3] },
      { type: 'circle', x: 2, y: 5, radius: 2, fill: color },
      { type: 'circle', x: 38, y: 5, radius: 2, fill: color }
    ]
  },
  {
    id: 'noodverlichting',
    name: 'Noodverlichting',
    category: SymbolCategory.Verlichting,
    width: 30,
    height: 30,
    shapes: [
      { type: 'line', points: [15, 2, 28, 26, 2, 26], stroke: color, strokeWidth: 2, closed: true },
      { type: 'circle', x: 15, y: 16, radius: 4, fill: color },
      { type: 'line', points: [15, 8, 15, 10], stroke: color, strokeWidth: 2 }
    ]
  }
]
