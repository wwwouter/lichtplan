import { Circle, Group, Text } from 'react-konva'
import type { PlacedSymbol } from '../types/project'
import type { SymbolDefinition } from '../symbols'
import { getPlacedSymbolBounds, getPlacedSymbolDetailScale } from './symbolSizing'

interface Props {
  symbol: Pick<PlacedSymbol, 'x' | 'y'>
  definition: Pick<SymbolDefinition, 'id' | 'width' | 'height'>
}

export function SymbolQuestionMarker({ symbol, definition }: Props) {
  const scale = getPlacedSymbolDetailScale(definition)
  const radius = 8 * scale
  const gap = 3 * scale
  const bounds = getPlacedSymbolBounds(definition)

  return (
    <Group x={symbol.x} y={symbol.y - bounds.height / 2 - radius - gap} listening={false}>
      <Circle
        radius={radius}
        fill="#ffffff"
        stroke="#dc2626"
        strokeWidth={1.5 * scale}
        shadowColor="#111827"
        shadowOpacity={0.18}
        shadowBlur={3 * scale}
        shadowOffset={{ x: 0, y: 1 * scale }}
        listening={false}
      />
      <Text
        text="?"
        x={-radius}
        y={-radius - 1}
        width={radius * 2}
        height={radius * 2}
        align="center"
        verticalAlign="middle"
        fill="#dc2626"
        fontSize={15 * scale}
        fontStyle="bold"
        listening={false}
      />
    </Group>
  )
}
