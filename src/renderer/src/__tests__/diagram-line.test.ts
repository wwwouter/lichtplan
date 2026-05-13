import { beforeEach, describe, expect, it } from 'vitest'
import { ALL_SYMBOLS } from '../symbols'
import type { PlacedSymbol } from '../types/project'
import { useProjectStore } from '../stores/useProjectStore'
import {
  createDiagramLineSymbol,
  DEFAULT_DIAGRAM_LINE,
  DIAGRAM_LINE_SYMBOL_ID,
  getDiagramLine,
  getDiagramLineBounds,
  getDiagramLineDash,
  getDiagramLineMidpoint,
  moveDiagramLineEnd,
  moveDiagramLineStart
} from '../components/diagramLine'

describe('diagram line symbol', () => {
  beforeEach(() => {
    useProjectStore.getState().newProject()
  })

  it('is available as an Overig palette symbol', () => {
    const symbol = ALL_SYMBOLS.find((item) => item.id === DIAGRAM_LINE_SYMBOL_ID)

    expect(symbol?.name).toBe('Lijn')
    expect(symbol?.category).toBe('Overig')
  })

  it('falls back to a usable default line when old projects do not have line data', () => {
    expect(getDiagramLine({})).toEqual(DEFAULT_DIAGRAM_LINE)
  })

  it('creates a line between two clicked points', () => {
    expect(
      createDiagramLineSymbol('line-1', { x: 25, y: 40 }, { x: 90, y: 10 })
    ).toMatchObject({
      id: 'line-1',
      symbolId: DIAGRAM_LINE_SYMBOL_ID,
      x: 25,
      y: 40,
      rotation: 0,
      diagramLine: {
        endX: 65,
        endY: -30,
        type: 'straight'
      }
    })
  })

  it('does not assign item IDs to newly placed lines', () => {
    const floorId = useProjectStore.getState().activeFloorId
    useProjectStore
      .getState()
      .addSymbol(floorId, createDiagramLineSymbol('line-1', { x: 25, y: 40 }, { x: 90, y: 10 }))

    const floor = useProjectStore.getState().project.floors.find((item) => item.id === floorId)!
    expect(floor.symbols[0].itemId).toBeUndefined()
  })

  it('strips item IDs from lines when opening existing projects', () => {
    const floorId = 'floor-1'
    useProjectStore.getState().setProject({
      id: 'project-1',
      name: 'Project',
      createdAt: '2026-05-13T00:00:00.000Z',
      updatedAt: '2026-05-13T00:00:00.000Z',
      floors: [
        {
          id: floorId,
          name: 'Begane grond',
          floorPlanImage: null,
          order: 0,
          symbols: [
            {
              ...createDiagramLineSymbol('line-1', { x: 0, y: 0 }, { x: 20, y: 0 }),
              itemId: '001'
            },
            {
              id: 'lamp-1',
              symbolId: 'lichtpunt-plafond',
              x: 40,
              y: 40,
              rotation: 0
            }
          ]
        }
      ]
    })

    const symbols = useProjectStore.getState().project.floors[0].symbols
    expect(symbols[0].itemId).toBeUndefined()
    expect(symbols[1].itemId).toBe('001')
  })

  it('keeps duplicated lines without item IDs', () => {
    const floorId = useProjectStore.getState().activeFloorId
    useProjectStore
      .getState()
      .addSymbol(floorId, createDiagramLineSymbol('line-1', { x: 25, y: 40 }, { x: 90, y: 10 }))

    const duplicateId = useProjectStore.getState().duplicateSymbol(floorId, 'line-1')
    const floor = useProjectStore.getState().project.floors.find((item) => item.id === floorId)!
    const duplicate = floor.symbols.find((item) => item.id === duplicateId)

    expect(duplicate?.itemId).toBeUndefined()
  })

  it('places the label anchor in the middle of the line', () => {
    expect(getDiagramLineMidpoint({ endX: 160, endY: 40 })).toEqual({ x: 80, y: 20 })
  })

  it('uses a dash pattern only for dotted lines', () => {
    expect(getDiagramLineDash({ type: 'straight' })).toBeUndefined()
    expect(getDiagramLineDash({ type: 'dotted' })).toEqual([4, 5])
  })

  it('keeps the visual end fixed when moving the start handle', () => {
    const symbol: Pick<PlacedSymbol, 'x' | 'y'> = { x: 100, y: 200 }
    const update = moveDiagramLineStart(symbol, DEFAULT_DIAGRAM_LINE, { x: 20, y: 10 })

    expect(update.x).toBe(120)
    expect(update.y).toBe(210)
    expect(update.diagramLine!.endX).toBe(100)
    expect(update.diagramLine!.endY).toBe(-10)
  })

  it('updates only the relative end point when moving the end handle', () => {
    const update = moveDiagramLineEnd(DEFAULT_DIAGRAM_LINE, { x: 80, y: 30 })

    expect(update.diagramLine).toEqual({ ...DEFAULT_DIAGRAM_LINE, endX: 80, endY: 30 })
  })

  it('builds a hit area around negative line directions', () => {
    expect(getDiagramLineBounds({ endX: -40, endY: 20 }, 5)).toEqual({
      x: -45,
      y: -5,
      width: 50,
      height: 30
    })
  })
})
