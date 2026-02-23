import { SymbolDefinition, SymbolCategory, CATEGORY_COLORS } from './types'

const color = CATEGORY_COLORS[SymbolCategory.Overig]

export const otherSymbols: SymbolDefinition[] = [
  {
    id: 'persoon',
    name: 'Persoon',
    category: SymbolCategory.Overig,
    width: 20,
    height: 30,
    shapes: [
      { type: 'circle', x: 10, y: 5, radius: 4, stroke: color, strokeWidth: 2 },
      { type: 'line', points: [10, 9, 10, 20], stroke: color, strokeWidth: 2 },
      { type: 'line', points: [2, 14, 18, 14], stroke: color, strokeWidth: 2 },
      { type: 'line', points: [10, 20, 3, 29], stroke: color, strokeWidth: 2 },
      { type: 'line', points: [10, 20, 17, 29], stroke: color, strokeWidth: 2 }
    ]
  },
  {
    id: 'aansluitpunt',
    name: 'Aansluitpunt',
    category: SymbolCategory.Overig,
    width: 16,
    height: 16,
    shapes: [
      { type: 'circle', x: 8, y: 8, radius: 7, fill: color }
    ]
  },
  {
    id: 'centraaldoos',
    name: 'Centraaldoos',
    category: SymbolCategory.Overig,
    width: 26,
    height: 26,
    shapes: [
      { type: 'circle', x: 13, y: 13, radius: 12, stroke: color, strokeWidth: 2 },
      { type: 'circle', x: 13, y: 13, radius: 3, fill: color }
    ]
  },
  {
    id: 'bewegingssensor',
    name: 'Bewegingssensor',
    category: SymbolCategory.Overig,
    width: 30,
    height: 30,
    shapes: [
      { type: 'circle', x: 15, y: 23, radius: 3, fill: color },
      { type: 'path', data: 'M 8.9 17.9 A 8 8 0 0 1 21.1 17.9', stroke: color, strokeWidth: 2 },
      { type: 'path', data: 'M 5 14.6 A 13 13 0 0 1 25 14.6', stroke: color, strokeWidth: 2 },
      { type: 'path', data: 'M 1.2 11.4 A 18 18 0 0 1 28.8 11.4', stroke: color, strokeWidth: 2 }
    ]
  }
]
