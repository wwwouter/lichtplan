import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Project } from '../types/project'
import { SymbolCategory, type SymbolShape } from '../symbols'
import { exportFloorSnapshotsToPDF, type PdfLegendItem } from '../services/exportService'

const { pdfInstances, jsPDFMock } = vi.hoisted(() => {
  interface ImageCall {
    args: unknown[]
  }

  class MockPDF {
    images: ImageCall[] = []
    circles: unknown[][] = []
    lines: unknown[][] = []
    rects: unknown[][] = []
    texts: Array<{ args: unknown[]; color: unknown[] }> = []
    textColor: unknown[] = [0, 0, 0]
    pages: unknown[][] = []
    internal = {
      pageSize: {
        getWidth: () => 297,
        getHeight: () => 210
      }
    }

    addImage(...args: unknown[]) {
      this.images.push({ args })
    }

    addPage(...args: unknown[]) {
      this.pages.push(args)
    }

    circle(...args: unknown[]) {
      this.circles.push(args)
    }

    line(...args: unknown[]) {
      this.lines.push(args)
    }

    rect(...args: unknown[]) {
      this.rects.push(args)
    }

    text(...args: unknown[]) {
      this.texts.push({ args, color: this.textColor })
    }

    setFontSize() {}
    setFont() {}
    setFillColor() {}
    setDrawColor() {}
    setLineWidth() {}
    setTextColor(...args: unknown[]) {
      this.textColor = args
    }

    output() {
      return new ArrayBuffer(8)
    }
  }

  const pdfInstances: MockPDF[] = []
  const jsPDFMock = vi.fn(function () {
    const instance = new MockPDF()
    pdfInstances.push(instance)
    return instance
  })

  return { pdfInstances, jsPDFMock }
})

vi.mock('jspdf', () => ({
  jsPDF: jsPDFMock
}))

const project: Project = {
  id: 'project-1',
  name: 'Lichtplan',
  createdAt: '2026-05-04T00:00:00.000Z',
  updatedAt: '2026-05-04T00:00:00.000Z',
  floors: [
    {
      id: 'floor-1',
      name: 'Begane grond',
      floorPlanImage: null,
      order: 0,
      symbols: []
    }
  ]
}

describe('PDF export', () => {
  beforeEach(() => {
    pdfInstances.length = 0
    jsPDFMock.mockClear()
  })

  it('embeds compact JPEG floor snapshots as JPEG instead of inflating them as PNG', () => {
    exportFloorSnapshotsToPDF(
      [
        {
          floorId: 'floor-1',
          floorName: 'Begane grond',
          dataUrl: 'data:image/jpeg;base64,compact-floor-image',
          width: 1200,
          height: 800
        }
      ],
      project,
      { includeLegend: false, legendItems: [] }
    )

    expect(pdfInstances[0].images[0].args[1]).toBe('JPEG')
  })

  it('draws the real symbol icon in the legend instead of a generic colored circle', () => {
    const switchShapes: SymbolShape[] = [
      { type: 'circle', x: 5, y: 21, radius: 4, fill: '#EF4444' },
      { type: 'line', points: [7, 19, 22, 4], stroke: '#EF4444', strokeWidth: 2 }
    ]
    const legendItem: PdfLegendItem = {
      symbolId: 'enkelpolige-schakelaar',
      name: 'Enkelpolige schakelaar',
      category: SymbolCategory.Schakelaars,
      color: '#EF4444',
      count: 2,
      icon: {
        width: 26,
        height: 26,
        shapes: switchShapes
      }
    }

    exportFloorSnapshotsToPDF([], project, { includeLegend: true, legendItems: [legendItem] })

    expect(pdfInstances[0].lines.length).toBeGreaterThan(0)
  })

  it('resets legend labels to black after drawing colored symbol text', () => {
    const legendItem: PdfLegendItem = {
      symbolId: 'dimmer',
      name: 'Dimmer',
      category: SymbolCategory.Schakelaars,
      color: '#EF4444',
      count: 3,
      icon: {
        width: 26,
        height: 26,
        shapes: [
          { type: 'circle', x: 5, y: 21, radius: 4, fill: '#EF4444' },
          { type: 'line', points: [7, 19, 22, 4], stroke: '#EF4444', strokeWidth: 2 },
          { type: 'text', x: 18, y: 8, text: 'D', fontSize: 12, fill: '#EF4444' }
        ]
      }
    }

    exportFloorSnapshotsToPDF([], project, { includeLegend: true, legendItems: [legendItem] })

    const label = pdfInstances[0].texts.find((entry) => entry.args[0] === 'Dimmer')
    const count = pdfInstances[0].texts.find((entry) => entry.args[0] === '3x')

    expect(label?.color).toEqual([0, 0, 0])
    expect(count?.color).toEqual([0, 0, 0])
  })
})
