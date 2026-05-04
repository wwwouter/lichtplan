import Konva from 'konva'
import { jsPDF } from 'jspdf'
import { Project } from '../types/project'
import type { SymbolShape } from '../symbols'

export const PDF_FLOOR_IMAGE_OPTIONS = {
  pixelRatio: 1,
  mimeType: 'image/jpeg' as const,
  quality: 0.82
}

export interface FloorPdfSnapshot {
  floorId: string
  floorName: string
  dataUrl: string
  width: number
  height: number
}

export interface PdfLegendItem {
  symbolId: string
  name: string
  category: string
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

export function exportStageToPDFImage(stage: Konva.Stage): string {
  return stage.toDataURL(PDF_FLOOR_IMAGE_OPTIONS)
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
  options: { includeLegend: boolean; legendItems: PdfLegendItem[] }
): ArrayBuffer {
  const first = snapshots[0]
  const doc = new jsPDF({
    orientation: getOrientation(first?.width ?? 297, first?.height ?? 210),
    unit: 'mm',
    format: 'a4'
  })

  snapshots.forEach((snapshot, index) => {
    if (index > 0) {
      doc.addPage('a4', getOrientation(snapshot.width, snapshot.height))
    }
    addFloorPage(doc, snapshot, project, index + 1, snapshots.length)
  })

  if (options.includeLegend) {
    if (snapshots.length > 0) doc.addPage('a4', 'portrait')
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
  const margin = 15
  const headerHeight = 20

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
    doc.text(`${item.count}x`, pageWidth - margin, y, { align: 'right' })
    y += 6
  })
}

function getOrientation(width: number, height: number): 'landscape' | 'portrait' {
  return width > height ? 'landscape' : 'portrait'
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
      setStroke(doc, shape.stroke ?? color, shape.strokeWidth, scale)
      for (let index = 0; index < shape.points.length - 2; index += 2) {
        doc.line(
          offsetX + shape.points[index] * scale,
          offsetY + shape.points[index + 1] * scale,
          offsetX + shape.points[index + 2] * scale,
          offsetY + shape.points[index + 3] * scale
        )
      }
      if (shape.closed && shape.points.length >= 4) {
        doc.line(
          offsetX + shape.points[shape.points.length - 2] * scale,
          offsetY + shape.points[shape.points.length - 1] * scale,
          offsetX + shape.points[0] * scale,
          offsetY + shape.points[1] * scale
        )
      }
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
      doc.setFontSize(shape.fontSize * scale * 2.8)
      doc.text(shape.text, offsetX + shape.x * scale, offsetY + (shape.y + shape.fontSize) * scale)
      return
    case 'arc':
      setStroke(doc, shape.stroke ?? shape.fill ?? color, shape.strokeWidth, scale)
      drawArc(doc, shape, offsetX, offsetY, scale)
      return
    case 'path':
      setStroke(doc, shape.stroke ?? color, shape.strokeWidth, scale)
      drawSimplePath(doc, shape.data, offsetX, offsetY, scale)
      return
  }
}

function drawArc(
  doc: jsPDF,
  shape: Extract<SymbolShape, { type: 'arc' }>,
  offsetX: number,
  offsetY: number,
  scale: number
): void {
  const centerX = offsetX + shape.x * scale
  const centerY = offsetY + shape.y * scale
  const radius = shape.outerRadius * scale
  const start = ((shape.rotation ?? 0) * Math.PI) / 180
  const end = start + (shape.angle * Math.PI) / 180
  const segments = 14

  let prevX = centerX + Math.cos(start) * radius
  let prevY = centerY + Math.sin(start) * radius
  for (let i = 1; i <= segments; i += 1) {
    const angle = start + ((end - start) * i) / segments
    const nextX = centerX + Math.cos(angle) * radius
    const nextY = centerY + Math.sin(angle) * radius
    doc.line(prevX, prevY, nextX, nextY)
    prevX = nextX
    prevY = nextY
  }
}

function drawSimplePath(
  doc: jsPDF,
  data: string,
  offsetX: number,
  offsetY: number,
  scale: number
): void {
  const numbers = data.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? []
  if (numbers.length < 4) return
  doc.line(
    offsetX + numbers[0] * scale,
    offsetY + numbers[1] * scale,
    offsetX + numbers[numbers.length - 2] * scale,
    offsetY + numbers[numbers.length - 1] * scale
  )
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

function setFill(doc: jsPDF, color: string): void {
  const [r, g, b] = hexToRgb(color)
  doc.setFillColor(r, g, b)
}

function setTextColor(doc: jsPDF, color: string): void {
  const [r, g, b] = hexToRgb(color)
  doc.setTextColor(r, g, b)
}

function getDrawStyle(stroke: string | undefined, fill: string | undefined): 'S' | 'F' | 'FD' {
  if (stroke && fill) return 'FD'
  if (fill) return 'F'
  return 'S'
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '')
  const value = parseInt(normalized, 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}
