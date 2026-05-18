import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ContextMenu } from '../components/ContextMenu'
import {
  DIAGRAM_LINE_EQUAL_LENGTH_LABEL,
  DIAGRAM_LINE_SYMBOL_ID
} from '../components/diagramLine'
import { useProjectStore } from '../stores/useProjectStore'
import { useUIStore } from '../stores/useUIStore'
import type { Project } from '../types/project'

function createProject(symbolId: string): Project {
  return {
    id: 'project-1',
    name: 'Test project',
    createdAt: '2026-05-18T00:00:00.000Z',
    updatedAt: '2026-05-18T00:00:00.000Z',
    floors: [
      {
        id: 'floor-1',
        name: 'Begane grond',
        floorPlanImage: null,
        order: 0,
        symbols: [
          {
            id: 'symbol-1',
            symbolId,
            x: 100,
            y: 100,
            rotation: 0,
            diagramLine:
              symbolId === DIAGRAM_LINE_SYMBOL_ID
                ? { endX: 120, endY: 0, type: 'straight' }
                : undefined
          }
        ]
      }
    ]
  }
}

describe('ContextMenu', () => {
  beforeEach(() => {
    useProjectStore.getState().setProject(createProject(DIAGRAM_LINE_SYMBOL_ID))
    useUIStore.getState().setContextMenu({ x: 10, y: 20, symbolId: 'symbol-1' })
  })

  it('sets the equal-length label on diagram lines', () => {
    render(<ContextMenu />)

    fireEvent.click(screen.getByRole('button', { name: `Label ${DIAGRAM_LINE_EQUAL_LENGTH_LABEL}` }))

    const symbol = useProjectStore
      .getState()
      .project.floors[0].symbols.find((item) => item.id === 'symbol-1')

    expect(symbol?.label).toBe(DIAGRAM_LINE_EQUAL_LENGTH_LABEL)
    expect(useUIStore.getState().contextMenu).toBeNull()
  })

  it('does not show the equal-length label action for regular symbols', () => {
    useProjectStore.getState().setProject(createProject('lichtpunt-plafond'))

    render(<ContextMenu />)

    expect(
      screen.queryByRole('button', { name: `Label ${DIAGRAM_LINE_EQUAL_LENGTH_LABEL}` })
    ).not.toBeInTheDocument()
  })
})
