import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useFileOperations } from '../hooks/useFileOperations'
import { useProjectStore } from '../stores/useProjectStore'
import { useUIStore } from '../stores/useUIStore'

describe('file operations', () => {
  beforeEach(() => {
    vi.mocked(window.api.openProject).mockReset()
    vi.mocked(window.api.saveProject).mockReset()
    useProjectStore.getState().newProject()
    useUIStore.setState({ notification: null, loading: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a visible success message when opening a project', async () => {
    vi.mocked(window.api.openProject).mockResolvedValue({
      filePath: '/downloads/woning.lichtplan',
      data: JSON.stringify({
        id: 'project-1',
        name: 'Woning',
        floors: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      })
    })
    const { result } = renderHook(() => useFileOperations())

    await act(async () => {
      await result.current.handleOpen()
    })

    expect(useUIStore.getState().notification).toMatchObject({
      type: 'success',
      message: expect.stringContaining('woning.lichtplan')
    })
  })

  it('does not show loading when opening finishes within 100ms', async () => {
    vi.useFakeTimers()
    vi.mocked(window.api.openProject).mockResolvedValue({
      filePath: '/downloads/woning.lichtplan',
      data: JSON.stringify({
        id: 'project-1',
        name: 'Woning',
        floors: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      })
    })
    const { result } = renderHook(() => useFileOperations())

    await act(async () => {
      await result.current.handleOpen()
    })

    vi.advanceTimersByTime(100)

    expect(useUIStore.getState().loading).toBeNull()
  })

  it('shows loading when opening takes longer than 100ms', async () => {
    vi.useFakeTimers()
    let resolveOpenProject!: (value: Awaited<ReturnType<typeof window.api.openProject>>) => void
    const openProjectPromise = new Promise<Awaited<ReturnType<typeof window.api.openProject>>>(
      (resolve) => {
        resolveOpenProject = resolve
      }
    )
    vi.mocked(window.api.openProject).mockReturnValue(openProjectPromise)
    const { result } = renderHook(() => useFileOperations())
    let openPromise!: Promise<void>

    act(() => {
      openPromise = result.current.handleOpen()
    })

    act(() => {
      vi.advanceTimersByTime(99)
    })
    expect(useUIStore.getState().loading).toBeNull()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(useUIStore.getState().loading).toBe('Project openen...')

    await act(async () => {
      resolveOpenProject({
        filePath: '/downloads/woning.lichtplan',
        data: JSON.stringify({
          id: 'project-1',
          name: 'Woning',
          floors: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z'
        })
      })
      await openPromise
    })

    expect(useUIStore.getState().loading).toBeNull()
  })

  it('shows a visible error message when opening fails', async () => {
    vi.mocked(window.api.openProject).mockRejectedValue(
      new Error(
        'Openen van het gekozen bestand is mislukt.\n\nVolledige fout:\nNotAllowedError: Bestand niet leesbaar\n    at showOpenFilePicker'
      )
    )
    const { result } = renderHook(() => useFileOperations())

    await act(async () => {
      await result.current.handleOpen()
    })

    expect(useUIStore.getState().notification).toMatchObject({
      type: 'error',
      message: expect.stringContaining('NotAllowedError: Bestand niet leesbaar')
    })
    expect(useUIStore.getState().notification?.message).toContain('Volledige fout')
    expect(useUIStore.getState().notification?.message).toContain('at showOpenFilePicker')
  })

  it('does not show a success message when saving succeeds', async () => {
    vi.mocked(window.api.saveProject).mockResolvedValue('/downloads/project.lichtplan')
    const { result } = renderHook(() => useFileOperations())

    await act(async () => {
      await result.current.handleSave()
    })

    expect(useUIStore.getState().notification).toBeNull()
    expect(useProjectStore.getState().filePath).toBe('/downloads/project.lichtplan')
  })

  it('replaces a timestamp suffix in the current file name when saving', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 19, 12, 34, 56))
    useProjectStore.getState().setFilePath('/downloads/woning-2026-05-18T09:15.lichtplan')
    vi.mocked(window.api.saveProject).mockImplementation(async (_data, filePath) => filePath ?? null)
    const { result } = renderHook(() => useFileOperations())

    await act(async () => {
      await result.current.handleSave()
    })

    expect(window.api.saveProject).toHaveBeenCalledWith(
      expect.any(String),
      '/downloads/woning-2026-05-19T12:34.lichtplan'
    )
    expect(useProjectStore.getState().filePath).toBe('/downloads/woning-2026-05-19T12:34.lichtplan')
  })

  it('shows a visible error message when saving fails', async () => {
    vi.mocked(window.api.saveProject).mockRejectedValue(new Error('Download geblokkeerd'))
    const { result } = renderHook(() => useFileOperations())

    await act(async () => {
      await result.current.handleSave()
    })

    expect(useUIStore.getState().notification).toMatchObject({
      type: 'error',
      message: expect.stringContaining('Download geblokkeerd')
    })
  })
})
