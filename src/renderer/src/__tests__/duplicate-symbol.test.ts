import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from '../stores/useProjectStore'

describe('Duplicate symbol', () => {
  let floorId: string

  beforeEach(() => {
    useProjectStore.getState().newProject()
    floorId = useProjectStore.getState().activeFloorId

    useProjectStore.getState().addSymbol(floorId, {
      id: 'sym-1',
      symbolId: 'lichtpunt-plafond',
      x: 100,
      y: 200,
      rotation: 45,
      label: 'Lamp 1'
    })
  })

  it('store should expose a duplicateSymbol method', () => {
    expect(typeof useProjectStore.getState().duplicateSymbol).toBe('function')
  })

  it('should add a new symbol to the floor', () => {
    useProjectStore.getState().duplicateSymbol(floorId, 'sym-1')
    const floor = useProjectStore.getState().project.floors.find((f) => f.id === floorId)!
    expect(floor.symbols).toHaveLength(2)
  })

  it('duplicate should have the same symbolId, rotation, and label', () => {
    useProjectStore.getState().duplicateSymbol(floorId, 'sym-1')
    const floor = useProjectStore.getState().project.floors.find((f) => f.id === floorId)!
    const dup = floor.symbols.find((s) => s.id !== 'sym-1')!

    expect(dup.symbolId).toBe('lichtpunt-plafond')
    expect(dup.rotation).toBe(45)
    expect(dup.label).toBe('Lamp 1')
  })

  it('duplicate should be offset from the original', () => {
    useProjectStore.getState().duplicateSymbol(floorId, 'sym-1')
    const floor = useProjectStore.getState().project.floors.find((f) => f.id === floorId)!
    const dup = floor.symbols.find((s) => s.id !== 'sym-1')!

    expect(dup.x).not.toBe(100)
    expect(dup.y).not.toBe(200)
    // Should be offset by some amount (we'll use 30px)
    expect(dup.x).toBe(130)
    expect(dup.y).toBe(230)
  })

  it('duplicate should have a unique id', () => {
    useProjectStore.getState().duplicateSymbol(floorId, 'sym-1')
    const floor = useProjectStore.getState().project.floors.find((f) => f.id === floorId)!
    const ids = floor.symbols.map((s) => s.id)
    expect(new Set(ids).size).toBe(2)
  })

  it('duplicate should be undoable', () => {
    useProjectStore.getState().duplicateSymbol(floorId, 'sym-1')
    expect(useProjectStore.getState().project.floors.find((f) => f.id === floorId)!.symbols).toHaveLength(2)

    useProjectStore.getState().undo()
    expect(useProjectStore.getState().project.floors.find((f) => f.id === floorId)!.symbols).toHaveLength(1)
  })

  it('should do nothing if symbolId does not exist', () => {
    useProjectStore.getState().duplicateSymbol(floorId, 'nonexistent')
    const floor = useProjectStore.getState().project.floors.find((f) => f.id === floorId)!
    expect(floor.symbols).toHaveLength(1)
  })
})
