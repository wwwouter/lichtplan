import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from '../stores/useProjectStore'

describe('Undo/Redo capability', () => {
  beforeEach(() => {
    // Reset to a fresh project
    useProjectStore.getState().newProject()
  })

  it('store should expose undo and redo methods', () => {
    const state = useProjectStore.getState()
    expect(typeof state.undo).toBe('function')
    expect(typeof state.redo).toBe('function')
  })

  it('store should expose canUndo and canRedo state', () => {
    const state = useProjectStore.getState()
    expect(typeof state.canUndo).toBe('boolean')
    expect(typeof state.canRedo).toBe('boolean')
  })

  it('canUndo should be false initially', () => {
    expect(useProjectStore.getState().canUndo).toBe(false)
  })

  it('canUndo should be true after adding a symbol', () => {
    const state = useProjectStore.getState()
    const floorId = state.activeFloorId

    state.addSymbol(floorId, {
      id: 'test-sym-1',
      symbolId: 'lichtpunt-plafond',
      x: 100,
      y: 200,
      rotation: 0
    })

    expect(useProjectStore.getState().canUndo).toBe(true)
  })

  it('undo should reverse the last addSymbol', () => {
    const state = useProjectStore.getState()
    const floorId = state.activeFloorId

    state.addSymbol(floorId, {
      id: 'test-sym-1',
      symbolId: 'lichtpunt-plafond',
      x: 100,
      y: 200,
      rotation: 0
    })

    const floor = useProjectStore.getState().project.floors.find((f) => f.id === floorId)!
    expect(floor.symbols).toHaveLength(1)

    useProjectStore.getState().undo()

    const floorAfterUndo = useProjectStore.getState().project.floors.find((f) => f.id === floorId)!
    expect(floorAfterUndo.symbols).toHaveLength(0)
  })

  it('redo should re-apply the undone action', () => {
    const state = useProjectStore.getState()
    const floorId = state.activeFloorId

    state.addSymbol(floorId, {
      id: 'test-sym-1',
      symbolId: 'lichtpunt-plafond',
      x: 100,
      y: 200,
      rotation: 0
    })

    useProjectStore.getState().undo()
    const afterUndo = useProjectStore.getState().project.floors.find((f) => f.id === floorId)!
    expect(afterUndo.symbols).toHaveLength(0)

    useProjectStore.getState().redo()
    const afterRedo = useProjectStore.getState().project.floors.find((f) => f.id === floorId)!
    expect(afterRedo.symbols).toHaveLength(1)
  })

  it('canRedo should be false initially', () => {
    expect(useProjectStore.getState().canRedo).toBe(false)
  })

  it('canRedo should be true after an undo', () => {
    const state = useProjectStore.getState()
    const floorId = state.activeFloorId

    state.addSymbol(floorId, {
      id: 'test-sym-1',
      symbolId: 'lichtpunt-plafond',
      x: 100,
      y: 200,
      rotation: 0
    })

    useProjectStore.getState().undo()
    expect(useProjectStore.getState().canRedo).toBe(true)
  })

  it('redo stack should be cleared after a new action', () => {
    const state = useProjectStore.getState()
    const floorId = state.activeFloorId

    state.addSymbol(floorId, {
      id: 'test-sym-1',
      symbolId: 'lichtpunt-plafond',
      x: 100,
      y: 200,
      rotation: 0
    })

    useProjectStore.getState().undo()
    expect(useProjectStore.getState().canRedo).toBe(true)

    // New action should clear redo stack
    useProjectStore.getState().addSymbol(floorId, {
      id: 'test-sym-2',
      symbolId: 'wandlamp',
      x: 300,
      y: 400,
      rotation: 0
    })
    expect(useProjectStore.getState().canRedo).toBe(false)
  })

  it('undo should work for removeSymbol', () => {
    const state = useProjectStore.getState()
    const floorId = state.activeFloorId

    state.addSymbol(floorId, {
      id: 'test-sym-1',
      symbolId: 'lichtpunt-plafond',
      x: 100,
      y: 200,
      rotation: 0
    })

    useProjectStore.getState().removeSymbol(floorId, 'test-sym-1')
    const afterRemove = useProjectStore.getState().project.floors.find((f) => f.id === floorId)!
    expect(afterRemove.symbols).toHaveLength(0)

    useProjectStore.getState().undo()
    const afterUndo = useProjectStore.getState().project.floors.find((f) => f.id === floorId)!
    expect(afterUndo.symbols).toHaveLength(1)
    expect(afterUndo.symbols[0].id).toBe('test-sym-1')
  })

  it('undo should work for updateSymbol (move)', () => {
    const state = useProjectStore.getState()
    const floorId = state.activeFloorId

    state.addSymbol(floorId, {
      id: 'test-sym-1',
      symbolId: 'lichtpunt-plafond',
      x: 100,
      y: 200,
      rotation: 0
    })

    useProjectStore.getState().updateSymbol(floorId, 'test-sym-1', { x: 500, y: 600 })
    const afterMove = useProjectStore.getState().project.floors.find((f) => f.id === floorId)!
    expect(afterMove.symbols[0].x).toBe(500)

    useProjectStore.getState().undo()
    const afterUndo = useProjectStore.getState().project.floors.find((f) => f.id === floorId)!
    expect(afterUndo.symbols[0].x).toBe(100)
    expect(afterUndo.symbols[0].y).toBe(200)
  })
})
