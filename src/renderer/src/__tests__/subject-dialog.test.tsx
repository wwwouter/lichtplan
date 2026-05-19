import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { SubjectDialog } from '../components/SubjectDialog'
import { useProjectStore } from '../stores/useProjectStore'
import { useUIStore } from '../stores/useUIStore'
import type { Project } from '../types/project'

const project: Project = {
  id: 'project-1',
  name: 'Test project',
  createdAt: '2026-05-19T00:00:00.000Z',
  updatedAt: '2026-05-19T00:00:00.000Z',
  floors: [
    {
      id: 'floor-1',
      name: 'Begane grond',
      floorPlanImage: null,
      order: 0,
      symbols: [
        {
          id: 'symbol-1',
          symbolId: 'inbouwspot',
          x: 0,
          y: 0,
          rotation: 0
        },
        {
          id: 'symbol-2',
          symbolId: 'cat6a-contactdoos',
          x: 0,
          y: 0,
          rotation: 0,
          subject: 'beamer'
        }
      ]
    },
    {
      id: 'floor-2',
      name: 'Tuin',
      floorPlanImage: null,
      order: 1,
      symbols: [
        {
          id: 'symbol-3',
          symbolId: 'cat6a-contactdoos',
          x: 0,
          y: 0,
          rotation: 0,
          subject: 'cameras'
        }
      ]
    }
  ]
}

describe('SubjectDialog', () => {
  beforeEach(() => {
    useProjectStore.getState().setProject(project)
    useUIStore.getState().setSubjectDialog({
      symbolId: 'symbol-1',
      currentSubject: ''
    })
  })

  it('offers existing subjects as autocomplete values', () => {
    const { container } = render(<SubjectDialog />)
    const input = screen.getByPlaceholderText('bijv. beamer, cameras')

    expect(input).toHaveAttribute('list', 'subject-options')
    expect(
      Array.from(container.querySelectorAll('datalist option')).map(
        (option) => (option as HTMLOptionElement).value
      )
    ).toEqual(['beamer', 'cameras'])
  })

  it('still allows saving a new subject value', () => {
    render(<SubjectDialog />)

    fireEvent.change(screen.getByPlaceholderText('bijv. beamer, cameras'), {
      target: { value: 'audio' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Opslaan' }))

    const symbol = useProjectStore
      .getState()
      .project.floors[0].symbols.find((item) => item.id === 'symbol-1')
    expect(symbol?.subject).toBe('audio')
  })
})
