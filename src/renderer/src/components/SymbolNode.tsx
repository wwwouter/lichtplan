import { useRef, useLayoutEffect, useState } from 'react'
import { Group, Text, Rect, Circle, Line } from 'react-konva'
import Konva from 'konva'
import { PlacedSymbol } from '../types/project'
import { SymbolDefinition, CATEGORY_COLORS } from '../symbols'
import { SymbolRenderer } from './SymbolRenderer'
import { useProjectStore } from '../stores/useProjectStore'
import { useCanvasStore } from '../stores/useCanvasStore'
import { useUIStore } from '../stores/useUIStore'
import { getSymbolLabelText } from './labelLayout'
import { getGroupBadgePosition } from './symbolBadges'
import {
  getPlacedSymbolBounds,
  getPlacedSymbolDetailScale,
  getPlacedSymbolIconScale
} from './symbolSizing'
import {
  DIAGRAM_LINE_SYMBOL_ID,
  getDiagramLine,
  getDiagramLineDash,
  getDiagramLineLabel,
  moveDiagramLineEnd,
  moveDiagramLineStart,
  type DiagramLinePoint
} from './diagramLine'
import { TEXT_SYMBOL_ID } from './symbolVisibility'
import { getLabelLeaderLineStyle, getLabelLeaderSegment } from './symbolLabelLeader'

interface Props {
  symbol: PlacedSymbol
  definition: SymbolDefinition
  floorId: string
  isSelected: boolean
  labelLayout?: { offsetX: number; offsetY: number; moved: boolean }
  onHoverChange?: (symbolId: string | null) => void
}

export function SymbolNode({
  symbol,
  definition,
  floorId,
  isSelected,
  labelLayout,
  onHoverChange
}: Props) {
  const groupRef = useRef<Konva.Group>(null)
  const updateSymbol = useProjectStore((s) => s.updateSymbol)
  const setSelectedSymbol = useCanvasStore((s) => s.setSelectedSymbol)
  const setContextMenu = useUIStore((s) => s.setContextMenu)
  const showItemId = useUIStore((s) => s.showItemId)
  const showGroup = useUIStore((s) => s.showGroup)
  const showLabel = useUIStore((s) => s.showLabel)

  const color = CATEGORY_COLORS[definition.category]
  const offsetX = definition.width / 2
  const offsetY = definition.height / 2
  const iconScale = getPlacedSymbolIconScale(definition)
  const detailScale = getPlacedSymbolDetailScale(definition)
  const iconBounds = getPlacedSymbolBounds(definition)
  const isDiagramLine = definition.id === DIAGRAM_LINE_SYMBOL_ID
  const labelText = getSymbolLabelText(symbol, showItemId, showLabel)

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
      onMouseEnter={() => onHoverChange?.(symbol.id)}
      onMouseLeave={() => onHoverChange?.(null)}
      onDragStart={() => onHoverChange?.(null)}
      onDragEnd={(e) => {
        if (e.target !== groupRef.current) return
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
      {definition.id === TEXT_SYMBOL_ID ? (
        <TextSymbol
          rotation={symbol.rotation}
          text={symbol.label}
          isSelected={isSelected}
          scale={detailScale}
        />
      ) : isDiagramLine ? (
        <DiagramLineSymbol
          symbol={symbol}
          floorId={floorId}
          color={color}
          isSelected={isSelected}
          detailScale={detailScale}
          updateSymbol={updateSymbol}
        />
      ) : (
        <>
          <Group rotation={symbol.rotation}>
            {/* Transparent hit area so the Group receives pointer events */}
            <Rect
              x={-Math.max(iconBounds.width, 16) / 2}
              y={-Math.max(iconBounds.height, 16) / 2}
              width={Math.max(iconBounds.width, 16)}
              height={Math.max(iconBounds.height, 16)}
              fill="transparent"
            />
            <Group scaleX={iconScale} scaleY={iconScale}>
              <SymbolRenderer
                shapes={definition.shapes}
                color={color}
                offsetX={offsetX}
                offsetY={offsetY}
              />
            </Group>
            {isSelected && (
              <SelectionOutline
                width={iconBounds.width}
                height={iconBounds.height}
                offsetX={iconBounds.offsetX}
                offsetY={iconBounds.offsetY}
              />
            )}
          </Group>
          {showGroup && symbol.group && (
            <GroupBadge
              group={symbol.group}
              offsetX={iconBounds.offsetX}
              offsetY={iconBounds.offsetY}
              definitionWidth={iconBounds.width}
              category={definition.category}
              scale={detailScale}
            />
          )}
          {labelText && (
            <SymbolLabel
              text={labelText}
              y={iconBounds.offsetY + 4 * detailScale}
              minWidth={iconBounds.width}
              offset={labelLayout}
              iconBox={{
                left: -iconBounds.offsetX,
                top: -iconBounds.offsetY,
                width: iconBounds.width,
                height: iconBounds.height
              }}
              scale={detailScale}
            />
          )}
        </>
      )}
    </Group>
  )
}

function DiagramLineSymbol({
  symbol,
  floorId,
  color,
  isSelected,
  detailScale,
  updateSymbol
}: {
  symbol: PlacedSymbol
  floorId: string
  color: string
  isSelected: boolean
  detailScale: number
  updateSymbol: (floorId: string, symbolId: string, updates: Partial<PlacedSymbol>) => void
}) {
  const line = getDiagramLine(symbol)
  const [draftSegment, setDraftSegment] = useState<{
    start: DiagramLinePoint
    end: DiagramLinePoint
  } | null>(null)
  const segment = draftSegment ?? {
    start: { x: 0, y: 0 },
    end: { x: line.endX, y: line.endY }
  }
  const bounds = getSegmentBounds(segment.start, segment.end, 10)
  const labelText = getDiagramLineLabel(symbol)
  const labelCenter = getSegmentMidpoint(segment.start, segment.end)

  const handleStartDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const point = { x: e.target.x(), y: e.target.y() }
    updateSymbol(floorId, symbol.id, moveDiagramLineStart(symbol, line, point))
    setDraftSegment(null)
  }

  const handleEndDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const point = { x: e.target.x(), y: e.target.y() }
    updateSymbol(floorId, symbol.id, moveDiagramLineEnd(line, point))
    setDraftSegment(null)
  }

  return (
    <>
      <Line
        points={[segment.start.x, segment.start.y, segment.end.x, segment.end.y]}
        stroke={color}
        strokeWidth={2}
        hitStrokeWidth={12}
        dash={getDiagramLineDash(line)}
        lineCap="round"
      />
      {labelText && (
        <LineSymbolLabel text={labelText} x={labelCenter.x} y={labelCenter.y} scale={detailScale} />
      )}
      {isSelected && (
        <>
          <Rect
            x={bounds.x}
            y={bounds.y}
            width={bounds.width}
            height={bounds.height}
            stroke="#3B82F6"
            strokeWidth={1.5}
            dash={[4, 3]}
            listening={false}
          />
          <LineHandle
            x={segment.start.x}
            y={segment.start.y}
            onDragMove={(point) =>
              setDraftSegment({
                start: point,
                end: { x: line.endX, y: line.endY }
              })
            }
            onDragEnd={handleStartDragEnd}
          />
          <LineHandle
            x={segment.end.x}
            y={segment.end.y}
            onDragMove={(point) =>
              setDraftSegment({
                start: { x: 0, y: 0 },
                end: point
              })
            }
            onDragEnd={handleEndDragEnd}
          />
        </>
      )}
    </>
  )
}

