import { SymbolDefinition, SymbolCategory, CATEGORY_COLORS } from './types'

const color = CATEGORY_COLORS[SymbolCategory.Annotaties]

export const annotationSymbols: SymbolDefinition[] = [
  {
    id: 'tekst',
    name: 'Tekst',
    category: SymbolCategory.Annotaties,
    width: 24,
    height: 24,
    shapes: [
      { type: 'line', points: [4, 5, 20, 5], stroke: color, strokeWidth: 2 },
      { type: 'line', points: [12, 5, 12, 21], stroke: color, strokeWidth: 2 }
    ]
  },
  {
    id: 'lijn',
    name: 'Lijn',
    category: SymbolCategory.Annotaties,
    width: 42,
    height: 20,
    shapes: [
      { type: 'line', points: [2, 6, 40, 6], stroke: color, strokeWidth: 2 },
      { type: 'line', points: [2, 14, 40, 14], stroke: color, strokeWidth: 2, dash: [4, 4] }
    ]
  }
]
