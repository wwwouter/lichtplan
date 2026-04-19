import { describe, it, expect, beforeEach } from 'vitest'
import { useCanvasStore } from '../stores/useCanvasStore'

describe('Canvas dragging behavior', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      stageX: 0,
      stageY: 0,
      scale: 1,
      selectedSymbolId: null,
      dragSymbolId: null
    })
  })

  it('stage should never be draggable', () => {
    const state = useCanvasStore.getState()
    expect(state).not.toHaveProperty('activeTool')
  })
})
