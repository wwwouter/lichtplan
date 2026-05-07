import { useLayoutEffect, useRef, useState } from 'react'
import { Group, Rect, Text } from 'react-konva'
import Konva from 'konva'
import type { PlacedSymbol } from '../types/project'
import type { SymbolDefinition } from '../symbols'
import { formatSymbolTooltipText } from './symbolTooltip'

interface Props {
  symbol: PlacedSymbol
  definition: SymbolDefinition
}

export function SymbolInfoTooltip({ symbol, definition }: Props) {
  const text = formatSymbolTooltipText(symbol)
  const textRef = useRef<Konva.Text>(null)
  const [textHeight, setTextHeight] = useState(30)

  useLayoutEffect(() => {
    const node = textRef.current
    if (!node) {
      return
    }
    setTextHeight(node.height())
  }, [text])

  if (!text) {
    return null
  }

  const fontSize = 11
  const lineHeight = 1.25
  const width = 170
  const padX = 7
  const padY = 5
  const boxWidth = width + padX * 2
  const boxHeight = textHeight + padY * 2
  const x = symbol.x + definition.width / 2 + 8
  const y = symbol.y - definition.height / 2 - boxHeight - 8

  return (
    <Group x={x} y={y} listening={false}>
      <Rect
        width={boxWidth}
        height={boxHeight}
        fill="#ffffff"
        stroke="#111827"
        strokeWidth={1}
        cornerRadius={3}
        shadowColor="#111827"
        shadowOpacity={0.16}
        shadowBlur={4}
        shadowOffset={{ x: 0, y: 2 }}
        listening={false}
      />
      <Text
        ref={textRef}
        x={padX}
        y={padY}
        text={text}
        width={width}
        fontSize={fontSize}
        lineHeight={lineHeight}
        fill="#111827"
        wrap="word"
        listening={false}
      />
    </Group>
  )
}
