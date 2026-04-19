import { useCallback } from 'react'
import { useProjectStore } from '../stores/useProjectStore'
import { useCanvasStore } from '../stores/useCanvasStore'
import { useUIStore } from '../stores/useUIStore'
import { serializeProject, deserializeProject } from '../services/fileService'
import { loadFloorPlanImage } from '../services/imageService'

export function useFileOperations() {
  const { project, filePath, activeFloorId, setProject, setFilePath, markClean, newProject, setFloorImage } =
    useProjectStore()

  const handleNew = useCallback(() => {
    newProject()
    useCanvasStore.getState().resetZoom()
  }, [newProject])

  const handleOpen = useCallback(async () => {
    const result = await window.api.openProject()
    if (!result) return
    useUIStore.getState().setLoading('Project openen...')
    try {
      const proj = deserializeProject(result.data)
      setProject(proj, result.filePath)
      useCanvasStore.getState().resetZoom()
    } finally {
      useUIStore.getState().setLoading(null)
    }
  }, [setProject])

  const handleSave = useCallback(async () => {
    const data = serializeProject(project)
    const savedPath = await window.api.saveProject(data, filePath ?? undefined)
    if (savedPath) {
      setFilePath(savedPath)
      markClean()
    }
  }, [project, filePath, setFilePath, markClean])

  const handleSaveAs = useCallback(async () => {
    const data = serializeProject(project)
    const savedPath = await window.api.saveProjectAs(data)
    if (savedPath) {
      setFilePath(savedPath)
      markClean()
    }
  }, [project, setFilePath, markClean])

  const handleLoadImage = useCallback(async () => {
    const result = await window.api.openImage()
    if (!result) return
    useUIStore.getState().setLoading('Afbeelding laden...')
    try {
      const image = await loadFloorPlanImage(result.data, result.fileName)
      setFloorImage(activeFloorId, image)
    } finally {
      useUIStore.getState().setLoading(null)
    }
  }, [activeFloorId, setFloorImage])

  return {
    handleNew,
    handleOpen,
    handleSave,
    handleSaveAs,
    handleLoadImage
  }
}
