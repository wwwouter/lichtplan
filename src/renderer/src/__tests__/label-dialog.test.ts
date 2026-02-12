import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '../stores/useUIStore'

describe('Label dialog state', () => {
  beforeEach(() => {
    useUIStore.setState({
      labelDialog: null
    })
  })

  it('store should expose labelDialog state', () => {
    const state = useUIStore.getState()
    expect(state.labelDialog).toBeNull()
  })

  it('store should expose setLabelDialog method', () => {
    expect(typeof useUIStore.getState().setLabelDialog).toBe('function')
  })

  it('setLabelDialog should open dialog with symbolId and current label', () => {
    useUIStore.getState().setLabelDialog({ symbolId: 'sym-1', currentLabel: 'Lamp' })
    const state = useUIStore.getState()
    expect(state.labelDialog).toEqual({ symbolId: 'sym-1', currentLabel: 'Lamp' })
  })

  it('setLabelDialog(null) should close the dialog', () => {
    useUIStore.getState().setLabelDialog({ symbolId: 'sym-1', currentLabel: '' })
    useUIStore.getState().setLabelDialog(null)
    expect(useUIStore.getState().labelDialog).toBeNull()
  })
})
