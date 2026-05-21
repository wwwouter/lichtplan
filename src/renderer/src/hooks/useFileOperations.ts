import { useCallback } from 'react'
import { useProjectStore } from '../stores/useProjectStore'
import { useCanvasStore } from '../stores/useCanvasStore'
import { useUIStore } from '../stores/useUIStore'
import { serializeProject, deserializeProject } from '../services/fileService'
import {
  createFloorPlanDownloadDataUrl,
  getFloorPlanDownloadFileName,
  loadFloorPlanImage
} from '../services/imageService'
import { refreshTimestampSuffix } from '../services/saveFileName'

export function useFileOperations() {
  const { project, filePath, activeFloorId, setProject, setFilePath, markClean, newProject, setFloorImage } =
    useProjectStore()

  const handleNew = useCallback(() => {
    newProject()
    useCanvasStore.getState().resetZoom()
  }, [newProject])

  const handleOpen = useCallback(async () => {
    const ui = useUIStore.getState()
    ui.setNotification(null)
    const stopLoading = startDelayedLoading('Project openen...')

    try {
      const result = await window.api.openProject()
      if (!result) {
        ui.setNotification({
          type: 'error',
          message: 'Openen is geannuleerd of geblokkeerd door de browser.'
        })
        return
      }
      const proj = deserializeProject(result.data)
      setProject(proj, result.filePath)
      useCanvasStore.getState().resetZoom()
      ui.setNotification({
        type: 'success',
        message: `Project geopend: ${getDisplayFileName(result.filePath)}.`
      })
    } catch (error) {
      ui.setNotification({
        type: 'error',
        message: `Openen mislukt: ${getErrorMessage(error)}`
      })
    } finally {
      stopLoading()
    }
  }, [setProject])

  const handleSave = useCallback(async () => {
    const ui = useUIStore.getState()
    ui.setNotification(null)

    try {
      const data = serializeProject(project)
      const saveFilePath = refreshTimestampSuffix(filePath ?? undefined)
      const savedPath = await window.api.saveProject(data, saveFilePath)
      if (savedPath) {
        setFilePath(savedPath)
        markClean()
      } else {
        ui.setNotification({
          type: 'error',
          message: 'Opslaan is geannuleerd of geblokkeerd door de browser.'
        })
      }
    } catch (error) {
      ui.setNotification({
        type: 'error',
        message: `Opslaan mislukt: ${getErrorMessage(error)}`
      })
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
    const ui = useUIStore.getState()
    ui.setNotification(null)

    try {
      const result = await window.api.openImage()
      if (!result) {
        ui.setNotification({
          type: 'error',
          message: 'Plattegrond openen is geannuleerd of geblokkeerd door de browser.'
        })
        return
      }
      ui.setLoading('Afbeelding laden...')
      const image = await loadFloorPlanImage(result.data, result.fileName)
      setFloorImage(activeFloorId, image)
      ui.setNotification({
        type: 'success',
        message: `Plattegrond geopend: ${getDisplayFileName(result.fileName)}.`
      })
    } catch (error) {
      ui.setNotification({
        type: 'error',
        message: `Plattegrond openen mislukt: ${getErrorMessage(error)}`
      })
    } finally {
      ui.setLoading(null)
    }
  }, [activeFloorId, setFloorImage])

  const handleDownloadFloorPlanImage = useCallback(async () => {
    const ui = useUIStore.getState()
    ui.setNotification(null)

    const state = useProjectStore.getState()
    const floor = state.project.floors.find((f) => f.id === state.activeFloorId)
    const image = floor?.floorPlanImage

    if (!image) {
      ui.setNotification({
        type: 'error',
        message: 'Er is geen plattegrond om te downloaden.'
      })
      return
    }

    try {
      ui.setLoading('Plattegrond downloaden...')
      const dataUrl = await createFloorPlanDownloadDataUrl(image)
      const fileName = getFloorPlanDownloadFileName(image)
      const savedPath = await window.api.exportPNG(dataUrl, fileName)

      if (savedPath) {
        ui.setNotification({
          type: 'success',
          message: `Plattegrond gedownload: ${getDisplayFileName(savedPath)}.`
        })
      } else {
        ui.setNotification({
          type: 'error',
          message: 'Plattegrond downloaden is geannuleerd of geblokkeerd door de browser.'
        })
      }
    } catch (error) {
      ui.setNotification({
        type: 'error',
        message: `Plattegrond downloaden mislukt: ${getErrorMessage(error)}`
      })
    } finally {
      ui.setLoading(null)
    }
  }, [])

  return {
    handleNew,
    handleOpen,
    handleSave,
    handleSaveAs,
    handleLoadImage,
    handleDownloadFloorPlanImage
  }
}

function getDisplayFileName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error === 'string') return error
  return 'onbekende fout'
}

function startDelayedLoading(message: string, delayMs = 100): () => void {
  const ui = useUIStore.getState()
  let shown = false
  const timeoutId = window.setTimeout(() => {
    shown = true
    ui.setLoading(message)
  }, delayMs)

  return () => {
    window.clearTimeout(timeoutId)
    if (shown) {
      ui.setLoading(null)
    }
  }
}
