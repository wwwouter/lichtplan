import { useRef, useEffect, useLayoutEffect, useState } from 'react'
import { Group, Text, Rect, Circle } from 'react-konva'
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
      {definition.id === 'tekst' ? (
        <TextSymbol
          rotation={symbol.rotation}
          text={symbol.label}
          isSelected={isSelected}
        />
      ) : (
        <>
          <Group rotation={symbol.rotation}>
            {/* Transparent hit area so the Group receives pointer events */}
            <Rect
              x={-offsetX}
              y={-offsetY}
              width={definition.width}
              height={definition.height}
              fill="transparent"
            />
            <SymbolRenderer shapes={definition.shapes} color={color} offsetX={offsetX} offsetY={offsetY} />
            {symbol.group && (
              <GroupBadge group={symbol.group} offsetX={offsetX} offsetY={offsetY} />
            )}
            {isSelected && (
              <SelectionOutline width={definition.width} height={definition.height} offsetX={offsetX} offsetY={offsetY} />
            )}
          </Group>
          {symbol.label && (
            <SymbolLabel
              text={symbol.label}
              y={offsetY + 4}
              minWidth={definition.width}
            />
          )}
        </>
      )}
    </Group>
  )
}

function TextSymbol({
  rotation,
  text,
  isSelected
}: {
  rotation: number
  text: string | undefined
  isSelected: boolean
}) {
  const fontSize = 14
  const lineHeight = 1.15
  const padX = 2
  const padY = 1
  const placeholder = 'Tekst'
  const display = text && text.length > 0 ? text : placeholder
  const isPlaceholder = !text

  const textRef = useRef<Konva.Text>(null)
  const [size, setSize] = useState({ width: 40, height: fontSize })

  useLayoutEffect(() => {
    const node = textRef.current
    if (!node) return
    setSize({ width: node.width(), height: node.height() })
  }, [display])

  return (
    <Group rotation={rotation}>
      <Rect
        x={-padX}
        y={-padY}
        width={size.width + padX * 2}
        height={size.height + padY * 2}
        fill="#ffffff"
        stroke="#000000"
        strokeWidth={1}
        listening={true}
      />
      <Text
        ref={textRef}
        x={0}
        y={0}
        text={display}
        fontSize={fontSize}
        lineHeight={lineHeight}
        fill={isPlaceholder ? '#9ca3af' : '#111827'}
        wrap="none"
        listening={false}
      />
      {isSelected && (
        <Rect
          x={-padX - 4}
          y={-padY - 4}
          width={size.width + padX * 2 + 8}
          height={size.height + padY * 2 + 8}
          stroke="#3B82F6"
          strokeWidth={1.5}
          dash={[4, 3]}
          listening={false}
        />
      )}
    </Group>
  )
}

function SymbolLabel({
  text,
  y,
  minWidth
}: {
  text: string
  y: number
  minWidth: number
}) {
  const fontSize = 11
  const lineHeight = 1
  const padX = 2
  const padY = 1
  const longestWord = text.split(/\s+/).reduce((m, w) => (w.length > m ? w.length : m), 0)
  const labelWidth = Math.max(minWidth, Math.ceil(longestWord * fontSize * 0.62))

  const textRef = useRef<Konva.Text>(null)
  const [lines, setLines] = useState<Array<{ text: string; width: number }>>([])

  useLayoutEffect(() => {
    const node = textRef.current
    if (!node) return
    const arr = (node as unknown as { textArr?: Array<{ text: string; width: number }> }).textArr
    if (arr) {
      setLines(arr.map((l) => ({ text: l.text, width: l.width })))
    }
  }, [text, labelWidth])

  const maxLineWidth = lines.reduce((m, l) => (l.width > m ? l.width : m), 0)
  const boxWidth = Math.max(maxLineWidth, 1) + padX * 2
  const boxHeight = Math.max(lines.length, 1) * fontSize * lineHeight + padY * 2

  return (
    <>
      {lines.length > 0 && (
        <Rect
          x={-boxWidth / 2}
          y={y - padY}
          width={boxWidth}
          height={boxHeight}
          fill="#ffffff"
          stroke="#000000"
          strokeWidth={1}
          listening={false}
        />
      )}
      <Text
        ref={textRef}
        x={-labelWidth / 2}
        y={y}
        text={text}
        fontSize={fontSize}
        lineHeight={lineHeight}
        fill="#374151"
        width={labelWidth}
        align="center"
        wrap="word"
        listening={false}
      />
    </>
  )
}

function GroupBadge({ group, offsetX, offsetY }: { group: string; offsetX: number; offsetY: number }) {
  const radius = 9
  const x = offsetX - radius
  const y = -offsetY - radius
  const display = group.slice(0, 2).toUpperCase()

  return (
    <Group x={x} y={y} listening={false}>
      <Circle radius={radius} fill="#000000" />
      <Text
        text={display}
        fill="#ffffff"
        fontSize={10}
        fontStyle="bold"
        align="center"
        verticalAlign="middle"
        width={radius * 2}
        height={radius * 2}
        x={-radius}
        y={-radius + 1}
        listening={false}
      />
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
