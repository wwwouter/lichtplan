import { useCanvasStore } from '../stores/useCanvasStore'
import { useFileOperations } from '../hooks/useFileOperations'
import type Konva from 'konva'
import { exportStageToPNG, exportFloorToPDF } from '../services/exportService'
import { useProjectStore } from '../stores/useProjectStore'

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>
}

export function Toolbar({ stageRef }: Props) {
  const { handleNew, handleOpen, handleSave, handleSaveAs, handleLoadImage } = useFileOperations()
  const { scale, zoomIn, zoomOut, resetZoom, zoomToFit, activeTool, setActiveTool } = useCanvasStore()
  const project = useProjectStore((s) => s.project)
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const canUndo = useProjectStore((s) => s.canUndo)
  const canRedo = useProjectStore((s) => s.canRedo)
  const undo = useProjectStore((s) => s.undo)
  const redo = useProjectStore((s) => s.redo)

  const activeFloor = project.floors.find((f) => f.id === activeFloorId)
  const hasContent = !!(activeFloor?.floorPlanImage || (activeFloor?.symbols.length ?? 0) > 0)

  const handleZoomToFit = () => {
    if (!stageRef.current || !activeFloor) return
    const image = activeFloor.floorPlanImage
    const symbols = activeFloor.symbols
    if (!image && symbols.length === 0) return

    const SYMBOL_MARGIN = 30
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

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

  const handleExportPNG = async () => {
    if (!stageRef.current) return
    const dataUrl = exportStageToPNG(stageRef.current)
    const floor = project.floors.find((f) => f.id === activeFloorId)
    const fileName = `${project.name} - ${floor?.name ?? 'export'}.png`
    await window.api.exportPNG(dataUrl, fileName)
  }

  const handleExportPDF = async () => {
    if (!stageRef.current) return
    const floor = project.floors.find((f) => f.id === activeFloorId)
    const pdfData = exportFloorToPDF(stageRef.current, project, floor?.name ?? 'export')
    const fileName = `${project.name} - ${floor?.name ?? 'export'}.pdf`
    await window.api.exportPDF(pdfData, fileName)
  }

  return (
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
        <button onClick={handleSaveAs} title="Opslaan als (Ctrl+Shift+S)">
          <span>Opslaan als</span>
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
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button onClick={zoomOut} title="Uitzoomen">−</button>
        <span className="zoom-label">{Math.round(scale * 100)}%</span>
        <button onClick={zoomIn} title="Inzoomen">+</button>
        <button onClick={resetZoom} title="Reset zoom">⟲</button>
        <button onClick={handleZoomToFit} disabled={!hasContent} title="Best fit">⤢</button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          className={activeTool === 'select' ? 'active' : ''}
          onClick={() => setActiveTool('select')}
          title="Selecteren"
        >
          ↖
        </button>
        <button
          className={activeTool === 'pan' ? 'active' : ''}
          onClick={() => setActiveTool('pan')}
          title="Verplaatsen"
        >
          ✋
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button onClick={handleExportPNG} title="Exporteren als PNG">
          <span>PNG</span>
        </button>
        <button onClick={handleExportPDF} title="Exporteren als PDF">
          <span>PDF</span>
        </button>
      </div>
    </div>
  )
}
