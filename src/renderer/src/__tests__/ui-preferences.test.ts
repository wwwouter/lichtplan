import { beforeEach, describe, expect, it, vi } from 'vitest'

const storageKey = 'lichtplan-ui-preferences'

describe('UI visibility preferences', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.resetModules()
  })

  it('hydrates ID, group, label and icon visibility from browser storage', async () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        showItemId: false,
        showGroup: false,
        showLabel: false,
        hiddenSymbolIds: ['wandlamp', 'does-not-exist']
      })
    )

    const { useUIStore } = await import('../stores/useUIStore')
    const state = useUIStore.getState()

    expect(state.showItemId).toBe(false)
    expect(state.showGroup).toBe(false)
    expect(state.showLabel).toBe(false)
    expect(Array.from(state.hiddenSymbolIds)).toEqual(['wandlamp'])
  })

  it('persists visibility toggles and hidden icon selections to browser storage', async () => {
    const { useUIStore, UI_PREFERENCES_STORAGE_KEY } = await import('../stores/useUIStore')

    useUIStore.getState().toggleShowItemId()
    useUIStore.getState().toggleShowGroup()
    useUIStore.getState().toggleShowLabel()
    useUIStore.getState().toggleSymbolVisibility('inbouwspot')

    expect(JSON.parse(window.localStorage.getItem(UI_PREFERENCES_STORAGE_KEY) ?? '{}')).toEqual({
      showItemId: false,
      showGroup: false,
      showLabel: false,
      hiddenSymbolIds: ['inbouwspot']
    })
  })

  it('persists show-only and hide-only icon visibility actions', async () => {
    const { useUIStore, UI_PREFERENCES_STORAGE_KEY } = await import('../stores/useUIStore')

    useUIStore.getState().hideOnlySymbol('wandlamp')
    expect(JSON.parse(window.localStorage.getItem(UI_PREFERENCES_STORAGE_KEY) ?? '{}')).toEqual({
      showItemId: true,
      showGroup: true,
      showLabel: true,
      hiddenSymbolIds: ['wandlamp']
    })

    useUIStore.getState().showOnlySymbol('wandlamp')
    const persisted = JSON.parse(window.localStorage.getItem(UI_PREFERENCES_STORAGE_KEY) ?? '{}')
    expect(persisted.hiddenSymbolIds).not.toContain('wandlamp')
    expect(persisted.hiddenSymbolIds.length).toBeGreaterThan(0)
  })
})
