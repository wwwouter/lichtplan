/// <reference types="vite/client" />

interface LichtplanAPI {
  openProject: () => Promise<{ filePath: string; data: string } | null>
  saveProject: (data: string, filePath?: string) => Promise<string | null>
  saveProjectAs: (data: string) => Promise<string | null>
  openImage: () => Promise<{ data: string; fileName: string } | null>
  exportPNG: (dataUrl: string, fileName: string) => Promise<string | null>
  exportPDF: (pdfData: ArrayBuffer, fileName: string) => Promise<string | null>
  setTitle: (title: string) => void
  onMenuAction: (callback: (action: string) => void) => () => void
}

declare global {
  interface Window {
    api: LichtplanAPI
  }
}

export {}
