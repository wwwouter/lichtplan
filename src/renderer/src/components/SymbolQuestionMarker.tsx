import { Circle, Group, Text } from 'react-konva'
import type { PlacedSymbol } from '../types/project'
import type { SymbolDefinition } from '../symbols'

interface Props {
  symbol: Pick<PlacedSymbol, 'x' | 'y'>
  definition: Pick<SymbolDefinition, 'height'>
}

export function SymbolQuestionMarker({ symbol, definition }: Props) {
  const radius = 8
  const gap = 3

  return (
    <Group x={symbol.x} y={symbol.y - definition.height / 2 - radius - gap} listening={false}>
      <Circle
        radius={radius}
        fill="#ffffff"
        stroke="#dc2626"
        strokeWidth={1.5}
        shadowColor="#111827"
        shadowOpacity={0.18}
        shadowBlur={3}
        shadowOffset={{ x: 0, y: 1 }}
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
        fontSize={15}
        fontStyle="bold"
        listening={false}
      />
    </Group>
  )
}
