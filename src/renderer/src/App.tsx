import { useEffect, useRef } from 'react'
import Konva from 'konva'
import { Toolbar } from './components/Toolbar'
import { Sidebar } from './components/Sidebar'
import { FloorCanvas } from './components/FloorCanvas'
import { FloorTabs } from './components/FloorTabs'
import { ContextMenu } from './components/ContextMenu'
import { LabelDialog } from './components/LabelDialog'
import { LoadingOverlay } from './components/LoadingOverlay'
import { CalibrationDialog } from './components/CalibrationDialog'
import { ItemsListPopup } from './components/ItemsListPopup'
import { GroupDialog } from './components/GroupDialog'
import { LocationDialog } from './components/LocationDialog'
import { IdDialog } from './components/IdDialog'
import { DescriptionDialog } from './components/DescriptionDialog'
import { QuestionDialog } from './components/QuestionDialog'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useFileOperations } from './hooks/useFileOperations'
import { useProjectStore } from './stores/useProjectStore'
import { useUIStore } from './stores/useUIStore'
import { exportStageToPNG } from './services/exportService'

function App(): JSX.Element {
  const stageRef = useRef<Konva.Stage | null>(null)
  const { handleNew, handleOpen, handleSave, handleLoadImage } = useFileOperations()
  const project = useProjectStore((s) => s.project)
  const isDirty = useProjectStore((s) => s.isDirty)
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const setPdfExportDialogOpen = useUIStore((s) => s.setPdfExportDialogOpen)

  useKeyboardShortcuts(handleSave)

  // Window title
  useEffect(() => {
    const dirtyMarker = isDirty ? ' *' : ''
    window.api.setTitle(`Lichtplan - ${project.name}${dirtyMarker}`)
  }, [project.name, isDirty])

  // Menu actions from main process
  useEffect(() => {
    const cleanup = window.api.onMenuAction(async (action) => {
      switch (action) {
        case 'menu:new-project':
          handleNew()
          break
        case 'menu:open-project':
          await handleOpen()
          break
        case 'menu:save-project':
          await handleSave()
          break
        case 'menu:load-image':
          await handleLoadImage()
          break
        case 'menu:export-png':
          if (stageRef.current) {
            const dataUrl = exportStageToPNG(stageRef.current)
            const floor = project.floors.find((f) => f.id === activeFloorId)
            await window.api.exportPNG(dataUrl, `${project.name} - ${floor?.name ?? 'export'}.png`)
          }
          break
        case 'menu:export-pdf':
          setPdfExportDialogOpen(true)
          break
      }
    })
    return cleanup
  }, [
    handleNew,
    handleOpen,
    handleSave,
    handleLoadImage,
    project,
    activeFloorId,
    setPdfExportDialogOpen
  ])

  return (
    <div className="app">
      <Toolbar stageRef={stageRef} />
      <div className="app-body">
        <Sidebar />
        <FloorCanvas stageRef={stageRef} />
      </div>
      <FloorTabs />
      <ContextMenu />
      <LabelDialog />
      <CalibrationDialog />
      <ItemsListPopup />
      <GroupDialog />
      <LocationDialog />
      <IdDialog />
      <DescriptionDialog />
      <QuestionDialog />
      <LoadingOverlay />
    </div>
  )
}

export default App
