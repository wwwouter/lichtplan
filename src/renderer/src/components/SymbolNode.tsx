import { useRef, useEffect } from 'react'
import { Group, Text, Rect } from 'react-konva'
import Konva from 'konva'
import { PlacedSymbol } from '../types/project'
import { SymbolDefinition, CATEGORY_COLORS } from '../symbols'
import { SymbolRenderer } from './SymbolRenderer'
import { useProjectStore } from '../stores/useProjectStore'
import { useCanvasStore } from '../stores/useCanvasStore'
import { useUIStore } from '../stores/useUIStore'

interface Props {
  symbol: PlacedSymbol
  definition: SymbolDefinition
  floorId: string
  isSelected: boolean
}

export function SymbolNode({ symbol, definition, floorId, isSelected }: Props) {
  const groupRef = useRef<Konva.Group>(null)
  const updateSymbol = useProjectStore((s) => s.updateSymbol)
  const setSelectedSymbol = useCanvasStore((s) => s.setSelectedSymbol)
  const setContextMenu = useUIStore((s) => s.setContextMenu)

  const color = CATEGORY_COLORS[definition.category]
  const offsetX = definition.width / 2
  const offsetY = definition.height / 2

  useEffect(() => {
    if (groupRef.current && isSelected) {
      groupRef.current.moveToTop()
    }
  }, [isSelected])

  return (
    <Group
      ref={groupRef}
      x={symbol.x}
      y={symbol.y}
      rotation={symbol.rotation}
      draggable
      onClick={(e) => {
        e.cancelBubble = true
        setSelectedSymbol(symbol.id)
      }}
      onTap={(e) => {
        e.cancelBubble = true
        setSelectedSymbol(symbol.id)
      }}
      onDragEnd={(e) => {
        updateSymbol(floorId, symbol.id, {
          x: e.target.x(),
          y: e.target.y()
        })
      }}
      onContextMenu={(e) => {
        e.evt.preventDefault()
        e.cancelBubble = true
        setSelectedSymbol(symbol.id)
        const stage = e.target.getStage()
        if (stage) {
          const pos = stage.getPointerPosition()
          if (pos) {
            setContextMenu({ x: pos.x, y: pos.y, symbolId: symbol.id })
          }
        }
      }}
    >
      {/* Transparent hit area so the Group receives pointer events */}
      <Rect
        x={-offsetX}
        y={-offsetY}
        width={definition.width}
        height={definition.height}
        fill="transparent"
      />
      <SymbolRenderer shapes={definition.shapes} color={color} offsetX={offsetX} offsetY={offsetY} />
      {isSelected && (
        <SelectionOutline width={definition.width} height={definition.height} offsetX={offsetX} offsetY={offsetY} />
      )}
      {symbol.label && (
        <Text
          x={-offsetX}
          y={offsetY + 4}
          text={symbol.label}
          fontSize={11}
          fill="#374151"
          width={definition.width}
          align="center"
          listening={false}
        />
      )}
    </Group>
  )
}

function SelectionOutline({
  width,
  height,
  offsetX,
  offsetY
}: {
  width: number
  height: number
  offsetX: number
  offsetY: number
}) {
  const pad = 4
  return (
    <Rect
      x={-offsetX - pad}
      y={-offsetY - pad}
      width={width + pad * 2}
      height={height + pad * 2}
      stroke="#3B82F6"
      strokeWidth={1.5}
      dash={[4, 3]}
      listening={false}
    />
  )
}