function LineHandle({
  x,
  y,
  onDragMove,
  onDragEnd
}: {
  x: number
  y: number
  onDragMove: (point: DiagramLinePoint) => void
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void
}) {
  return (
    <Circle
      x={x}
      y={y}
      radius={5}
      fill="#ffffff"
      stroke="#3B82F6"
      strokeWidth={2}
      draggable
      onDragMove={(e) => onDragMove({ x: e.target.x(), y: e.target.y() })}
      onDragEnd={onDragEnd}
    />
  )
}

function LineSymbolLabel({
  text,
  x,
  y,
  scale
}: {
  text: string
  x: number
  y: number
  scale: number
}) {
  const fontSize = 11 * scale
  const lineHeight = 1
  const padX = 3 * scale
  const padY = 2 * scale
  const lines = text.split('\n')
  const longestLine = lines.reduce((max, line) => Math.max(max, line.length), 0)
  const width = Math.max(24 * scale, Math.ceil(longestLine * fontSize * 0.62) + padX * 2)
  const height = Math.max(lines.length, 1) * fontSize * lineHeight + padY * 2

  return (
    <Group x={x} y={y} listening={false}>
      <Rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        fill="#ffffff"
        stroke="#000000"
        strokeWidth={1 * scale}
        listening={false}
      />
      <Text
        x={-width / 2 + padX}
        y={-height / 2 + padY}
        text={text}
        width={width - padX * 2}
        fontSize={fontSize}
        lineHeight={lineHeight}
        fill="#111827"
        align="center"
        wrap="none"
        listening={false}
      />
    </Group>
  )
}

function getSegmentMidpoint(start: DiagramLinePoint, end: DiagramLinePoint): DiagramLinePoint {
  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2
  }
}

function getSegmentBounds(start: DiagramLinePoint, end: DiagramLinePoint, padding: number) {
  const minX = Math.min(start.x, end.x)
  const minY = Math.min(start.y, end.y)
  const maxX = Math.max(start.x, end.x)
  const maxY = Math.max(start.y, end.y)

  return {
    x: minX - padding,
    y: minY - padding,
    width: Math.max(maxX - minX + padding * 2, padding * 2),
    height: Math.max(maxY - minY + padding * 2, padding * 2)
  }
}

