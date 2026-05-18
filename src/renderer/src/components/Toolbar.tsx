import { useState } from 'react'
import { useCanvasStore } from '../stores/useCanvasStore'
import { useFileOperations } from '../hooks/useFileOperations'
import type Konva from 'konva'
import {
  exportStageToPDFImage,
  exportFloorSnapshotsToPDF,
  type FloorPdfSnapshot,
  type PdfPageOrientation,
  type PdfLegendItem
} from '../services/exportService'
import { useProjectStore } from '../stores/useProjectStore'
import { useUIStore } from '../stores/useUIStore'
import { CATEGORY_COLORS, getSymbolById, SymbolCategory } from '../symbols'
import type { Floor } from '../types/project'
import { PdfExportDialog } from './PdfExportDialog'
import { isPlacedSymbolVisible } from './symbolVisibility'

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>
}

export function Toolbar({ stageRef }: Props) {
  const {
    handleNew,
    handleOpen,
    handleSave,
    handleLoadImage,
    handleDownloadFloorPlanImage
  } = useFileOperations()
  const {
    scale,
    zoomIn,
    zoomOut,
    resetZoom,
    zoomToFit,
    setStagePosition,
    setScale,
    setSelectedSymbol
  } = useCanvasStore()
  const project = useProjectStore((s) => s.project)
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const setActiveFloor = useProjectStore((s) => s.setActiveFloor)
  const setFloorImageGrayscale = useProjectStore((s) => s.setFloorImageGrayscale)
  const canUndo = useProjectStore((s) => s.canUndo)
  const canRedo = useProjectStore((s) => s.canRedo)
  const undo = useProjectStore((s) => s.undo)
  const redo = useProjectStore((s) => s.redo)

  const interactionMode = useUIStore((s) => s.interactionMode)
  const setInteractionMode = useUIStore((s) => s.setInteractionMode)
  const setItemsListOpen = useUIStore((s) => s.setItemsListOpen)
  const pdfExportDialogOpen = useUIStore((s) => s.pdfExportDialogOpen)
  const setPdfExportDialogOpen = useUIStore((s) => s.setPdfExportDialogOpen)
  const setLoading = useUIStore((s) => s.setLoading)
  const hiddenSymbolIds = useUIStore((s) => s.hiddenSymbolIds)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const activeFloor = project.floors.find((f) => f.id === activeFloorId)
  const hasContent = !!(activeFloor?.floorPlanImage || (activeFloor?.symbols.length ?? 0) > 0)
  const hasScale = !!activeFloor?.pixelsPerMm
  const hasFloorPlanImage = !!activeFloor?.floorPlanImage
  const floorPlanImageIsGrayscale = !!activeFloor?.floorPlanImage?.grayscale

  const handleZoomToFit = () => {
    if (!stageRef.current || !activeFloor) return
    const image = activeFloor.floorPlanImage
    const symbols = activeFloor.symbols.filter((symbol) =>
      isPlacedSymbolVisible(symbol, hiddenSymbolIds)
    )
    if (!image && symbols.length === 0) return

    const SYMBOL_MARGIN = 30
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity

    if (image) {
      minX = Math.min(minX, 0)
      minY = Math.min(minY, 0)
      maxX = Math.max(maxX, image.width)
      maxY = Math.max(maxY, image.height)
    }

    for (const s of symbols) {
      minX = Math.min(minX, s.x - SYMBOL_MARGIN)
      minY = Math.min(minY, s.y - SYMBOL_MARGIN)
      maxX = Math.max(maxX, s.x + SYMBOL_MARGIN)
      maxY = Math.max(maxY, s.y + SYMBOL_MARGIN)
    }

    const container = stageRef.current.container()
    zoomToFit(
      { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
      container.clientWidth,
      container.clientHeight
    )
  }

  const handleExportPDF = async () => {
    setPdfExportDialogOpen(true)
  }

  const handleToggleImageGrayscale = () => {
    if (!activeFloor?.floorPlanImage) return
    setFloorImageGrayscale(activeFloor.id, !floorPlanImageIsGrayscale)
  }

  const handleConfirmExportPDF = async (
    floorIds: string[],
    includeLegend: boolean,
    pageOrientation: PdfPageOrientation
  ) => {
    const stage = stageRef.current
    if (!stage || floorIds.length === 0) return

    const canvasState = useCanvasStore.getState()
    const projectState = useProjectStore.getState()
    const originalFloorId = projectState.activeFloorId
    const originalStage = {
      x: canvasState.stageX,
      y: canvasState.stageY,
      scale: canvasState.scale,
      selectedSymbolId: canvasState.selectedSymbolId
    }

    setIsExportingPDF(true)
    setLoading('PDF exporteren...')

    try {
      const snapshots: FloorPdfSnapshot[] = []

      for (const floorId of floorIds) {
        const floor = project.floors.find((f) => f.id === floorId)
        if (!floor) continue

        setActiveFloor(floor.id)
        setSelectedSymbol(null)
        await waitForStagePaint(stage)
        zoomFloorToFit(stage, floor, hiddenSymbolIds, zoomToFit)
        await waitForStagePaint(stage)

        snapshots.push({
          floorId: floor.id,
          floorName: floor.name,
          dataUrl: exportStageToPDFImage(stage),
          width: stage.width(),
          height: stage.height()
        })
      }

      const legendItems = includeLegend
        ? buildLegendItems(
            project.floors.filter((floor) => floorIds.includes(floor.id)),
            hiddenSymbolIds
          )
        : []
      const pdfData = exportFloorSnapshotsToPDF(snapshots, project, {
        includeLegend,
        legendItems,
        pageOrientation
      })
      const selectedFloorNames = project.floors
        .filter((floor) => floorIds.includes(floor.id))
        .map((floor) => floor.name)
      const fileName =
        selectedFloorNames.length === 1
          ? `${project.name} - ${selectedFloorNames[0]}.pdf`
          : `${project.name} - ${selectedFloorNames.length} verdiepingen.pdf`
      await window.api.exportPDF(pdfData, fileName)
      setPdfExportDialogOpen(false)
    } finally {
      setActiveFloor(originalFloorId)
      setStagePosition(originalStage.x, originalStage.y)
      setScale(originalStage.scale)
      setSelectedSymbol(originalStage.selectedSymbolId)
      setIsExportingPDF(false)
      setLoading(null)
      await waitForStagePaint(stage)
    }
  }

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-group">
          <button onClick={handleNew} title="Nieuw project (Ctrl+N)">
            <span className="toolbar-icon">📄</span>
            <span>Nieuw</span>
          </button>
          <button onClick={handleOpen} title="Openen (Ctrl+O)">
            <span className="toolbar-icon">📂</span>
            <span>Openen</span>
          </button>
          <button onClick={handleSave} title="Opslaan (Ctrl+S)">
            <span className="toolbar-icon">💾</span>
            <span>Opslaan</span>
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button onClick={undo} disabled={!canUndo} title="Ongedaan maken (Ctrl+Z)">
            <span>Undo</span>
          </button>
          <button onClick={redo} disabled={!canRedo} title="Opnieuw (Ctrl+Shift+Z)">
            <span>Redo</span>
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button onClick={handleLoadImage} title="Plattegrond laden">
            <span className="toolbar-icon">🖼</span>
            <span>Plattegrond</span>
          </button>
          <button
            className={floorPlanImageIsGrayscale ? 'active' : ''}
            onClick={handleToggleImageGrayscale}
            disabled={!hasFloorPlanImage}
            title={
              hasFloorPlanImage
                ? 'Plattegrond grijswaarden aan/uit'
                : 'Laad eerst een plattegrond'
            }
          >
            <span className="toolbar-icon">◐</span>
            <span>Grijs</span>
          </button>
          <button
            onClick={handleDownloadFloorPlanImage}
            disabled={!hasFloorPlanImage}
            title={
              hasFloorPlanImage
                ? 'Plattegrond downloaden'
                : 'Laad eerst een plattegrond'
            }
          >
            <span className="toolbar-icon">⬇</span>
            <span>Download</span>
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button onClick={zoomOut} title="Uitzoomen">
            −
          </button>
          <span className="zoom-label">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} title="Inzoomen">
            +
          </button>
          <button onClick={resetZoom} title="Reset zoom">
            ⟲
          </button>
          <button onClick={handleZoomToFit} disabled={!hasContent} title="Best fit">
            ⤢
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            className={interactionMode === 'calibrate' ? 'active' : ''}
            onClick={() =>
              setInteractionMode(interactionMode === 'calibrate' ? 'default' : 'calibrate')
            }
            title="Schaal instellen"
          >
            <span className="toolbar-icon">📏</span>
            <span>Kalibreren</span>
          </button>
          <button
            className={interactionMode === 'measure' ? 'active' : ''}
            onClick={() =>
              setInteractionMode(interactionMode === 'measure' ? 'default' : 'measure')
            }
            disabled={!hasScale}
            title={hasScale ? 'Afstand meten' : 'Kalibreer eerst de schaal'}
          >
            <span className="toolbar-icon">📐</span>
            <span>Meten</span>
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button onClick={() => setItemsListOpen(true)} title="Items lijst">
            <span className="toolbar-icon">📋</span>
            <span>Items</span>
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button onClick={handleExportPDF} title="Exporteren als PDF">
            <span>PDF</span>
          </button>
        </div>
      </div>

      {pdfExportDialogOpen && (
        <PdfExportDialog
          floors={project.floors}
          activeFloorId={activeFloorId}
          isExporting={isExportingPDF}
          onCancel={() => setPdfExportDialogOpen(false)}
          onExport={handleConfirmExportPDF}
        />
      )}
    </>
  )
}

