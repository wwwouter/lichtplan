import type { DiagramLine, PlacedSymbol } from '../types/project'

export const DIAGRAM_LINE_SYMBOL_ID = 'lijn'
export const DEFAULT_DIAGRAM_LINE: DiagramLine = {
  endX: 120,
  endY: 0,
  type: 'straight'
}

export interface DiagramLinePoint {
  x: number
  y: number
}

export interface DiagramLineBounds {
  x: number
  y: number
  width: number
  height: number
}

export function getDiagramLine(symbol: Pick<PlacedSymbol, 'diagramLine'>): DiagramLine {
  return symbol.diagramLine ?? DEFAULT_DIAGRAM_LINE
}

export function createDiagramLineSymbol(
  id: string,
  start: DiagramLinePoint,
  end: DiagramLinePoint
): PlacedSymbol {
  return {
    id,
    symbolId: DIAGRAM_LINE_SYMBOL_ID,
    x: start.x,
    y: start.y,
    rotation: 0,
    diagramLine: {
      endX: end.x - start.x,
      endY: end.y - start.y,
      type: DEFAULT_DIAGRAM_LINE.type
    }
  }
}

export function getDiagramLineDash(line: Pick<DiagramLine, 'type'>): number[] | undefined {
  return line.type === 'dotted' ? [4, 5] : undefined
}

export function getDiagramLineMidpoint(line: Pick<DiagramLine, 'endX' | 'endY'>): DiagramLinePoint {
  return {
    x: line.endX / 2,
    y: line.endY / 2
  }
}

export function getDiagramLineBounds(
  line: Pick<DiagramLine, 'endX' | 'endY'>,
  padding = 10
): DiagramLineBounds {
  const minX = Math.min(0, line.endX)
  const minY = Math.min(0, line.endY)
  const maxX = Math.max(0, line.endX)
  const maxY = Math.max(0, line.endY)

  return {
    x: minX - padding,
    y: minY - padding,
    width: Math.max(maxX - minX + padding * 2, padding * 2),
    height: Math.max(maxY - minY + padding * 2, padding * 2)
  }
}

export function moveDiagramLineStart(
  symbol: Pick<PlacedSymbol, 'x' | 'y'>,
  line: DiagramLine,
  point: DiagramLinePoint
): Pick<PlacedSymbol, 'x' | 'y' | 'diagramLine'> {
  return {
    x: symbol.x + point.x,
    y: symbol.y + point.y,
    diagramLine: {
      ...line,
      endX: line.endX - point.x,
      endY: line.endY - point.y
    }
  }
}

export function moveDiagramLineEnd(
  line: DiagramLine,
  point: DiagramLinePoint
): Pick<PlacedSymbol, 'diagramLine'> {
  return {
    diagramLine: {
      ...line,
      endX: point.x,
      endY: point.y
    }
  }
}
