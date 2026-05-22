import { getSymbolById } from '../symbols'
import type { Floor, PlacedSymbol } from '../types/project'
import {
  DIAGRAM_LINE_SYMBOL_ID,
  getDiagramLine,
  getDiagramLineLabel,
  getDiagramLineMidpoint
} from './diagramLine'
import { getSymbolLabelText, computeSmartLabelLayout, type LabelLayoutItem } from './labelLayout'
import { getPlacedSymbolBounds, getPlacedSymbolDetailScale } from './symbolSizing'
import { isPlacedSymbolVisible, TEXT_SYMBOL_ID } from './symbolVisibility'

interface Box {
  left: number
  top: number
  right: number
  bottom: number
}

interface FloorBoundsOptions {
  hiddenSymbolIds: Set<string>
  visibleSymbolIds?: Set<string> | null
  showItemId?: boolean
  showLabel?: boolean
}

const BOUNDS_PADDING = 40
const EMPTY_FLOOR_WIDTH = 1000
const EMPTY_FLOOR_HEIGHT = 700
const TEXT_FONT_SIZE = 14
const TEXT_LINE_HEIGHT = 1.15
const TEXT_PAD_X = 2
const TEXT_PAD_Y = 1
const TEXT_MIN_WIDTH = 40
const LABEL_FONT_SIZE = 11
const LABEL_PAD_X = 2
const LABEL_PAD_Y = 1
const LABEL_GAP = 4
const LINE_LABEL_FONT_SIZE = 11
const LINE_LABEL_PAD_X = 3
const LINE_LABEL_PAD_Y = 2
const AVG_CHARACTER_WIDTH = 0.62

export function getFloorContentBounds(
  floor: Floor,
  {
    hiddenSymbolIds,
    visibleSymbolIds = null,
    showItemId = true,
    showLabel = true
  }: FloorBoundsOptions
): { x: number; y: number; width: number; height: number } {
  const visibleSymbols = floor.symbols.filter(
    (symbol) =>
      isPlacedSymbolVisible(symbol, hiddenSymbolIds) &&
      (!visibleSymbolIds || visibleSymbolIds.has(symbol.id))
  )
  const boxes: Box[] = []

  if (floor.floorPlanImage) {
    boxes.push({
      left: 0,
      top: 0,
      right: floor.floorPlanImage.width,
      bottom: floor.floorPlanImage.height
    })
  }

  visibleSymbols.forEach((symbol) => {
    const box = getPlacedSymbolContentBox(symbol)
    if (box) boxes.push(box)
  })

  getPlacedLabelBoxes(visibleSymbols, showItemId, showLabel).forEach((box) => boxes.push(box))

  if (boxes.length === 0) {
    return { x: 0, y: 0, width: EMPTY_FLOOR_WIDTH, height: EMPTY_FLOOR_HEIGHT }
  }

  const combined = expandBox(
    boxes.reduce(
      (acc, box) => ({
        left: Math.min(acc.left, box.left),
        top: Math.min(acc.top, box.top),
        right: Math.max(acc.right, box.right),
        bottom: Math.max(acc.bottom, box.bottom)
      }),
      boxes[0]
    ),
    BOUNDS_PADDING
  )

  return {
    x: combined.left,
    y: combined.top,
    width: Math.max(combined.right - combined.left, 1),
    height: Math.max(combined.bottom - combined.top, 1)
  }
}

function getPlacedSymbolContentBox(symbol: PlacedSymbol): Box | null {
  if (symbol.symbolId === TEXT_SYMBOL_ID) return getTextSymbolBox(symbol)
  if (symbol.symbolId === DIAGRAM_LINE_SYMBOL_ID) return getDiagramLineBox(symbol)

  const definition = getSymbolById(symbol.symbolId)
  if (!definition) return null

  const bounds = getPlacedSymbolBounds(definition)
  return rotateLocalBox(symbol, {
    left: -bounds.offsetX,
    top: -bounds.offsetY,
    right: bounds.offsetX,
    bottom: bounds.offsetY
  })
}

function getTextSymbolBox(symbol: PlacedSymbol): Box {
  const definition = getSymbolById(symbol.symbolId)
  const scale = definition ? getPlacedSymbolDetailScale(definition) : 1
  const text = symbol.label && symbol.label.length > 0 ? symbol.label : 'Tekst'
  const size = estimateUnwrappedTextSize(
    text,
    TEXT_FONT_SIZE * scale,
    TEXT_LINE_HEIGHT,
    TEXT_MIN_WIDTH * scale
  )
  const padX = TEXT_PAD_X * scale
  const padY = TEXT_PAD_Y * scale

  return rotateLocalBox(symbol, {
    left: -padX,
    top: -padY,
    right: size.width + padX,
    bottom: size.height + padY
  })
}

function getDiagramLineBox(symbol: PlacedSymbol): Box {
  const line = getDiagramLine(symbol)
  const midpoint = getDiagramLineMidpoint(line)
  const label = getDiagramLineLabel(symbol)
  const lineBox = expandBox(
    {
      left: Math.min(symbol.x, symbol.x + line.endX),
      top: Math.min(symbol.y, symbol.y + line.endY),
      right: Math.max(symbol.x, symbol.x + line.endX),
      bottom: Math.max(symbol.y, symbol.y + line.endY)
    },
    10
  )

  if (!label) return lineBox

  const scale = 1
  const fontSize = LINE_LABEL_FONT_SIZE * scale
  const padX = LINE_LABEL_PAD_X * scale
  const padY = LINE_LABEL_PAD_Y * scale
  const size = estimateUnwrappedTextSize(label, fontSize, 1, 24 * scale)
  const labelBox = {
    left: symbol.x + midpoint.x - size.width / 2 - padX,
    top: symbol.y + midpoint.y - size.height / 2 - padY,
    right: symbol.x + midpoint.x + size.width / 2 + padX,
    bottom: symbol.y + midpoint.y + size.height / 2 + padY
  }

  return combineBoxes(lineBox, labelBox)
}