function getFloorBounds(
  floor: Floor,
  hiddenSymbolIds: Set<string>
): { x: number; y: number; width: number; height: number } {
  const margin = 40
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  if (floor.floorPlanImage) {
    minX = Math.min(minX, 0)
    minY = Math.min(minY, 0)
    maxX = Math.max(maxX, floor.floorPlanImage.width)
    maxY = Math.max(maxY, floor.floorPlanImage.height)
  }

  for (const symbol of floor.symbols) {
    if (!isPlacedSymbolVisible(symbol, hiddenSymbolIds)) continue
    minX = Math.min(minX, symbol.x - margin)
    minY = Math.min(minY, symbol.y - margin)
    maxX = Math.max(maxX, symbol.x + margin)
    maxY = Math.max(maxY, symbol.y + margin)
  }

  if (
    !Number.isFinite(minX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(maxX) ||
    !Number.isFinite(maxY)
  ) {
    return { x: 0, y: 0, width: 1, height: 1 }
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

function zoomFloorToFit(
  stage: Konva.Stage,
  floor: Floor,
  hiddenSymbolIds: Set<string>,
  zoomToFit: (
    bounds: { x: number; y: number; width: number; height: number },
    viewportWidth: number,
    viewportHeight: number
  ) => void
): void {
  const bounds = getFloorBounds(floor, hiddenSymbolIds)
  const container = stage.container()
  zoomToFit(bounds, container.clientWidth, container.clientHeight)
}

function waitForStagePaint(stage: Konva.Stage): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        stage.batchDraw()
        resolve()
      })
    })
  })
}

function buildLegendItems(floors: Floor[], hiddenSymbolIds: Set<string>): PdfLegendItem[] {
  const counts = new Map<string, number>()

  floors.forEach((floor) => {
    floor.symbols.forEach((symbol) => {
      if (!isPlacedSymbolVisible(symbol, hiddenSymbolIds)) return
      counts.set(symbol.symbolId, (counts.get(symbol.symbolId) ?? 0) + 1)
    })
  })

  const categoryOrder = Object.values(SymbolCategory)
  return Array.from(counts.entries())
    .map<PdfLegendItem | null>(([symbolId, count]) => {
      const definition = getSymbolById(symbolId)
      if (!definition) return null
      return {
        symbolId,
        name: definition.name,
        category: definition.category,
        color: CATEGORY_COLORS[definition.category],
        count,
        icon: {
          width: definition.width,
          height: definition.height,
          shapes: definition.shapes
        }
      }
    })
    .filter((item): item is PdfLegendItem => item !== null)
    .sort(
      (a, b) =>
        categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category) ||
        a.name.localeCompare(b.name, 'nl')
    )
}
