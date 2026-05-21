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

export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    let settled = false

    const cleanup = () => {
      input.removeEventListener('cancel', handleCancel)
      input.remove()
    }
    const finish = (file: File | null) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(file)
    }
    const handleCancel = () => finish(null)

    input.type = 'file'
    input.accept = accept
    input.style.display = 'none'
    input.addEventListener('change', () => {
      finish(input.files?.[0] ?? null)
    })
    input.addEventListener('cancel', handleCancel)
    document.body.appendChild(input)
    input.click()
  })
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()

  window.setTimeout(() => {
    URL.revokeObjectURL(url)
    a.remove()
  }, 0)
}

export function downloadDataUrl(dataUrl: string, fileName: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = fileName
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  window.setTimeout(() => a.remove(), 0)
}

export async function saveBlob(blob: Blob, fileName: string): Promise<string | null> {
  downloadBlob(blob, fileName)
  return fileName
}

function buildFullErrorMessage(summary: string, error: unknown): string {
  return `${summary}\n\nVolledige fout:\n${formatUnknownError(error)}`
}

function formatUnknownError(error: unknown): string {
  if (error instanceof DOMException) {
    return `${error.name}: ${error.message}`
  }

  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause
    const stackOrMessage = error.stack?.trim() || `${error.name}: ${error.message}`
    if (cause) {
      return `${stackOrMessage}\n\nCause:\n${formatUnknownError(cause)}`
    }
    return stackOrMessage
  }

  if (typeof error === 'string') return error

  try {
    return JSON.stringify(error, null, 2)
  } catch {
    return String(error)
  }
}

const webApi: LichtplanAPI = {
  async openProject() {
    const file = await pickFile('.lichtplan')
    if (!file) return null
    try {
      const data = await file.text()
      return { filePath: file.name, data }
    } catch (error) {
      throw new Error(buildFullErrorMessage('Openen van het gekozen bestand is mislukt.', error))
    }
  },

  async saveProject(data: string, _filePath?: string) {
    const blob = new Blob([data], { type: 'application/json' })
    return saveBlob(blob, _filePath ?? 'project.lichtplan')
  },

  async saveProjectAs(data: string) {
    const blob = new Blob([data], { type: 'application/json' })
    return saveBlob(blob, 'project.lichtplan')
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