function TextSymbol({
  rotation,
  text,
  isSelected,
  scale
}: {
  rotation: number
  text: string | undefined
  isSelected: boolean
  scale: number
}) {
  const fontSize = 14 * scale
  const lineHeight = 1.15
  const padX = 2 * scale
  const padY = 1 * scale
  const placeholder = 'Tekst'
  const display = text && text.length > 0 ? text : placeholder
  const isPlaceholder = !text

  const textRef = useRef<Konva.Text>(null)
  const [size, setSize] = useState({ width: 40 * scale, height: fontSize })

  useLayoutEffect(() => {
    const node = textRef.current
    if (!node) return
    setSize({ width: node.width(), height: node.height() })
  }, [display, scale])

  return (
    <Group rotation={rotation}>
      <Rect
        x={-padX}
        y={-padY}
        width={size.width + padX * 2}
        height={size.height + padY * 2}
        fill="#ffffff"
        stroke="#000000"
        strokeWidth={1 * scale}
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
          x={-padX - 4 * scale}
          y={-padY - 4 * scale}
          width={size.width + padX * 2 + 8 * scale}
          height={size.height + padY * 2 + 8 * scale}
          stroke="#3B82F6"
          strokeWidth={1.5 * scale}
          dash={[4 * scale, 3 * scale]}
          listening={false}
        />
      )}
    </Group>
  )
}

function SymbolLabel({
  text,
  y,
  minWidth,
  offset,
  iconBox,
  scale
}: {
  text: string
  y: number
  minWidth: number
  offset?: { offsetX: number; offsetY: number; moved: boolean }
  iconBox: { left: number; top: number; width: number; height: number }
  scale: number
}) {
  const fontSize = 11 * scale
  const lineHeight = 1
  const padX = 2 * scale
  const padY = 1 * scale
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
  const offsetX = offset?.offsetX ?? 0
  const offsetY = offset?.offsetY ?? 0
  const labelY = y + offsetY
  const boxLeft = offsetX - boxWidth / 2
  const boxTop = labelY - padY
  const leaderSegment = getLabelLeaderSegment({
    iconBox,
    labelBox: {
      left: boxLeft,
      top: boxTop,
      width: boxWidth,
      height: boxHeight
    }
  })
  const leaderLength =
    leaderSegment
      ? Math.sqrt(
          (leaderSegment.to.x - leaderSegment.from.x) ** 2 +
            (leaderSegment.to.y - leaderSegment.from.y) ** 2
        )
      : 0
  const showLeader = offset?.moved && leaderSegment && leaderLength > 1 * scale
  const leaderLineStyle = getLabelLeaderLineStyle(scale)

  return (
    <>
      {showLeader && (
        <>
          <Line
            points={[
              leaderSegment.from.x,
              leaderSegment.from.y,
              leaderSegment.to.x,
              leaderSegment.to.y
            ]}
            stroke={leaderLineStyle.haloStroke}
            strokeWidth={leaderLineStyle.haloStrokeWidth}
            lineCap="round"
            lineJoin="round"
            listening={false}
          />
          <Line
            points={[
              leaderSegment.from.x,
              leaderSegment.from.y,
              leaderSegment.to.x,
              leaderSegment.to.y
            ]}
            stroke={leaderLineStyle.stroke}
            strokeWidth={leaderLineStyle.strokeWidth}
            opacity={leaderLineStyle.opacity}
            lineCap="round"
            lineJoin="round"
            listening={false}
          />
        </>
      )}
      {lines.length > 0 && (
        <Rect
          x={boxLeft}
          y={boxTop}
          width={boxWidth}
          height={boxHeight}
          fill="#ffffff"
          stroke="#000000"
          strokeWidth={1 * scale}
          listening={false}
        />
      )}
      <Text
        ref={textRef}
        x={offsetX - labelWidth / 2}
        y={labelY}
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

function GroupBadge({
  group,
  offsetX,
  offsetY,
  definitionWidth,
  category,
  scale
}: {
  group: string
  offsetX: number
  offsetY: number
  definitionWidth: number
  category: SymbolDefinition['category']
  scale: number
}) {
  const { x, y, radius } = getGroupBadgePosition({
    category,
    offsetX,
    offsetY,
    definitionWidth,
    scale
  })
  const display = group.slice(0, 2).toUpperCase()

  return (
    <Group x={x} y={y} listening={false}>
      <Circle radius={radius} fill="#ffffff" stroke="#000000" strokeWidth={1 * scale} />
      <Text
        text={display}
        fill="#000000"
        fontSize={7 * scale}
        fontStyle="bold"
        align="center"
        verticalAlign="middle"
        width={radius * 2}
        height={radius * 2}
        x={-radius}
        y={-radius + 1 * scale}
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
