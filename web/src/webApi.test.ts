import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadBlob, downloadDataUrl, pickFile, saveBlob } from './webApi'

type TestSaveFilePicker = (options: {
  suggestedName: string
  types: Array<{
    description: string
    accept: Record<string, string[]>
  }>
}) => Promise<{
  name?: string
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>
    close: () => Promise<void>
  }>
}>

type TestOpenFilePicker = (options: {
  multiple?: boolean
  types: Array<{
    description: string
    accept: Record<string, string[]>
  }>
}) => Promise<
  Array<{
    name?: string
    getFile: () => Promise<File>
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>
      close: () => Promise<void>
    }>
  }>
>

const projectFileTypes = [
  {
    description: 'Lichtplan project',
    accept: { 'application/json': ['.lichtplan'] }
  }
]

describe('web download helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    delete (window as Window & { showSaveFilePicker?: unknown }).showSaveFilePicker
    delete (window as Window & { showOpenFilePicker?: unknown }).showOpenFilePicker
    vi.useRealTimers()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('keeps blob download links alive until the browser can start saving', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:lichtplan')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    downloadBlob(new Blob(['{}'], { type: 'application/json' }), 'project.lichtplan')

    const link = document.body.querySelector<HTMLAnchorElement>('a[download="project.lichtplan"]')
    expect(link).not.toBeNull()
    expect(link?.href).toBe('blob:lichtplan')
    expect(click).toHaveBeenCalledTimes(1)
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).not.toHaveBeenCalled()

    vi.runAllTimers()

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:lichtplan')
    expect(document.body.querySelector('a[download="project.lichtplan"]')).toBeNull()
  })

  it('temporarily attaches data URL download links before clicking them', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    downloadDataUrl('data:image/png;base64,abc', 'export.png')

    const link = document.body.querySelector<HTMLAnchorElement>('a[download="export.png"]')
    expect(link).not.toBeNull()
    expect(link?.href).toBe('data:image/png;base64,abc')
    expect(click).toHaveBeenCalledTimes(1)

    vi.runAllTimers()

    expect(document.body.querySelector('a[download="export.png"]')).toBeNull()
  })

  it('fails instead of falling back when the browser save picker is unavailable', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:lichtplan')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    await expect(saveBlob(new Blob(['{}'], { type: 'application/json' }), 'project.lichtplan')).rejects.toThrow(
      'Deze browser ondersteunt opslaan naar een gekozen bestand niet'
    )

    expect(click).not.toHaveBeenCalled()
    expect(document.body.querySelector('a[download="project.lichtplan"]')).toBeNull()
  })

  it('uses the browser save picker when it is available', async () => {
    const write = vi.fn().mockResolvedValue(undefined)
    const close = vi.fn().mockResolvedValue(undefined)
    const createWritable = vi.fn().mockResolvedValue({ write, close })
    const showSaveFilePicker = vi.fn().mockResolvedValue({ name: 'woning.lichtplan', createWritable })
    ;(window as Window & { showSaveFilePicker?: TestSaveFilePicker }).showSaveFilePicker = showSaveFilePicker
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const blob = new Blob(['{}'], { type: 'application/json' })

    await expect(saveBlob(blob, 'project.lichtplan')).resolves.toBe('woning.lichtplan')

    expect(showSaveFilePicker).toHaveBeenCalledWith({
      suggestedName: 'project.lichtplan',
      types: projectFileTypes
    })
    expect(write).toHaveBeenCalledWith(blob)
    expect(close).toHaveBeenCalledTimes(1)
    expect(click).not.toHaveBeenCalled()
  })

  it('treats cancelling the browser save picker as a cancelled save', async () => {
    const showSaveFilePicker = vi.fn().mockRejectedValue(new DOMException('Cancelled', 'AbortError'))
    ;(window as Window & { showSaveFilePicker?: TestSaveFilePicker }).showSaveFilePicker = showSaveFilePicker

    await expect(saveBlob(new Blob(['{}'], { type: 'application/json' }), 'project.lichtplan')).resolves.toBeNull()
  })

  it('shows a friendly save error when writing to the picked file is blocked', async () => {
    const pickerError = new Error('The request is blocked by the browser')
    pickerError.name = 'NotAllowedError'
    pickerError.stack = 'NotAllowedError: The request is blocked by the browser\n    at createWritable'
    const createWritable = vi.fn().mockRejectedValue(pickerError)
    const showSaveFilePicker = vi.fn().mockResolvedValue({ name: 'woning.lichtplan', createWritable })
    ;(window as Window & { showSaveFilePicker?: TestSaveFilePicker }).showSaveFilePicker = showSaveFilePicker
    const result = saveBlob(new Blob(['{}'], { type: 'application/json' }), 'project.lichtplan')

    await expect(result).rejects.toThrow('Opslaan naar de gekozen map is mislukt')
    await expect(result).rejects.toThrow('NotAllowedError: The request is blocked by the browser')
  })

  it('uses the browser open picker for project files', async () => {
    const file = new File(['{"name":"Woning"}'], 'woning.lichtplan', { type: 'application/json' })
    const getFile = vi.fn().mockResolvedValue(file)
    const showOpenFilePicker = vi.fn().mockResolvedValue([
      {
        name: 'woning.lichtplan',
        getFile,
        createWritable: vi.fn()
      }
    ])
    ;(window as Window & { showOpenFilePicker?: TestOpenFilePicker }).showOpenFilePicker = showOpenFilePicker

    await expect(pickFile(projectFileTypes)).resolves.toEqual({
      file,
      handle: expect.objectContaining({ name: 'woning.lichtplan' })
    })

    expect(showOpenFilePicker).toHaveBeenCalledWith({ multiple: false, types: projectFileTypes })
    expect(getFile).toHaveBeenCalledTimes(1)
  })

  it('fails instead of falling back when the browser open picker is unavailable', async () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})

    await expect(pickFile(projectFileTypes)).rejects.toThrow(
      'Deze browser ondersteunt openen via een gekozen bestand niet'
    )

    expect(document.body.querySelector('input[type="file"]')).toBeNull()
    expect(click).not.toHaveBeenCalled()
  })

  it('treats cancelling the browser open picker as a cancelled open', async () => {
    const showOpenFilePicker = vi.fn().mockRejectedValue(new DOMException('Cancelled', 'AbortError'))
    ;(window as Window & { showOpenFilePicker?: TestOpenFilePicker }).showOpenFilePicker = showOpenFilePicker

    await expect(pickFile(projectFileTypes)).resolves.toBeNull()
  })

  it('keeps the full browser error when opening a picked file fails', async () => {
    const pickerError = new Error('The file handle cannot be read')
    pickerError.name = 'NotAllowedError'
    pickerError.stack = 'NotAllowedError: The file handle cannot be read\n    at getFile'
    const showOpenFilePicker = vi.fn().mockRejectedValue(pickerError)
    ;(window as Window & { showOpenFilePicker?: TestOpenFilePicker }).showOpenFilePicker = showOpenFilePicker
    const result = pickFile(projectFileTypes)

    await expect(result).rejects.toThrow('Openen van het gekozen bestand is mislukt')
    await expect(result).rejects.toThrow('NotAllowedError: The file handle cannot be read')
  })
})
