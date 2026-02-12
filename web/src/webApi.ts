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

function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.addEventListener('change', () => {
      resolve(input.files?.[0] ?? null)
    })
    // Handle cancel — the input won't fire 'change' but we can detect focus return
    window.addEventListener(
      'focus',
      () => {
        setTimeout(() => {
          if (!input.files?.length) resolve(null)
        }, 300)
      },
      { once: true }
    )
    input.click()
  })
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

function downloadDataUrl(dataUrl: string, fileName: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = fileName
  a.click()
}

const webApi: LichtplanAPI = {
  async openProject() {
    const file = await pickFile('.lichtplan')
    if (!file) return null
    const data = await file.text()
    return { filePath: file.name, data }
  },

  async saveProject(data: string, _filePath?: string) {
    const blob = new Blob([data], { type: 'application/json' })
    downloadBlob(blob, _filePath ?? 'project.lichtplan')
    return _filePath ?? 'project.lichtplan'
  },

  async saveProjectAs(data: string) {
    const blob = new Blob([data], { type: 'application/json' })
    downloadBlob(blob, 'project.lichtplan')
    return 'project.lichtplan'
  },

  async openImage() {
    const file = await pickFile('image/*')
    if (!file) return null
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve({ data: reader.result as string, fileName: file.name })
      reader.readAsDataURL(file)
    })
  },

  async exportPNG(dataUrl: string, fileName: string) {
    downloadDataUrl(dataUrl, fileName)
    return fileName
  },

  async exportPDF(pdfData: ArrayBuffer, fileName: string) {
    const blob = new Blob([pdfData], { type: 'application/pdf' })
    downloadBlob(blob, fileName)
    return fileName
  },

  setTitle(title: string) {
    document.title = title
  },

  onMenuAction(_callback: (action: string) => void) {
    // No native menu in browser — toolbar buttons handle all actions
    return () => {}
  }
}

window.api = webApi
