import type { PlacedSymbol } from '../types/project'

const FONT_SIZE = 11
const LINE_HEIGHT = 1
const PAD_X = 2
const PAD_Y = 1
const AVG_CHAR_WIDTH = FONT_SIZE * 0.62
const LABEL_GAP = 4
const SYMBOL_PAD = 3
const MAX_LABEL_MOVE = 42

interface LabelSize {
  width: number
  height: number
}

interface Box {
  left: number
  top: number
  right: number
  bottom: number
}

export interface LabelLayoutItem {
  id: string
  symbolId: string
  x: number
  y: number
  width: number
  height: number
  itemId?: string
  label?: string
  location?: string
  category?: string
}

export interface LabelLayout {
  offsetX: number
  offsetY: number
  moved: boolean
}

interface PreparedLabel {
  item: LabelLayoutItem
  text: string
  size: LabelSize
  defaultCenterX: number
  defaultTop: number
  defaultBox: Box
  density: number
}

interface Candidate {
  centerX: number
  top: number
}

export function getSymbolLabelText(
  symbol: Pick<PlacedSymbol, 'itemId' | 'label' | 'location'>,
  showItemId: boolean,
  showLabel: boolean
): string | null {
  const descriptiveLines = showLabel
    ? [symbol.label, symbol.location].flatMap((value) => getDisplayLines(value))
    : []

  if (showItemId && symbol.itemId) {
    return descriptiveLines.length > 0
      ? [`[${symbol.itemId}]`, ...descriptiveLines].join('\n')
      : `[${symbol.itemId}]`
  }
  if (descriptiveLines.length > 0) return descriptiveLines.join('\n')
  return null
}

export function computeSmartLabelLayout(
  items: LabelLayoutItem[],
  showItemId: boolean,
  showLabel: boolean
): Map<string, LabelLayout> {
  const prepared = prepareLabels(items, showItemId, showLabel)
  const iconObstacles = items.map((item) =>
    expandBox(
      {
        left: item.x - item.width / 2,
        top: item.y - item.height / 2,
        right: item.x + item.width / 2,
        bottom: item.y + item.height / 2
      },
      SYMBOL_PAD
    )
  )
  const fixedLabels = prepared.filter((label) => !canMoveLabel(label))
  const placedBoxes: Box[] = fixedLabels.map((label) => expandBox(label.defaultBox, LABEL_GAP / 2))
  const result = new Map<string, LabelLayout>()

  fixedLabels.forEach((label) => {
    result.set(label.item.id, { offsetX: 0, offsetY: 0, moved: false })
  })

  for (const label of prepared.filter(canMoveLabel)) {
    const candidates = buildCandidates(label)
    let bestCandidate = candidates[0]
    let bestScore = Number.POSITIVE_INFINITY

    candidates.forEach((candidate, index) => {
      const box = candidateBox(candidate, label.size)
      const labelOverlap = placedBoxes.reduce(
        (sum, placed) => sum + overlapArea(expandBox(box, LABEL_GAP / 2), placed),
        0
      )
      const symbolOverlap = iconObstacles.reduce((sum, obstacle) => {
        return sum + overlapArea(box, obstacle)
      }, 0)
      const dx = candidate.centerX - label.defaultCenterX
      const dy = candidate.top - label.defaultTop
      const distance = Math.sqrt(dx * dx + dy * dy)
      const score =
        labelOverlap * 10000 +
        symbolOverlap * 8000 +
        distance * 3 +
        Math.abs(dx) * 0.35 +
        Math.abs(dy) * 0.2 +
        index * 0.01

      if (score < bestScore) {
        bestScore = score
        bestCandidate = candidate
      }
    })

    const box = candidateBox(bestCandidate, label.size)
    placedBoxes.push(expandBox(box, LABEL_GAP / 2))
    const offsetX = bestCandidate.centerX - label.item.x
    const offsetY = bestCandidate.top - label.defaultTop
    result.set(label.item.id, {
      offsetX,
      offsetY,
      moved: Math.abs(offsetX) > 2 || Math.abs(offsetY) > 2
    })
  }

  return result
}

