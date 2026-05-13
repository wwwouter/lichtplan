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

interface SaveFileHandle {
  name?: string
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>
    close: () => Promise<void>
  }>
}

interface OpenFileHandle extends SaveFileHandle {
  getFile: () => Promise<File>
}

type FilePickerType = {
  description: string
  accept: Record<string, string[]>
}

interface WindowWithFilePickers extends Window {
  showSaveFilePicker?: (options: {
    suggestedName: string
    types: FilePickerType[]
  }) => Promise<SaveFileHandle>
  showOpenFilePicker?: (options: {
    multiple?: boolean
    types: FilePickerType[]
  }) => Promise<OpenFileHandle[]>
}

interface PickedFile {
  file: File
  handle: OpenFileHandle
}

const PROJECT_FILE_TYPES: FilePickerType[] = [
  {
    description: 'Lichtplan project',
    accept: { 'application/json': ['.lichtplan'] }
  }
]

const IMAGE_FILE_TYPES: FilePickerType[] = [
  {
    description: 'Afbeeldingen',
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.bmp', '.gif', '.webp']
    }
  }
]

export async function pickFile(types: FilePickerType[]): Promise<PickedFile | null> {
  const openFilePicker = (window as WindowWithFilePickers).showOpenFilePicker
  if (!openFilePicker) {
    throw new Error('Deze browser ondersteunt openen via een gekozen bestand niet.')
  }

  try {
    const [handle] = await openFilePicker({ multiple: false, types })
    if (!handle) return null
    const file = await handle.getFile()
    return { file, handle }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return null
    throw new Error(buildFullErrorMessage('Openen van het gekozen bestand is mislukt.', error))
  }
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
  const saveFilePicker = (window as WindowWithFilePickers).showSaveFilePicker
  if (!saveFilePicker) {
    throw new Error('Deze browser ondersteunt opslaan naar een gekozen bestand niet.')
  }

  try {
    const handle = await saveFilePicker({
      suggestedName: fileName,
      types: PROJECT_FILE_TYPES
    })
    const writable = await handle.createWritable()
    await writable.write(blob)
    await writable.close()
    return handle.name ?? fileName
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return null
    throw new Error(buildFullErrorMessage('Opslaan naar de gekozen map is mislukt.', error))
  }
}

function buildFullErrorMessage(summary: string, error: unknown): string {
  return `${summary}\n\nVolledige fout:\n${formatUnknownError(error)}`
}

function formatUnknownError(error: unknown): string {
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
    const picked = await pickFile(PROJECT_FILE_TYPES)
    if (!picked) return null
    const data = await picked.file.text()
    return { filePath: picked.handle.name ?? picked.file.name, data }
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
    const picked = await pickFile(IMAGE_FILE_TYPES)
    if (!picked) return null
    const { file } = picked
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
