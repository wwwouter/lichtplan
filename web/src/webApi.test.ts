import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadBlob, downloadDataUrl, pickFile, saveBlob } from './webApi'

function chooseFile(input: HTMLInputElement, file: File): void {
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: [file]
  })
  input.dispatchEvent(new Event('change'))
}

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

  it('saves project files through the browser download path even when the save picker exists', async () => {
    const showSaveFilePicker = vi.fn().mockRejectedValue(new Error('showSaveFilePicker should not be used'))
    ;(window as Window & { showSaveFilePicker?: unknown }).showSaveFilePicker = showSaveFilePicker
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:lichtplan')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const blob = new Blob(['{}'], { type: 'application/json' })

    await expect(saveBlob(blob, 'project.lichtplan')).resolves.toBe('project.lichtplan')

    const link = document.body.querySelector<HTMLAnchorElement>('a[download="project.lichtplan"]')
    expect(link).not.toBeNull()
    expect(link?.href).toBe('blob:lichtplan')
    expect(click).toHaveBeenCalledTimes(1)
    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(showSaveFilePicker).not.toHaveBeenCalled()
  })

  it('saves project files through the same download path when no save picker exists', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:lichtplan')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const blob = new Blob(['{}'], { type: 'application/json' })

    await expect(saveBlob(blob, 'project.lichtplan')).resolves.toBe('project.lichtplan')

    expect(click).toHaveBeenCalledTimes(1)
    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(document.body.querySelector<HTMLAnchorElement>('a[download="project.lichtplan"]')).not.toBeNull()
  })

  it('uses a file input for opening project files, even when showOpenFilePicker exists', async () => {
    const showOpenFilePicker = vi.fn().mockRejectedValue(new Error('getFile is blocked'))
    ;(window as Window & { showOpenFilePicker?: unknown }).showOpenFilePicker = showOpenFilePicker
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    const file = new File(['{"name":"Woning"}'], 'woning.lichtplan', { type: 'application/json' })
    const result = pickFile('.lichtplan')
    const input = document.body.querySelector<HTMLInputElement>('input[type="file"]')

    expect(input).not.toBeNull()
    expect(input?.accept).toBe('.lichtplan')
    expect(click).toHaveBeenCalledTimes(1)

    chooseFile(input!, file)

    await expect(result).resolves.toBe(file)
    expect(showOpenFilePicker).not.toHaveBeenCalled()
    expect(document.body.querySelector('input[type="file"]')).toBeNull()
  })

  it('treats cancelling the file input as a cancelled open', async () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    const result = pickFile('.lichtplan')

    expect(document.body.querySelector<HTMLInputElement>('input[type="file"]')).not.toBeNull()
    expect(click).toHaveBeenCalledTimes(1)

    window.dispatchEvent(new Event('focus'))
    vi.runAllTimers()

    await expect(result).resolves.toBeNull()
    expect(document.body.querySelector('input[type="file"]')).toBeNull()
  })

  it('opens projects from the selected file input file', async () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    const file = new File(['{"name":"Woning"}'], 'woning.lichtplan', { type: 'application/json' })
    Object.defineProperty(file, 'text', {
      configurable: true,
      value: vi.fn().mockResolvedValue('{"name":"Woning"}')
    })
    const result = window.api.openProject()
    const input = document.body.querySelector<HTMLInputElement>('input[type="file"]')

    expect(input).not.toBeNull()
    chooseFile(input!, file)

    await expect(result).resolves.toEqual({
      filePath: 'woning.lichtplan',
      data: '{"name":"Woning"}'
    })
  })

  it('keeps the full file read error when opening a selected project file fails', async () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    const readError = new Error('The selected file cannot be read')
    readError.name = 'NotReadableError'
    readError.stack = 'NotReadableError: The selected file cannot be read\n    at File.text'
    const file = new File(['ignored'], 'kapot.lichtplan', { type: 'application/json' })
    Object.defineProperty(file, 'text', {
      configurable: true,
      value: vi.fn().mockRejectedValue(readError)
    })
    const result = window.api.openProject()
    const input = document.body.querySelector<HTMLInputElement>('input[type="file"]')

    expect(input).not.toBeNull()
    chooseFile(input!, file)

    await expect(result).rejects.toThrow('Openen van het gekozen bestand is mislukt')
    await expect(result).rejects.toThrow('NotReadableError: The selected file cannot be read')
  })
})
