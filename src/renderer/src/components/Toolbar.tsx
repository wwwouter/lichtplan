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
  const { scale, zoomIn, zoomOut, resetZoom, activeTool, setActiveTool } = useCanvasStore()
  const project = useProjectStore((s) => s.project)
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const canUndo = useProjectStore((s) => s.canUndo)
  const canRedo = useProjectStore((s) => s.canRedo)
  const undo = useProjectStore((s) => s.undo)
  const redo = useProjectStore((s) => s.redo)

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
