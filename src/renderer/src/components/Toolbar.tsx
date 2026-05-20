import { useEffect, useMemo, useState } from 'react'
import { useCanvasStore } from '../stores/useCanvasStore'
import { useFileOperations } from '../hooks/useFileOperations'
import type Konva from 'konva'
import {
  exportStageToPDFImage,
  exportFloorSnapshotsToPDF,
  getPdfRenderSize,
  resolvePdfPageOrientation,
  type FloorPdfSnapshot,
  type PdfPaperSize,
  type PdfPageOrientation,
  type PdfResolutionDpi,
  type PdfLegendItem
} from '../services/exportService'
import {
  CURRENT_VISIBILITY_EXPORT_PROFILE_ID,
  getVisibleSymbolIdsForExportProfile,
  isPlacedSymbolVisibleForExportProfile,
  resolvePdfExportOptions,
  type PdfExportSelection,
  type ResolvedExportProfile
} from '../services/pdfExportProfiles'
import { useProjectStore } from '../stores/useProjectStore'
import { useUIStore } from '../stores/useUIStore'
import { CATEGORY_COLORS, getSymbolById, SymbolCategory } from '../symbols'
import type { Floor, Project } from '../types/project'
import { FloorPlanScaleDialog } from './FloorPlanScaleDialog'
import { PdfExportDialog } from './PdfExportDialog'
import { PdfProfilesDialog } from './PdfProfilesDialog'
import { getEffectiveExportProfile, getProfileVisibilitySymbolIds } from './profileVisibility'
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
  const scaleFloorPlanImage = useProjectStore((s) => s.scaleFloorPlanImage)
  const addExportProfile = useProjectStore((s) => s.addExportProfile)
  const updateExportProfile = useProjectStore((s) => s.updateExportProfile)
  const removeExportProfile = useProjectStore((s) => s.removeExportProfile)
  const canUndo = useProjectStore((s) => s.canUndo)
  const canRedo = useProjectStore((s) => s.canRedo)
  const undo = useProjectStore((s) => s.undo)
  const redo = useProjectStore((s) => s.redo)

  const interactionMode = useUIStore((s) => s.interactionMode)
  const setInteractionMode = useUIStore((s) => s.setInteractionMode)
  const setItemsListOpen = useUIStore((s) => s.setItemsListOpen)
  const pdfExportDialogOpen = useUIStore((s) => s.pdfExportDialogOpen)
  const setPdfExportDialogOpen = useUIStore((s) => s.setPdfExportDialogOpen)
  const pdfProfilesDialogOpen = useUIStore((s) => s.pdfProfilesDialogOpen)
  const setPdfProfilesDialogOpen = useUIStore((s) => s.setPdfProfilesDialogOpen)
  const setProfileVisibilitySymbolIds = useUIStore((s) => s.setProfileVisibilitySymbolIds)
  const setLoading = useUIStore((s) => s.setLoading)
  const hiddenSymbolIds = useUIStore((s) => s.hiddenSymbolIds)
  const exportProfiles = useMemo(
    () => resolvePdfExportOptions(project.exportProfiles),
    [project.exportProfiles]
  )
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [floorPlanScaleDialogOpen, setFloorPlanScaleDialogOpen] = useState(false)
  const [visibilityProfileId, setVisibilityProfileId] = useState(
    CURRENT_VISIBILITY_EXPORT_PROFILE_ID
  )

  const activeFloor = project.floors.find((f) => f.id === activeFloorId)
  const visibilityProfile = exportProfiles.find((profile) => profile.id === visibilityProfileId)
  const hasContent = !!(activeFloor?.floorPlanImage || (activeFloor?.symbols.length ?? 0) > 0)
  const hasScale = !!activeFloor?.pixelsPerMm
  const hasFloorPlanImage = !!activeFloor?.floorPlanImage
  const floorPlanImageIsGrayscale = !!activeFloor?.floorPlanImage?.grayscale

  useEffect(() => {
    if (visibilityProfile) return
    setVisibilityProfileId(CURRENT_VISIBILITY_EXPORT_PROFILE_ID)
  }, [visibilityProfile])

  useEffect(() => {
    setProfileVisibilitySymbolIds(
      getProfileVisibilitySymbolIds(activeFloor, visibilityProfile, hiddenSymbolIds)
    )
  }, [activeFloor, hiddenSymbolIds, setProfileVisibilitySymbolIds, visibilityProfile])

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

  const handleOpenFloorPlanScaleDialog = () => {
    if (!activeFloor?.floorPlanImage) return
    setFloorPlanScaleDialogOpen(true)
  }

  const handleConfirmFloorPlanScale = (percentage: number) => {
    if (!activeFloor?.floorPlanImage) return
    const ui = useUIStore.getState()
    const factor = percentage / 100
    if (factor === 1) {
      setFloorPlanScaleDialogOpen(false)
      return
    }

    scaleFloorPlanImage(activeFloor.id, factor)
    const resizedFloor = useProjectStore
      .getState()
      .project.floors.find((floor) => floor.id === activeFloor.id)
    const stage = stageRef.current
    if (stage && resizedFloor) {
      const container = stage.container()
      zoomToFit(
        getFloorBounds(resizedFloor, hiddenSymbolIds),
        container.clientWidth,
        container.clientHeight
      )
    }
    ui.setNotification({
      type: 'success',
      message: `Plattegrond geschaald naar ${percentage}%.`
    })
    setFloorPlanScaleDialogOpen(false)
  }

  const handleConfirmExportPDF = async (
    selections: PdfExportSelection[],
    includeLegend: boolean,
    pageOrientation: PdfPageOrientation,
    paperSize: PdfPaperSize,
    dpi: PdfResolutionDpi
  ) => {
    const stage = stageRef.current
    if (!stage || selections.length === 0) return

    const canvasState = useCanvasStore.getState()
    const projectState = useProjectStore.getState()
    const originalFloorId = projectState.activeFloorId
    const originalHiddenSymbolIds = new Set(useUIStore.getState().hiddenSymbolIds)
    const originalProfileVisibilitySymbolIds = useUIStore.getState().profileVisibilitySymbolIds
    const originalStage = {
      x: canvasState.stageX,
      y: canvasState.stageY,
      scale: canvasState.scale,
      selectedSymbolId: canvasState.selectedSymbolId
    }
    const originalStageGeometry = captureStageGeometry(stage)

    setIsExportingPDF(true)
    setLoading('PDF exporteren...')

    try {
      const snapshots: FloorPdfSnapshot[] = []
      const profiles = resolvePdfExportOptions(projectState.project.exportProfiles)
      const activeVisibilityProfile = profiles.find((profile) => profile.id === visibilityProfileId)

      for (const selection of selections) {
        const floor = project.floors.find((f) => f.id === selection.floorId)
        const profile = profiles.find((item) => item.id === selection.profileId)
        if (!profile) continue
        if (!floor) continue

        const effectiveProfile = getEffectiveExportProfile(profile, activeVisibilityProfile)
        const visibleSymbolIds = getVisibleSymbolIdsForExportProfile(
          floor.symbols,
          effectiveProfile,
          originalHiddenSymbolIds
        )
        const bounds = getFloorBounds(floor, originalHiddenSymbolIds, visibleSymbolIds)
        const resolvedOrientation = resolvePdfPageOrientation(
          bounds.width,
          bounds.height,
          pageOrientation
        )
        const renderSize = getPdfRenderSize(paperSize, resolvedOrientation, dpi)

        setActiveFloor(floor.id)
        setSelectedSymbol(null)
        useUIStore.setState({
          profileVisibilitySymbolIds: null,
          pdfExportVisibleSymbolIds: visibleSymbolIds
        })
        await waitForStagePaint(stage)

        renderStageForPrint(stage, bounds, renderSize)
        await waitForStagePaint(stage)

        snapshots.push({
          floorId: floor.id,
          floorName:
            profile.id === CURRENT_VISIBILITY_EXPORT_PROFILE_ID
              ? floor.name
              : `${floor.name} - ${profile.name}`,
          dataUrl: exportStageToPDFImage(stage, { pixelRatio: 1 }),
          width: renderSize.width,
          height: renderSize.height
        })
      }

      const legendItems = includeLegend
        ? buildLegendItemsForExportSelections(
            project,
            selections,
            profiles,
            originalHiddenSymbolIds,
            activeVisibilityProfile
          )
        : []
      if (snapshots.length === 0) return
      const pdfData = exportFloorSnapshotsToPDF(snapshots, project, {
        includeLegend,
        legendItems,
        pageOrientation,
        paperSize
      })
      const fileName =
        snapshots.length === 1
          ? `${project.name} - ${snapshots[0].floorName}.pdf`
          : `${project.name} - ${snapshots.length} exportpagina's.pdf`
      await window.api.exportPDF(pdfData, fileName)
      setPdfExportDialogOpen(false)
    } finally {
      useUIStore.setState({
        hiddenSymbolIds: originalHiddenSymbolIds,
        profileVisibilitySymbolIds: originalProfileVisibilitySymbolIds,
        pdfExportVisibleSymbolIds: null
      })
      setActiveFloor(originalFloorId)
      setStagePosition(originalStage.x, originalStage.y)
      setScale(originalStage.scale)
      setSelectedSymbol(originalStage.selectedSymbolId)
      restoreStageGeometry(stage, originalStageGeometry)
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
            onClick={handleOpenFloorPlanScaleDialog}
            disabled={!hasFloorPlanImage}
            title={
              hasFloorPlanImage
                ? 'Plattegrond schalen en symbolen meeplaatsen'
                : 'Laad eerst een plattegrond'
            }
          >
            <span className="toolbar-icon">↕</span>
            <span>Formaat</span>
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
          <label className="toolbar-select-label" title="Kies PDF-profiel voor zichtbaarheid">
            <span>Zichtbaarheid</span>
            <select
              value={visibilityProfileId}
              onChange={(event) => setVisibilityProfileId(event.target.value)}
            >
              {exportProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </label>
          <button onClick={() => setPdfProfilesDialogOpen(true)} title="PDF profielen beheren">
            <span>Profielen</span>
          </button>
          <button onClick={handleExportPDF} title="Exporteren als PDF">
            <span>PDF</span>
          </button>
        </div>
      </div>

      {pdfExportDialogOpen && (
        <PdfExportDialog
          floors={project.floors}
          activeFloorId={activeFloorId}
          exportProfiles={project.exportProfiles}
          isExporting={isExportingPDF}
          onCancel={() => setPdfExportDialogOpen(false)}
          onExport={handleConfirmExportPDF}
        />
      )}
      {pdfProfilesDialogOpen && (
        <PdfProfilesDialog
          floors={project.floors}
          exportProfiles={project.exportProfiles}
          onCancel={() => setPdfProfilesDialogOpen(false)}
          onAddProfile={addExportProfile}
          onUpdateProfile={updateExportProfile}
          onRemoveProfile={removeExportProfile}
        />
      )}
      {floorPlanScaleDialogOpen && activeFloor?.floorPlanImage && (
        <FloorPlanScaleDialog
          image={activeFloor.floorPlanImage}
          onCancel={() => setFloorPlanScaleDialogOpen(false)}
          onScale={handleConfirmFloorPlanScale}
        />
      )}
    </>
  )
}

function getFloorBounds(
  floor: Floor,
  hiddenSymbolIds: Set<string>,
  visibleSymbolIds: Set<string> | null = null
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
    if (visibleSymbolIds && !visibleSymbolIds.has(symbol.id)) continue
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

interface StageGeometry {
  width: number
  height: number
  x: number
  y: number
  scaleX: number
  scaleY: number
}

function captureStageGeometry(stage: Konva.Stage): StageGeometry {
  return {
    width: stage.width(),
    height: stage.height(),
    x: stage.x(),
    y: stage.y(),
    scaleX: stage.scaleX(),
    scaleY: stage.scaleY()
  }
}

function restoreStageGeometry(stage: Konva.Stage, geometry: StageGeometry): void {
  stage.width(geometry.width)
  stage.height(geometry.height)
  stage.x(geometry.x)
  stage.y(geometry.y)
  stage.scaleX(geometry.scaleX)
  stage.scaleY(geometry.scaleY)
  stage.batchDraw()
}

function renderStageForPrint(
  stage: Konva.Stage,
  bounds: { x: number; y: number; width: number; height: number },
  size: { width: number; height: number }
): void {
  const scale = Math.min(size.width / bounds.width, size.height / bounds.height)
  const stageX = (size.width - bounds.width * scale) / 2 - bounds.x * scale
  const stageY = (size.height - bounds.height * scale) / 2 - bounds.y * scale

  stage.width(size.width)
  stage.height(size.height)
  stage.x(stageX)
  stage.y(stageY)
  stage.scaleX(scale)
  stage.scaleY(scale)
  stage.batchDraw()
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

function buildLegendItemsForExportSelections(
  project: Project,
  selections: PdfExportSelection[],
  profiles: ResolvedExportProfile[],
  baseHiddenSymbolIds: Set<string>,
  activeVisibilityProfile?: ResolvedExportProfile
): PdfLegendItem[] {
  const counts = new Map<string, number>()

  selections.forEach((selection) => {
    const floor = project.floors.find((item) => item.id === selection.floorId)
    const profile = profiles.find((item) => item.id === selection.profileId)
    if (!floor || !profile) return
    const effectiveProfile = getEffectiveExportProfile(profile, activeVisibilityProfile)

    floor.symbols.forEach((symbol) => {
      if (!isPlacedSymbolVisibleForExportProfile(symbol, effectiveProfile, baseHiddenSymbolIds)) return
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
