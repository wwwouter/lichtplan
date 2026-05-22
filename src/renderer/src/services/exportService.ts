import Konva from 'konva'
import { jsPDF } from 'jspdf'
import { Project } from '../types/project'
import type { SymbolCategory, SymbolShape } from '../symbols'

type PdfDrawStyle = 'S' | 'F' | 'FD'
type TrianglePdf = jsPDF & {
  triangle?: (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    style?: PdfDrawStyle
  ) => unknown
}
type DashedPdf = jsPDF & {
  setLineDashPattern?: (dashArray: number[], dashPhase: number) => unknown
}

interface PdfPoint {
  x: number
  y: number
}

export const PDF_FLOOR_IMAGE_OPTIONS = {
  pixelRatio: 3,
  mimeType: 'image/jpeg' as const,
  quality: 0.94
}

export const PDF_PAPER_SIZES = {
  a4: { label: 'A4', widthMm: 210, heightMm: 297 },
  a3: { label: 'A3', widthMm: 297, heightMm: 420 },
  a2: { label: 'A2', widthMm: 420, heightMm: 594 },
  a1: { label: 'A1', widthMm: 594, heightMm: 841 }
} as const

export const PDF_DPI_OPTIONS = [150, 200, 300] as const

const PDF_PAGE_MARGIN_MM = 15
const PDF_HEADER_HEIGHT_MM = 20

export interface FloorPdfSnapshot {
  floorId: string
  floorName: string
  dataUrl: string
  width: number
  height: number
}

export type PdfPageOrientation = 'best-fit' | 'portrait' | 'landscape'
export type PdfPaperSize = keyof typeof PDF_PAPER_SIZES
export type PdfResolutionDpi = (typeof PDF_DPI_OPTIONS)[number]

export interface PdfLegendItem {
  symbolId: string
  name: string
  category: SymbolCategory
  color: string
  count: number
  icon: {
    width: number
    height: number
    shapes: SymbolShape[]
  }
}

export function exportStageToPNG(stage: Konva.Stage): string {
  return stage.toDataURL({ pixelRatio: 2 })
}

export function exportStageToPDFImage(
  stage: Konva.Stage,
  options: { pixelRatio?: number } = {}
): string {
  const sourceCanvas = stage.toCanvas({
    pixelRatio: options.pixelRatio ?? PDF_FLOOR_IMAGE_OPTIONS.pixelRatio
  })
  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = sourceCanvas.width
  outputCanvas.height = sourceCanvas.height

  const context = outputCanvas.getContext('2d')
  if (!context) {
    throw new Error('Kan PDF-afbeelding niet renderen.')
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, outputCanvas.width, outputCanvas.height)
  context.drawImage(sourceCanvas, 0, 0)

  return outputCanvas.toDataURL(PDF_FLOOR_IMAGE_OPTIONS.mimeType, PDF_FLOOR_IMAGE_OPTIONS.quality)
}

