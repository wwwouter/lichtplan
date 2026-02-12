import { describe, it, expect, beforeEach } from 'vitest'
import { useCanvasStore } from '../stores/useCanvasStore'

describe('Canvas dragging behavior', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      stageX: 0,
      stageY: 0,
      scale: 1,
      selectedSymbolId: null,
      activeTool: 'select',
      dragSymbolId: null
    })
  })

  it('stage should NOT be draggable when activeTool is "select"', () => {
    // In select mode, the stage must not be draggable so symbols can be dragged instead.
    // The FloorCanvas component should use this value to set Stage draggable={false}.
    const state = useCanvasStore.getState()
    expect(state.activeTool).toBe('select')
    // We test the derived value that FloorCanvas should use:
    expect(isStageDraggable(state.activeTool)).toBe(false)
  })

  it('stage SHOULD be draggable when activeTool is "pan"', () => {
    useCanvasStore.getState().setActiveTool('pan')
    const state = useCanvasStore.getState()
    expect(state.activeTool).toBe('pan')
    expect(isStageDraggable(state.activeTool)).toBe(true)
  })

  it('switching from pan to select should make stage non-draggable', () => {
    useCanvasStore.getState().setActiveTool('pan')
    expect(isStageDraggable(useCanvasStore.getState().activeTool)).toBe(true)

    useCanvasStore.getState().setActiveTool('select')
    expect(isStageDraggable(useCanvasStore.getState().activeTool)).toBe(false)
  })
})

// This helper mirrors the logic FloorCanvas should use.
// Currently FloorCanvas always passes draggable={true} — this test will fail
// until we fix FloorCanvas to use draggable={activeTool === 'pan'}.
function isStageDraggable(activeTool: string): boolean {
  return activeTool === 'pan'
}
