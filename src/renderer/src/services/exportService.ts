import Konva from 'konva'
import { jsPDF } from 'jspdf'
import { Project } from '../types/project'

export function exportStageToPNG(stage: Konva.Stage): string {
  return stage.toDataURL({ pixelRatio: 2 })
}

export function exportFloorToPDF(
  stage: Konva.Stage,
  project: Project,
  floorName: string
): ArrayBuffer {
  const dataUrl = stage.toDataURL({ pixelRatio: 2 })
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

  doc.addImage(dataUrl, 'PNG', margin, margin + headerHeight, imgWidth, imgHeight)

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

    const dataUrl = stage.toDataURL({ pixelRatio: 2 })
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

    doc.addImage(dataUrl, 'PNG', margin, margin + headerHeight, imgWidth, imgHeight)
  })

  return doc.output('arraybuffer')
}
