import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PdfExportDialog } from '../components/PdfExportDialog'
import { CURRENT_VISIBILITY_EXPORT_PROFILE_ID } from '../services/pdfExportProfiles'
import type { Floor } from '../types/project'

const floors: Floor[] = [
  {
    id: 'floor-1',
    name: 'Begane grond',
    floorPlanImage: null,
    order: 0,
    symbols: []
  },
  {
    id: 'floor-2',
    name: '1e Verdieping',
    floorPlanImage: null,
    order: 1,
    symbols: []
  }
]

describe('PdfExportDialog', () => {
  it('exports the selected floors, legend preference and default page orientation', () => {
    const onExport = vi.fn()

    render(
      <PdfExportDialog
        floors={floors}
        activeFloorId="floor-1"
        isExporting={false}
        onCancel={vi.fn()}
        onExport={onExport}
      />
    )

    expect(screen.getAllByLabelText('Huidige zichtbaarheid')[0]).toBeChecked()
    expect(screen.getAllByLabelText('Huidige zichtbaarheid')[1]).not.toBeChecked()

    fireEvent.click(screen.getByRole('button', { name: 'Alles' }))
    fireEvent.click(screen.getByLabelText('Legenda toevoegen'))
    fireEvent.click(screen.getByRole('button', { name: 'Exporteren' }))

    expect(onExport).toHaveBeenCalledWith(
      [
        { floorId: 'floor-1', profileId: CURRENT_VISIBILITY_EXPORT_PROFILE_ID },
        { floorId: 'floor-2', profileId: CURRENT_VISIBILITY_EXPORT_PROFILE_ID }
      ],
      true,
      'best-fit',
      'a2',
      200
    )
  })

  it('exports the selected page orientation', () => {
    const onExport = vi.fn()

    render(
      <PdfExportDialog
        floors={floors}
        activeFloorId="floor-1"
        isExporting={false}
        onCancel={vi.fn()}
        onExport={onExport}
      />
    )

    fireEvent.click(screen.getByLabelText('Liggend'))
    fireEvent.click(screen.getByRole('button', { name: 'Exporteren' }))

    expect(onExport).toHaveBeenCalledWith(
      [{ floorId: 'floor-1', profileId: CURRENT_VISIBILITY_EXPORT_PROFILE_ID }],
      false,
      'landscape',
      'a2',
      200
    )
  })

  it('exports the selected paper size and DPI', () => {
    const onExport = vi.fn()

    render(
      <PdfExportDialog
        floors={floors}
        activeFloorId="floor-1"
        isExporting={false}
        onCancel={vi.fn()}
        onExport={onExport}
      />
    )

    fireEvent.change(screen.getByLabelText('Papierformaat'), { target: { value: 'a1' } })
    fireEvent.change(screen.getByLabelText('Resolutie'), { target: { value: '300' } })
    fireEvent.click(screen.getByRole('button', { name: 'Exporteren' }))

    expect(onExport).toHaveBeenCalledWith(
      [{ floorId: 'floor-1', profileId: CURRENT_VISIBILITY_EXPORT_PROFILE_ID }],
      false,
      'best-fit',
      'a1',
      300
    )
  })

  it('requires at least one floor before exporting', () => {
    render(
      <PdfExportDialog
        floors={floors}
        activeFloorId="floor-1"
        isExporting={false}
        onCancel={vi.fn()}
        onExport={vi.fn()}
      />
    )

    fireEvent.click(screen.getAllByLabelText('Huidige zichtbaarheid')[0])

    expect(screen.getByRole('button', { name: 'Exporteren' })).toBeDisabled()
  })

  it('exports multiple visibility profiles for one floor', () => {
    const onExport = vi.fn()

    render(
      <PdfExportDialog
        floors={floors}
        activeFloorId="floor-1"
        isExporting={false}
        onCancel={vi.fn()}
        onExport={onExport}
      />
    )

    fireEvent.click(screen.getAllByLabelText('Lampen + schakelaars')[0])
    fireEvent.click(screen.getByRole('button', { name: 'Exporteren' }))

    expect(onExport).toHaveBeenCalledWith(
      [
        { floorId: 'floor-1', profileId: CURRENT_VISIBILITY_EXPORT_PROFILE_ID },
        { floorId: 'floor-1', profileId: 'lighting-switches' }
      ],
      false,
      'best-fit',
      'a2',
      200
    )
  })

  it('creates custom export profiles from selected symbol types', () => {
    const onAddProfile = vi.fn().mockReturnValue('custom-profile')

    render(
      <PdfExportDialog
        floors={floors}
        activeFloorId="floor-1"
        isExporting={false}
        onCancel={vi.fn()}
        onAddProfile={onAddProfile}
        onExport={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText('Profielnaam'), { target: { value: 'Beamer extra' } })
    fireEvent.click(screen.getByLabelText('12V lasdoos'))
    fireEvent.click(screen.getByRole('button', { name: 'Profiel toevoegen' }))

    expect(onAddProfile).toHaveBeenCalledWith({
      name: 'Beamer extra',
      symbolIds: ['12v-lasdoos']
    })
  })
})
