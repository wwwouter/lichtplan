import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PdfProfilesDialog } from '../components/PdfProfilesDialog'
import { createDefaultExportProfiles } from '../services/pdfExportProfiles'
import type { Floor } from '../types/project'

const floors: Floor[] = [
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
        rotation: 0,
        subject: 'beamer'
      },
      {
        id: 'symbol-2',
        symbolId: 'cat6a-contactdoos',
        x: 0,
        y: 0,
        rotation: 0,
        subject: 'cameras'
      }
    ]
  }
]

describe('PdfProfilesDialog', () => {
  it('creates a subject based export profile', () => {
    const onAddProfile = vi.fn()

    render(
      <PdfProfilesDialog
        floors={floors}
        onCancel={vi.fn()}
        onAddProfile={onAddProfile}
        onUpdateProfile={vi.fn()}
        onRemoveProfile={vi.fn()}
      />
    )

    expect(screen.getByLabelText('Profielnaam')).toBeRequired()
    fireEvent.change(screen.getByLabelText('Profielnaam'), { target: { value: 'Beamer' } })
    fireEvent.click(screen.getByLabelText('beamer'))
    fireEvent.click(screen.getByRole('button', { name: 'Profiel toevoegen' }))

    expect(onAddProfile).toHaveBeenCalledWith({
      name: 'Beamer',
      rules: [
        expect.objectContaining({
          field: 'subject',
          operator: 'is',
          values: ['beamer']
        })
      ]
    })
  })

  it('creates an AND profile with type and subject exclusion rules', () => {
    const onAddProfile = vi.fn()

    render(
      <PdfProfilesDialog
        floors={floors}
        onCancel={vi.fn()}
        onAddProfile={onAddProfile}
        onUpdateProfile={vi.fn()}
        onRemoveProfile={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText('Profielnaam'), { target: { value: 'Verlichting' } })
    fireEvent.change(screen.getByLabelText('Veld regel 1'), { target: { value: 'symbolId' } })
    fireEvent.click(screen.getByLabelText('Inbouwspot'))
    fireEvent.click(screen.getByLabelText('Dimmer'))

    fireEvent.click(screen.getByRole('button', { name: 'Regel toevoegen' }))
    fireEvent.change(screen.getByLabelText('Operator regel 2'), {
      target: { value: 'is-not' }
    })
    fireEvent.click(screen.getByLabelText('beamer'))

    fireEvent.click(screen.getByRole('button', { name: 'Profiel toevoegen' }))

    expect(onAddProfile).toHaveBeenCalledWith({
      name: 'Verlichting',
      rules: [
        expect.objectContaining({
          field: 'symbolId',
          operator: 'is',
          values: ['inbouwspot', 'dimmer']
        }),
        expect.objectContaining({
          field: 'subject',
          operator: 'is-not',
          values: ['beamer']
        })
      ]
    })
  })

  it('allows removing default project profiles', () => {
    const onRemoveProfile = vi.fn()

    render(
      <PdfProfilesDialog
        floors={floors}
        exportProfiles={createDefaultExportProfiles()}
        onCancel={vi.fn()}
        onAddProfile={vi.fn()}
        onUpdateProfile={vi.fn()}
        onRemoveProfile={onRemoveProfile}
      />
    )

    const removeButtons = screen.getAllByTitle('Profiel verwijderen')
    fireEvent.click(removeButtons[0])

    expect(onRemoveProfile).toHaveBeenCalledWith('lighting-switches')
  })

  it('loads a clicked profile into the edit form and saves updates', () => {
    const onUpdateProfile = vi.fn()

    render(
      <PdfProfilesDialog
        floors={floors}
        exportProfiles={createDefaultExportProfiles()}
        onCancel={vi.fn()}
        onAddProfile={vi.fn()}
        onUpdateProfile={onUpdateProfile}
        onRemoveProfile={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText('WCD'))
    expect(screen.getByRole('button', { name: 'Profiel opslaan' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Profielnaam'), {
      target: { value: 'WCD aangepast' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Profiel opslaan' }))

    expect(onUpdateProfile).toHaveBeenCalledWith(
      'wcd',
      expect.objectContaining({
        name: 'WCD aangepast',
        rules: [
          expect.objectContaining({
            field: 'symbolId',
            operator: 'is',
            values: ['geaard-stopcontact', 'dubbel-geaard-stopcontact']
          }),
          expect.objectContaining({
            field: 'subject',
            operator: 'is-not',
            values: ['beamer']
          })
        ]
      })
    )
  })

  it('saves a valid profile with cmd enter', () => {
    const onAddProfile = vi.fn()

    render(
      <PdfProfilesDialog
        floors={floors}
        onCancel={vi.fn()}
        onAddProfile={onAddProfile}
        onUpdateProfile={vi.fn()}
        onRemoveProfile={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText('Profielnaam'), { target: { value: 'Beamer' } })
    fireEvent.click(screen.getByLabelText('beamer'))
    fireEvent.keyDown(screen.getByLabelText('Profielnaam'), {
      key: 'Enter',
      metaKey: true
    })

    expect(onAddProfile).toHaveBeenCalledWith({
      name: 'Beamer',
      rules: [
        expect.objectContaining({
          field: 'subject',
          operator: 'is',
          values: ['beamer']
        })
      ]
    })
  })
})