export function exportFloorToPDF(
  stage: Konva.Stage,
  project: Project,
  floorName: string
): ArrayBuffer {
  const dataUrl = exportStageToPDFImage(stage)
  const stageWidth = stage.width()
  const stageHeight = stage.height()

  const landscape = stageWidth > stageHeight
  const doc = new jsPDF({
    orientation: landscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const headerHeight = 20

  // Header
  doc.setFontSize(16)
  doc.text(project.name, margin, margin)
  doc.setFontSize(12)
  doc.text(floorName, margin, margin + 7)
  doc.setFontSize(8)
  doc.text(`Geëxporteerd: ${new Date().toLocaleDateString('nl-NL')}`, margin, margin + 13)

  // Calculate image dimensions to fit
  const availWidth = pageWidth - margin * 2
  const availHeight = pageHeight - margin * 2 - headerHeight
  const ratio = Math.min(availWidth / stageWidth, availHeight / stageHeight)
  const imgWidth = stageWidth * ratio
  const imgHeight = stageHeight * ratio

  doc.addImage(dataUrl, getImageFormat(dataUrl), margin, margin + headerHeight, imgWidth, imgHeight)

  return doc.output('arraybuffer')
}

export function exportFloorSnapshotsToPDF(
  snapshots: FloorPdfSnapshot[],
  project: Project,
  options: {
    includeLegend: boolean
    legendItems: PdfLegendItem[]
    pageOrientation?: PdfPageOrientation
    paperSize?: PdfPaperSize
  }
): ArrayBuffer {
  const first = snapshots[0]
  const paperSize = options.paperSize ?? 'a4'
  const doc = new jsPDF({
    orientation: resolvePdfPageOrientation(
      first?.width ?? 297,
      first?.height ?? 210,
      options.pageOrientation
    ),
    unit: 'mm',
    format: paperSize
  })

  snapshots.forEach((snapshot, index) => {
    if (index > 0) {
      doc.addPage(
        paperSize,
        resolvePdfPageOrientation(snapshot.width, snapshot.height, options.pageOrientation)
      )
    }
    addFloorPage(doc, snapshot, project, index + 1, snapshots.length)
  })

  if (options.includeLegend) {
    if (snapshots.length > 0) doc.addPage(paperSize, 'portrait')
    addLegendPage(doc, project, options.legendItems)
  }

  return doc.output('arraybuffer')
}

export function exportAllFloorsToPDF(
  stages: Map<string, Konva.Stage>,
  project: Project
): ArrayBuffer {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const headerHeight = 20

  project.floors.forEach((floor, index) => {
    if (index > 0) doc.addPage()

    const stage = stages.get(floor.id)
    if (!stage) return

    const dataUrl = exportStageToPDFImage(stage)
    const stageWidth = stage.width()
    const stageHeight = stage.height()

    doc.setFontSize(16)
    doc.text(project.name, margin, margin)
    doc.setFontSize(12)
    doc.text(floor.name, margin, margin + 7)
    doc.setFontSize(8)
    doc.text(
      `Pagina ${index + 1}/${project.floors.length} — ${new Date().toLocaleDateString('nl-NL')}`,
      margin,
      margin + 13
    )

    const availWidth = pageWidth - margin * 2
    const availHeight = pageHeight - margin * 2 - headerHeight
    const ratio = Math.min(availWidth / stageWidth, availHeight / stageHeight)
    const imgWidth = stageWidth * ratio
    const imgHeight = stageHeight * ratio

    doc.addImage(
      dataUrl,
      getImageFormat(dataUrl),
      margin,
      margin + headerHeight,
      imgWidth,
      imgHeight
    )
  })

  return doc.output('arraybuffer')
}

function addFloorPage(
  doc: jsPDF,
  snapshot: FloorPdfSnapshot,
  project: Project,
  page: number,
  totalPages: number
): void {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = PDF_PAGE_MARGIN_MM
  const headerHeight = PDF_HEADER_HEIGHT_MM

  doc.setFontSize(16)
  doc.text(project.name, margin, margin)
  doc.setFontSize(12)
  doc.text(snapshot.floorName, margin, margin + 7)
  doc.setFontSize(8)
  doc.text(
    `Pagina ${page}/${totalPages} - ${new Date().toLocaleDateString('nl-NL')}`,
    margin,
    margin + 13
  )

  const availWidth = pageWidth - margin * 2
  const availHeight = pageHeight - margin * 2 - headerHeight
  const ratio = Math.min(availWidth / snapshot.width, availHeight / snapshot.height)
  const imgWidth = snapshot.width * ratio
  const imgHeight = snapshot.height * ratio

  doc.addImage(
    snapshot.dataUrl,
    getImageFormat(snapshot.dataUrl),
    margin,
    margin + headerHeight,
    imgWidth,
    imgHeight
  )
}

function addLegendPage(doc: jsPDF, project: Project, legendItems: PdfLegendItem[]): void {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const countColumnX = Math.min(pageWidth - margin, margin + 95)
  let y = margin

  setTextColor(doc, '#000000')
  doc.setFontSize(16)
  doc.text(project.name, margin, y)
  y += 9
  setTextColor(doc, '#000000')
  doc.setFontSize(13)
  doc.text('Legenda', margin, y)
  y += 10

  if (legendItems.length === 0) {
    setTextColor(doc, '#000000')
    doc.setFontSize(10)
    doc.text('Geen zichtbare symbolen in de geselecteerde verdiepingen.', margin, y)
    return
  }

  let currentCategory = ''
  legendItems.forEach((item) => {
    if (y > pageHeight - margin) {
      doc.addPage('a4', 'portrait')
      y = margin
    }

    if (item.category !== currentCategory) {
      currentCategory = item.category
      setTextColor(doc, '#000000')
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(currentCategory, margin, y)
      doc.setFont('helvetica', 'normal')
      y += 7
    }

    drawLegendIcon(doc, item, margin, y - 4.8, 6)
    setTextColor(doc, '#000000')
    doc.setFontSize(10)
    doc.text(item.name, margin + 10, y)
    doc.text(`${item.count}x`, countColumnX, y, { align: 'right' })
    y += 6
  })
}

function getOrientation(width: number, height: number): 'landscape' | 'portrait' {
  return width > height ? 'landscape' : 'portrait'
}

export function resolvePdfPageOrientation(
  width: number,
  height: number,
  pageOrientation: PdfPageOrientation = 'best-fit'
): 'landscape' | 'portrait' {
  if (pageOrientation === 'portrait' || pageOrientation === 'landscape') return pageOrientation
  return getOrientation(width, height)
}

export function getPdfPageDimensionsMm(
  paperSize: PdfPaperSize,
  orientation: 'landscape' | 'portrait'
): { width: number; height: number } {
  const page = PDF_PAPER_SIZES[paperSize]
  if (orientation === 'landscape') {
    return { width: page.heightMm, height: page.widthMm }
  }
  return { width: page.widthMm, height: page.heightMm }
}

export function getPdfContentDimensionsMm(
  paperSize: PdfPaperSize,
  orientation: 'landscape' | 'portrait'
): { width: number; height: number } {
  const page = getPdfPageDimensionsMm(paperSize, orientation)
  return {
    width: Math.max(1, page.width - PDF_PAGE_MARGIN_MM * 2),
    height: Math.max(1, page.height - PDF_PAGE_MARGIN_MM * 2 - PDF_HEADER_HEIGHT_MM)
  }
}

export function getPdfRenderSize(
  paperSize: PdfPaperSize,
  orientation: 'landscape' | 'portrait',
  dpi: PdfResolutionDpi
): { width: number; height: number } {
  const content = getPdfContentDimensionsMm(paperSize, orientation)
  return {
    width: mmToPixels(content.width, dpi),
    height: mmToPixels(content.height, dpi)
  }
}

function mmToPixels(mm: number, dpi: number): number {
  return Math.max(1, Math.round((mm / 25.4) * dpi))
}

function getImageFormat(dataUrl: string): 'JPEG' | 'PNG' {
  return dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')
    ? 'JPEG'
    : 'PNG'
}

function drawLegendIcon(doc: jsPDF, item: PdfLegendItem, x: number, y: number, size: number): void {
  const scale = size / Math.max(item.icon.width, item.icon.height)
  const iconWidth = item.icon.width * scale
  const iconHeight = item.icon.height * scale
  const offsetX = x + (size - iconWidth) / 2
  const offsetY = y + (size - iconHeight) / 2

  item.icon.shapes.forEach((shape) => {
    drawSymbolShape(doc, shape, item.color, offsetX, offsetY, scale)
  })
}

function drawSymbolShape(
  doc: jsPDF,
  shape: SymbolShape,
  color: string,
  offsetX: number,
  offsetY: number,
  scale: number
): void {
  switch (shape.type) {
    case 'circle':
      setShapeColors(doc, shape.stroke, shape.fill, color)
      doc.circle(
        offsetX + shape.x * scale,
        offsetY + shape.y * scale,
        shape.radius * scale,
        getDrawStyle(shape.stroke, shape.fill)
      )
      return
    case 'line':
      drawLineShape(doc, shape, color, offsetX, offsetY, scale)
      return
    case 'rect':
      setShapeColors(doc, shape.stroke, shape.fill, color)
      doc.rect(
        offsetX + shape.x * scale,
        offsetY + shape.y * scale,
        shape.width * scale,
        shape.height * scale,
        getDrawStyle(shape.stroke, shape.fill)
      )
      return
    case 'text':
      setTextColor(doc, shape.fill ?? color)
      doc.setFont('helvetica', shape.fontStyle ?? 'normal')
      doc.setFontSize(shape.fontSize * scale * 2.8)
      doc.text(shape.text, offsetX + shape.x * scale, offsetY + (shape.y + shape.fontSize) * scale)
      doc.setFont('helvetica', 'normal')
      return
    case 'arc':
      drawArc(doc, shape, color, offsetX, offsetY, scale)
      return
    case 'path':
      setStroke(doc, shape.stroke ?? color, shape.strokeWidth, scale)
      drawSimplePath(doc, shape.data, offsetX, offsetY, scale)
      return
  }
}

function drawLineShape(
  doc: jsPDF,
  shape: Extract<SymbolShape, { type: 'line' }>,
  color: string,
  offsetX: number,
  offsetY: number,
  scale: number
): void {
  const points = toPdfPoints(shape.points, offsetX, offsetY, scale)
  const effectiveStroke = shape.stroke ?? color
  setStroke(doc, effectiveStroke, shape.strokeWidth, scale)
  if (shape.fill) setFill(doc, shape.fill)

  if (shape.closed && points.length === 3) {
    drawTriangle(doc, points[0], points[1], points[2], shape.fill ? 'FD' : 'S')
    return
  }

  setLineDash(doc, shape.dash, scale)
  for (let index = 0; index < points.length - 1; index += 1) {
    drawLineBetween(doc, points[index], points[index + 1])
  }
  if (shape.closed && points.length >= 2) {
    drawLineBetween(doc, points[points.length - 1], points[0])
  }
  setLineDash(doc, undefined, scale)
}

function drawArc(
  doc: jsPDF,
  shape: Extract<SymbolShape, { type: 'arc' }>,
  color: string,
  offsetX: number,
  offsetY: number,
  scale: number
): void {
  const centerX = offsetX + shape.x * scale
  const centerY = offsetY + shape.y * scale
  const outerRadius = shape.outerRadius * scale
  const innerRadius = shape.innerRadius * scale
  const start = ((shape.rotation ?? 0) * Math.PI) / 180
  const end = start + (shape.angle * Math.PI) / 180
  const segments = 14

  if (shape.fill) {
    setFill(doc, shape.fill)
    drawArcFill(doc, { x: centerX, y: centerY }, innerRadius, outerRadius, start, end, segments)
  }

  if ((shape.strokeWidth ?? 0) > 0) {
    setStroke(doc, shape.stroke ?? color, shape.strokeWidth, scale)
    const outerPoints = getArcPoints({ x: centerX, y: centerY }, outerRadius, start, end, segments)
    drawPolyline(doc, outerPoints)

    if (innerRadius > 0) {
      const innerPoints = getArcPoints({ x: centerX, y: centerY }, innerRadius, start, end, segments)
      drawPolyline(doc, innerPoints)
      drawLineBetween(doc, outerPoints[0], innerPoints[0])
      drawLineBetween(doc, outerPoints[outerPoints.length - 1], innerPoints[innerPoints.length - 1])
    }
  }
}

function drawSimplePath(
  doc: jsPDF,
  data: string,
  offsetX: number,
  offsetY: number,
  scale: number
): void {
  const arcPath = parseArcPath(data)
  if (arcPath) {
    const start = { x: offsetX + arcPath.start.x * scale, y: offsetY + arcPath.start.y * scale }
    const end = { x: offsetX + arcPath.end.x * scale, y: offsetY + arcPath.end.y * scale }
    drawSvgArc(
      doc,
      start,
      end,
      arcPath.rx * scale,
      arcPath.ry * scale,
      arcPath.largeArc,
      arcPath.sweep
    )
    return
  }

  const numbers = data.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? []
  if (numbers.length < 4) return
  doc.line(
    offsetX + numbers[0] * scale,
    offsetY + numbers[1] * scale,
    offsetX + numbers[numbers.length - 2] * scale,
    offsetY + numbers[numbers.length - 1] * scale
  )
}

function drawArcFill(
  doc: jsPDF,
  center: PdfPoint,
  innerRadius: number,
  outerRadius: number,
  start: number,
  end: number,
  segments: number
): void {
  const outerPoints = getArcPoints(center, outerRadius, start, end, segments)

  if (innerRadius <= 0) {
    for (let index = 0; index < outerPoints.length - 1; index += 1) {
      drawTriangle(doc, center, outerPoints[index], outerPoints[index + 1], 'F')
    }
    return
  }

  const innerPoints = getArcPoints(center, innerRadius, start, end, segments)
  for (let index = 0; index < outerPoints.length - 1; index += 1) {
    drawTriangle(doc, outerPoints[index], outerPoints[index + 1], innerPoints[index + 1], 'F')
    drawTriangle(doc, outerPoints[index], innerPoints[index + 1], innerPoints[index], 'F')
  }
}

function getArcPoints(
  center: PdfPoint,
  radius: number,
  start: number,
  end: number,
  segments: number
): PdfPoint[] {
  return Array.from({ length: segments + 1 }, (_, index) => {
    const angle = start + ((end - start) * index) / segments
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    }
  })
}

function drawSvgArc(
  doc: jsPDF,
  startPoint: PdfPoint,
  endPoint: PdfPoint,
  rx: number,
  ry: number,
  largeArc: boolean,
  sweep: boolean
): void {
  const dx = (startPoint.x - endPoint.x) / 2
  const dy = (startPoint.y - endPoint.y) / 2
  const radiusX = Math.max(rx, Math.abs(dx))
  const radiusY = Math.max(ry, Math.abs(dy))
  const sign = largeArc === sweep ? -1 : 1
  const radiusXSquared = radiusX * radiusX
  const radiusYSquared = radiusY * radiusY
  const numerator =
    radiusXSquared * radiusYSquared -
    radiusXSquared * dy * dy -
    radiusYSquared * dx * dx
  const denominator = radiusXSquared * dy * dy + radiusYSquared * dx * dx
  const coefficient = denominator === 0 ? 0 : sign * Math.sqrt(Math.max(0, numerator / denominator))
  const center = {
    x: (startPoint.x + endPoint.x) / 2 + (coefficient * radiusX * dy) / radiusY,
    y: (startPoint.y + endPoint.y) / 2 - (coefficient * radiusY * dx) / radiusX
  }
  const startAngle = Math.atan2((startPoint.y - center.y) / radiusY, (startPoint.x - center.x) / radiusX)
  let endAngle = Math.atan2((endPoint.y - center.y) / radiusY, (endPoint.x - center.x) / radiusX)

  if (sweep && endAngle < startAngle) endAngle += Math.PI * 2
  if (!sweep && endAngle > startAngle) endAngle -= Math.PI * 2

  const segments = 14
  const points = Array.from({ length: segments + 1 }, (_, index) => {
    const angle = startAngle + ((endAngle - startAngle) * index) / segments
    return {
      x: center.x + Math.cos(angle) * radiusX,
      y: center.y + Math.sin(angle) * radiusY
    }
  })
  drawPolyline(doc, points)
}

function parseArcPath(data: string):
  | {
      start: PdfPoint
      end: PdfPoint
      rx: number
      ry: number
      largeArc: boolean
      sweep: boolean
    }
  | null {
  const arcMatch =
    /M\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+A\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+([01])\s+([01])\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/i.exec(
      data
    )
  if (!arcMatch) return null

  return {
    start: { x: Number(arcMatch[1]), y: Number(arcMatch[2]) },
    end: { x: Number(arcMatch[8]), y: Number(arcMatch[9]) },
    rx: Number(arcMatch[3]),
    ry: Number(arcMatch[4]),
    largeArc: arcMatch[6] === '1',
    sweep: arcMatch[7] === '1'
  }
}

function drawPolyline(doc: jsPDF, points: PdfPoint[]): void {
  for (let index = 0; index < points.length - 1; index += 1) {
    drawLineBetween(doc, points[index], points[index + 1])
  }
}

function drawLineBetween(doc: jsPDF, start: PdfPoint, end: PdfPoint): void {
  doc.line(start.x, start.y, end.x, end.y)
}

function drawTriangle(
  doc: jsPDF,
  first: PdfPoint,
  second: PdfPoint,
  third: PdfPoint,
  style: PdfDrawStyle
): void {
  const triangle = (doc as TrianglePdf).triangle
  if (triangle) {
    triangle.call(doc, first.x, first.y, second.x, second.y, third.x, third.y, style)
    return
  }

  drawLineBetween(doc, first, second)
  drawLineBetween(doc, second, third)
  drawLineBetween(doc, third, first)
}

function toPdfPoints(points: number[], offsetX: number, offsetY: number, scale: number): PdfPoint[] {
  const pdfPoints: PdfPoint[] = []
  for (let index = 0; index < points.length - 1; index += 2) {
    pdfPoints.push({
      x: offsetX + points[index] * scale,
      y: offsetY + points[index + 1] * scale
    })
  }
  return pdfPoints
}

function setShapeColors(
  doc: jsPDF,
  stroke: string | undefined,
  fill: string | undefined,
  fallback: string
): void {
  setStroke(doc, stroke ?? fallback)
  if (fill) setFill(doc, fill)
}

function setStroke(doc: jsPDF, color: string, strokeWidth = 2, scale = 1): void {
  const [r, g, b] = hexToRgb(color)
  doc.setDrawColor(r, g, b)
  doc.setLineWidth(Math.max(0.25, strokeWidth * scale * 0.45))
}

function setLineDash(doc: jsPDF, dash: number[] | undefined, scale: number): void {
  const setLineDashPattern = (doc as DashedPdf).setLineDashPattern
  if (!setLineDashPattern) return
  setLineDashPattern.call(doc, dash ? dash.map((value) => value * scale) : [], 0)
}

function setFill(doc: jsPDF, color: string): void {
  const [r, g, b] = hexToRgb(color)
  doc.setFillColor(r, g, b)
}

function setTextColor(doc: jsPDF, color: string): void {
  const [r, g, b] = hexToRgb(color)
  doc.setTextColor(r, g, b)
}

function getDrawStyle(stroke: string | undefined, fill: string | undefined): PdfDrawStyle {
  if (stroke && fill) return 'FD'
  if (fill) return 'F'
  return 'S'
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '')
  const value = parseInt(normalized, 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}
