import { SymbolDefinition, SymbolCategory, CATEGORY_COLORS } from './types'

const color = CATEGORY_COLORS[SymbolCategory.Schakelaars]

export const switchSymbols: SymbolDefinition[] = [
  {
    id: 'enkelpolige-schakelaar',
    name: 'Enkelpolige schakelaar',
    category: SymbolCategory.Schakelaars,
    width: 26,
    height: 26,
    shapes: [
      { type: 'circle', x: 5, y: 21, radius: 4, fill: color },
      { type: 'line', points: [7, 19, 22, 4], stroke: color, strokeWidth: 2 }
    ]
  },
  {
    id: 'wisselschakelaar',
    name: 'Wisselschakelaar',
    category: SymbolCategory.Schakelaars,
    width: 26,
    height: 26,
    shapes: [
      { type: 'circle', x: 5, y: 13, radius: 4, fill: color },
      { type: 'line', points: [7, 11, 24, 3], stroke: color, strokeWidth: 2 },
      { type: 'line', points: [7, 15, 24, 23], stroke: color, strokeWidth: 2 }
    ]
  },
  {
    id: 'dimmer',
    name: 'Dimmer',
    category: SymbolCategory.Schakelaars,
    width: 26,
    height: 26,
    shapes: [
      { type: 'circle', x: 5, y: 21, radius: 4, fill: color },
      { type: 'line', points: [7, 19, 22, 4], stroke: color, strokeWidth: 2 },
      { type: 'text', x: 18, y: 8, text: 'D', fontSize: 12, fill: color, fontStyle: 'bold' }
    ]
  },
  {
    id: 'serieschakelaar',
    name: 'Serieschakelaar',
    category: SymbolCategory.Schakelaars,
    width: 26,
    height: 26,
    shapes: [
      { type: 'circle', x: 5, y: 21, radius: 4, fill: color },
      { type: 'line', points: [7, 19, 22, 4], stroke: color, strokeWidth: 2 },
      { type: 'text', x: 18, y: 8, text: '2', fontSize: 12, fill: color, fontStyle: 'bold' }
    ]
  }
]
