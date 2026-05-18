import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type Konva from 'konva'
import type { Project } from '../types/project'
import { SymbolCategory, type SymbolShape } from '../symbols'
import {
  exportFloorSnapshotsToPDF,
  exportStageToPDFImage,
  getPdfRenderSize,
  PDF_FLOOR_IMAGE_OPTIONS,
  resolvePdfPageOrientation,
  type PdfLegendItem
} from '../services/exportService'

const { pdfInstances, jsPDFMock } = vi.hoisted(() => {
  interface ImageCall {
    args: unknown[]
  }

  class MockPDF {
    images: ImageCall[] = []
    circles: unknown[][] = []
    lines: unknown[][] = []
    rects: unknown[][] = []
    triangles: unknown[][] = []
    lineDashPatterns: unknown[][] = []
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

    triangle(...args: unknown[]) {
      this.triangles.push(args)
    }

    text(...args: unknown[]) {
      this.texts.push({ args, color: this.textColor })
    }

    setFontSize(..._args: unknown[]) {
      return this
    }

    setFont(..._args: unknown[]) {
      return this
    }

    setFillColor(..._args: unknown[]) {
      return this
    }

    setDrawColor(..._args: unknown[]) {
      return this
    }

    setLineWidth(..._args: unknown[]) {
      return this
    }

    setLineDashPattern(...args: unknown[]) {
      this.lineDashPatterns.push(args)
      return this
    }

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

  afterEach(() => {
    vi.restoreAllMocks()
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

  it('uses the selected fixed page orientation for floor pages', () => {
    exportFloorSnapshotsToPDF(
      [
        {
          floorId: 'floor-1',
          floorName: 'Staande plattegrond',
          dataUrl: 'data:image/jpeg;base64,first-floor-image',
          width: 800,
          height: 1200
        },
        {
          floorId: 'floor-2',
          floorName: 'Liggende plattegrond',
          dataUrl: 'data:image/jpeg;base64,second-floor-image',
          width: 1200,
          height: 800
        }
      ],
      project,
      { includeLegend: false, legendItems: [], pageOrientation: 'landscape' }
    )

    expect(jsPDFMock).toHaveBeenCalledWith(
      expect.objectContaining({ orientation: 'landscape' })
    )
    expect(pdfInstances[0].pages[0]).toEqual(['a4', 'landscape'])
  })

  it('uses best-fit page orientation from each floor snapshot by default', () => {
    exportFloorSnapshotsToPDF(
      [
        {
          floorId: 'floor-1',
          floorName: 'Staande plattegrond',
          dataUrl: 'data:image/jpeg;base64,first-floor-image',
          width: 800,
          height: 1200
        },
        {
          floorId: 'floor-2',
          floorName: 'Liggende plattegrond',
          dataUrl: 'data:image/jpeg;base64,second-floor-image',
          width: 1200,
          height: 800
        }
      ],
      project,
      { includeLegend: false, legendItems: [] }
    )

    expect(jsPDFMock).toHaveBeenCalledWith(expect.objectContaining({ orientation: 'portrait' }))
    expect(pdfInstances[0].pages[0]).toEqual(['a4', 'landscape'])
  })

  it('uses the selected paper size for the document and additional floor pages', () => {
    exportFloorSnapshotsToPDF(
      [
        {
          floorId: 'floor-1',
          floorName: 'Begane grond',
          dataUrl: 'data:image/jpeg;base64,first-floor-image',
          width: 1600,
          height: 1000
        },
        {
          floorId: 'floor-2',
          floorName: '1e Verdieping',
          dataUrl: 'data:image/jpeg;base64,second-floor-image',
          width: 1600,
          height: 1000
        }
      ],
      project,
      { includeLegend: false, legendItems: [], paperSize: 'a1', pageOrientation: 'landscape' }
    )

    expect(jsPDFMock).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'a1', orientation: 'landscape' })
    )
    expect(pdfInstances[0].pages[0]).toEqual(['a1', 'landscape'])
  })

  it('calculates print render pixels from paper size, orientation and DPI', () => {
    expect(resolvePdfPageOrientation(800, 1200, 'best-fit')).toBe('portrait')
    expect(resolvePdfPageOrientation(1200, 800, 'best-fit')).toBe('landscape')
    expect(getPdfRenderSize('a2', 'landscape', 200)).toEqual({
      width: 4441,
      height: 2913
    })
    expect(getPdfRenderSize('a1', 'portrait', 300)).toEqual({
      width: 6661,
      height: 9343
    })
  })

  it('exports floor snapshots on a white background at print-friendly resolution and JPEG quality', () => {
    const sourceCanvas = document.createElement('canvas')
    sourceCanvas.width = 120
    sourceCanvas.height = 80
    const fillRect = vi.fn()
    const drawImage = vi.fn()
    let fillStyle = ''
    const context = {
      get fillStyle() {
        return fillStyle
      },
      set fillStyle(value: string) {
        fillStyle = value
      },
      fillRect,
      drawImage
    } as unknown as CanvasRenderingContext2D
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
    const toDataURL = vi
      .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
      .mockReturnValue('data:image/jpeg;base64,sharp-floor-image')
    const stage = {
      toCanvas: vi.fn().mockReturnValue(sourceCanvas)
    } as unknown as Konva.Stage

    const dataUrl = exportStageToPDFImage(stage)

    expect(dataUrl).toBe('data:image/jpeg;base64,sharp-floor-image')
    expect(stage.toCanvas).toHaveBeenCalledWith({ pixelRatio: PDF_FLOOR_IMAGE_OPTIONS.pixelRatio })
    expect(getContext).toHaveBeenCalledWith('2d')
    expect(fillStyle).toBe('#ffffff')
    expect(fillRect).toHaveBeenCalledWith(0, 0, sourceCanvas.width, sourceCanvas.height)
    expect(drawImage).toHaveBeenCalledWith(sourceCanvas, 0, 0)
    expect(toDataURL).toHaveBeenCalledWith('image/jpeg', 0.94)
    expect(PDF_FLOOR_IMAGE_OPTIONS).toEqual({
      pixelRatio: 3,
      mimeType: 'image/jpeg',
      quality: 0.94
    })
  })

  it('allows print snapshots to use a pre-sized stage without another pixel multiplier', () => {
    const sourceCanvas = document.createElement('canvas')
    sourceCanvas.width = 300
    sourceCanvas.height = 200
    const context = {
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn()
    } as unknown as CanvasRenderingContext2D
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,print')
    const stage = {
      toCanvas: vi.fn().mockReturnValue(sourceCanvas)
    } as unknown as Konva.Stage

    exportStageToPDFImage(stage, { pixelRatio: 1 })

    expect(stage.toCanvas).toHaveBeenCalledWith({ pixelRatio: 1 })
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

  it('fills arc-based legend icons instead of reducing them to an outline', () => {
    const legendItem: PdfLegendItem = {
      symbolId: 'wandlamp',
      name: 'Wandlamp',
      category: SymbolCategory.Verlichting,
      color: '#F59E0B',
      count: 1,
      icon: {
        width: 30,
        height: 24,
        shapes: [
          {
            type: 'arc',
            x: 15,
            y: 20,
            innerRadius: 0,
            outerRadius: 12,
            angle: 180,
            rotation: -180,
            fill: '#F59E0B'
          }
        ]
      }
    }

    exportFloorSnapshotsToPDF([], project, { includeLegend: true, legendItems: [legendItem] })

    expect(pdfInstances[0].triangles.length).toBeGreaterThan(0)
    expect(pdfInstances[0].lines.length).toBe(0)
  })

  it('fills closed polygon legend icons so network contactdozen stay readable', () => {
    const legendItem: PdfLegendItem = {
      symbolId: 'cat6a-contactdoos',
      name: 'Cat6a contactdoos',
      category: SymbolCategory.Elektra,
      color: '#3B82F6',
      count: 1,
      icon: {
        width: 26,
        height: 24,
        shapes: [
          {
            type: 'line',
            points: [1, 24, 25, 24, 13, 2],
            stroke: '#3B82F6',
            strokeWidth: 2,
            closed: true,
            fill: '#ffffff'
          }
        ]
      }
    }

    exportFloorSnapshotsToPDF([], project, { includeLegend: true, legendItems: [legendItem] })

    expect(pdfInstances[0].triangles.at(-1)?.at(-1)).toBe('FD')
  })

  it('preserves dashed line styling for LED strip legend icons', () => {
    const legendItem: PdfLegendItem = {
      symbolId: 'led-strip',
      name: 'LED strip',
      category: SymbolCategory.Verlichting,
      color: '#F59E0B',
      count: 1,
      icon: {
        width: 40,
        height: 10,
        shapes: [{ type: 'line', points: [2, 5, 38, 5], stroke: '#F59E0B', strokeWidth: 3, dash: [4, 3] }]
      }
    }

    exportFloorSnapshotsToPDF([], project, { includeLegend: true, legendItems: [legendItem] })

    const [dashPattern, dashPhase] = pdfInstances[0].lineDashPatterns[0] as [number[], number]
    expect(dashPattern[0]).toBeCloseTo(0.6)
    expect(dashPattern[1]).toBeCloseTo(0.45)
    expect(dashPhase).toBe(0)
    expect(pdfInstances[0].lineDashPatterns.at(-1)).toEqual([[], 0])
  })

  it('draws SVG arc path legend icons as curved paths', () => {
    const legendItem: PdfLegendItem = {
      symbolId: 'bewegingssensor',
      name: 'Bewegingssensor',
      category: SymbolCategory.Overig,
      color: '#8B5CF6',
      count: 1,
      icon: {
        width: 30,
        height: 30,
        shapes: [{ type: 'path', data: 'M 8.9 17.9 A 8 8 0 0 1 21.1 17.9', stroke: '#8B5CF6', strokeWidth: 2 }]
      }
    }

    exportFloorSnapshotsToPDF([], project, { includeLegend: true, legendItems: [legendItem] })

    expect(pdfInstances[0].lines.length).toBeGreaterThan(1)
  })
})