function getPlacedLabelBoxes(
  symbols: PlacedSymbol[],
  showItemId: boolean,
  showLabel: boolean
): Box[] {
  const items: LabelLayoutItem[] = symbols.flatMap((symbol) => {
    if (symbol.symbolId === TEXT_SYMBOL_ID || symbol.symbolId === DIAGRAM_LINE_SYMBOL_ID) return []
    const definition = getSymbolById(symbol.symbolId)
    if (!definition) return []
    const bounds = getPlacedSymbolBounds(definition)
    return [
      {
        id: symbol.id,
        symbolId: symbol.symbolId,
        x: symbol.x,
        y: symbol.y,
        width: bounds.width,
        height: bounds.height,
        itemId: symbol.itemId,
        label: symbol.label,
        location: symbol.location,
        category: definition.category,
        detailScale: getPlacedSymbolDetailScale(definition)
      }
    ]
  })
  const layouts = computeSmartLabelLayout(items, showItemId, showLabel)

  return items.flatMap((item) => {
    const text = getSymbolLabelText(item, showItemId, showLabel)
    if (!text) return []
    const scale = item.detailScale ?? 1
    const fontSize = LABEL_FONT_SIZE * scale
    const padX = LABEL_PAD_X * scale
    const padY = LABEL_PAD_Y * scale
    const labelWidth = Math.max(
      item.width,
      Math.ceil(getLongestWordLength(text) * fontSize * AVG_CHARACTER_WIDTH)
    )
    const size = estimateWrappedLabelSize(text, labelWidth, fontSize, padX, padY)
    const layout = layouts.get(item.id)
    const offsetX = layout?.offsetX ?? 0
    const offsetY = layout?.offsetY ?? 0
    const top = item.y + item.height / 2 + LABEL_GAP * scale - padY + offsetY
    const centerX = item.x + offsetX

    return [
      {
        left: centerX - size.width / 2,
        top,
        right: centerX + size.width / 2,
        bottom: top + size.height
      }
    ]
  })
}

function estimateUnwrappedTextSize(
  text: string,
  fontSize: number,
  lineHeight: number,
  minWidth: number
): { width: number; height: number } {
  const lines = text.split(/\r?\n/)
  const longestLineLength = lines.reduce((max, line) => Math.max(max, line.length), 0)

  return {
    width: Math.max(minWidth, Math.ceil(longestLineLength * fontSize * AVG_CHARACTER_WIDTH)),
    height: Math.max(lines.length, 1) * fontSize * lineHeight
  }
}

function estimateWrappedLabelSize(
  text: string,
  labelWidth: number,
  fontSize: number,
  padX: number,
  padY: number
): { width: number; height: number } {
  const avgCharWidth = fontSize * AVG_CHARACTER_WIDTH
  const wrappedLines = text
    .split('\n')
    .flatMap((line) => wrapLine(line, labelWidth, avgCharWidth))
  const textWidth = wrappedLines.reduce(
    (max, line) => Math.max(max, Math.ceil(line.length * avgCharWidth)),
    1
  )

  return {
    width: textWidth + padX * 2,
    height: Math.max(wrappedLines.length, 1) * fontSize + padY * 2
  }
}

function wrapLine(line: string, maxWidth: number, avgCharWidth: number): string[] {
  const words = line.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']

  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length * avgCharWidth <= maxWidth || current.length === 0) {
      current = next
    } else {
      lines.push(current)
      current = word
    }
  }

  if (current) lines.push(current)
  return lines
}

function getLongestWordLength(text: string): number {
  return text.split(/\s+/).reduce((max, word) => Math.max(max, word.length), 0)
}

function rotateLocalBox(symbol: PlacedSymbol, box: Box): Box {
  const radians = ((symbol.rotation || 0) * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const points = [
    { x: box.left, y: box.top },
    { x: box.right, y: box.top },
    { x: box.right, y: box.bottom },
    { x: box.left, y: box.bottom }
  ].map((point) => ({
    x: symbol.x + point.x * cos - point.y * sin,
    y: symbol.y + point.x * sin + point.y * cos
  }))

  return {
    left: Math.min(...points.map((point) => point.x)),
    top: Math.min(...points.map((point) => point.y)),
    right: Math.max(...points.map((point) => point.x)),
    bottom: Math.max(...points.map((point) => point.y))
  }
}

function combineBoxes(a: Box, b: Box): Box {
  return {
    left: Math.min(a.left, b.left),
    top: Math.min(a.top, b.top),
    right: Math.max(a.right, b.right),
    bottom: Math.max(a.bottom, b.bottom)
  }
}

function expandBox(box: Box, amount: number): Box {
  return {
    left: box.left - amount,
    top: box.top - amount,
    right: box.right + amount,
    bottom: box.bottom + amount
  }
}
