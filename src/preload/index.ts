import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  openProject: (): Promise<{ filePath: string; data: string } | null> =>
    ipcRenderer.invoke('dialog:open-project'),

  saveProject: (data: string, filePath?: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:save-project', { data, filePath }),

  saveProjectAs: (data: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:save-project-as', { data }),

  openImage: (): Promise<{ data: string; fileName: string } | null> =>
    ipcRenderer.invoke('dialog:open-image'),

  exportPNG: (dataUrl: string, fileName: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:export-png', { dataUrl, fileName }),

  exportPDF: (pdfData: ArrayBuffer, fileName: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:export-pdf', { pdfData, fileName }),

  setTitle: (title: string): void => ipcRenderer.send('set-title', title),

  onMenuAction: (callback: (action: string) => void): (() => void) => {
    const actions = [
      'menu:new-project',
      'menu:open-project',
      'menu:save-project',
      'menu:save-project-as',
      'menu:load-image',
      'menu:export-png',
      'menu:export-pdf'
    ]
    const handlers = actions.map((action) => {
      const h = (): void => callback(action)
      ipcRenderer.on(action, h)
      return { action, handler: h }
    })
    return () => {
      handlers.forEach(({ action, handler: h }) => ipcRenderer.removeListener(action, h))
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