function prepareLabels(
  items: LabelLayoutItem[],
  showItemId: boolean,
  showLabel: boolean
): PreparedLabel[] {
  const labels = items
    .map((item) => {
      const text = getSymbolLabelText(item, showItemId, showLabel)
      if (!text || item.symbolId === 'tekst') return null
      const size = estimateLabelSize(text, item.width)
      const defaultTop = item.y + item.height / 2 + 4 - PAD_Y
      const defaultCenterX = item.x
      return {
        item,
        text,
        size,
        defaultCenterX,
        defaultTop,
        defaultBox: candidateBox({ centerX: defaultCenterX, top: defaultTop }, size),
        density: 0
      }
    })
    .filter((label): label is PreparedLabel => label !== null)

  return labels
    .map((label) => ({
      ...label,
      density: labels.reduce((count, other) => {
        if (other.item.id === label.item.id) return count
        return overlapArea(expandBox(label.defaultBox, 10), expandBox(other.defaultBox, 10)) > 0
          ? count + 1
          : count
      }, 0)
    }))
    .sort((a, b) => b.density - a.density || a.item.y - b.item.y || a.item.x - b.item.x)
}

function estimateLabelSize(text: string, minWidth: number): LabelSize {
  const words = text.split(/\s+/).filter(Boolean)
  const longestWord = words.reduce((max, word) => Math.max(max, word.length), 0)
  const lineWidth = Math.max(minWidth, Math.ceil(longestWord * AVG_CHAR_WIDTH))
  const wrappedLines = text.split('\n').flatMap((line) => wrapLine(line, lineWidth))
  const maxLineWidth = wrappedLines.reduce(
    (max, line) => Math.max(max, Math.ceil(line.length * AVG_CHAR_WIDTH)),
    1
  )

  return {
    width: maxLineWidth + PAD_X * 2,
    height: Math.max(wrappedLines.length, 1) * FONT_SIZE * LINE_HEIGHT + PAD_Y * 2
  }
}

function wrapLine(line: string, maxWidth: number): string[] {
  const words = line.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']

  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length * AVG_CHAR_WIDTH <= maxWidth || current.length === 0) {
      current = next
    } else {
      lines.push(current)
      current = word
    }
  }

  if (current) lines.push(current)
  return lines
}

function buildCandidates(label: PreparedLabel): Candidate[] {
  const { item, size, defaultCenterX, defaultTop } = label
  const candidates: Candidate[] = []
  const xStep = Math.min(Math.max(size.width * 0.6, item.width + LABEL_GAP), 36)
  const yStep = size.height + LABEL_GAP
  const xOffsets = [0, -xStep, xStep]
  const yOffsets = [0, yStep, -yStep, yStep * 2, -yStep * 2]

  for (const yOffset of yOffsets) {
    for (const xOffset of xOffsets) {
      addCandidate(candidates, {
        centerX: defaultCenterX + xOffset,
        top: defaultTop + yOffset
      })
    }
  }

  const sideGap = 8
  const verticalOffsets = [0, -yStep, yStep, -yStep * 2, yStep * 2]
  for (const verticalOffset of verticalOffsets) {
    addCandidate(candidates, {
      centerX: item.x + item.width / 2 + sideGap + size.width / 2,
      top: item.y - size.height / 2 + verticalOffset
    })
    addCandidate(candidates, {
      centerX: item.x - item.width / 2 - sideGap - size.width / 2,
      top: item.y - size.height / 2 + verticalOffset
    })
  }

  return candidates.filter((candidate, index) => {
    if (index === 0) return true
    const dx = candidate.centerX - defaultCenterX
    const dy = candidate.top - defaultTop
    return Math.sqrt(dx * dx + dy * dy) <= MAX_LABEL_MOVE
  })
}

function canMoveLabel(label: PreparedLabel): boolean {
  return label.item.category === 'Schakelaars' || (!label.item.label && !label.item.location)
}

function getDisplayLines(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function addCandidate(candidates: Candidate[], candidate: Candidate): void {
  const exists = candidates.some(
    (existing) =>
      Math.abs(existing.centerX - candidate.centerX) < 0.5 &&
      Math.abs(existing.top - candidate.top) < 0.5
  )
  if (!exists) candidates.push(candidate)
}

function candidateBox(candidate: Candidate, size: LabelSize): Box {
  return {
    left: candidate.centerX - size.width / 2,
    top: candidate.top,
    right: candidate.centerX + size.width / 2,
    bottom: candidate.top + size.height
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

function overlapArea(a: Box, b: Box): number {
  const width = Math.min(a.right, b.right) - Math.max(a.left, b.left)
  const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
  if (width <= 0 || height <= 0) return 0
  return width * height
}
