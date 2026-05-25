import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PDF_EXPORT_PREFERENCES_STORAGE_KEY,
  PdfExportDialog
} from '../components/PdfExportDialog'
import {
  CURRENT_VISIBILITY_EXPORT_PROFILE_ID,
  createDefaultExportProfiles
} from '../services/pdfExportProfiles'
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
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('exports the selected floors, legend preference and default page orientation', () => {
    const onExport = vi.fn()

    render(
      <PdfExportDialog
        floors={floors}
        activeFloorId="floor-1"
        exportProfiles={createDefaultExportProfiles()}
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
      'a1',
      200
    )
  })

  it('exports the selected page orientation', () => {
    const onExport = vi.fn()

    render(
      <PdfExportDialog
        floors={floors}
        activeFloorId="floor-1"
        exportProfiles={createDefaultExportProfiles()}
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
      'a1',
      200
    )
  })

  it('exports the selected paper size and DPI', () => {
    const onExport = vi.fn()

    render(
      <PdfExportDialog
        floors={floors}
        activeFloorId="floor-1"
        exportProfiles={createDefaultExportProfiles()}
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
        exportProfiles={createDefaultExportProfiles()}
        isExporting={false}
        onCancel={vi.fn()}
        onExport={onExport}
      />
    )

    fireEvent.click(screen.getAllByLabelText('Verlichting')[0])
    fireEvent.click(screen.getByRole('button', { name: 'Exporteren' }))

    expect(onExport).toHaveBeenCalledWith(
      [
        { floorId: 'floor-1', profileId: CURRENT_VISIBILITY_EXPORT_PROFILE_ID },
        { floorId: 'floor-1', profileId: 'lighting-switches' }
      ],
      false,
      'best-fit',
      'a1',
      200
    )
  })

  it('remembers PDF export settings in browser storage', () => {
    const { unmount } = render(
      <PdfExportDialog
        floors={floors}
        activeFloorId="floor-1"
        exportProfiles={createDefaultExportProfiles()}
        isExporting={false}
        onCancel={vi.fn()}
        onExport={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Alles' }))
    fireEvent.click(screen.getAllByLabelText('Verlichting')[0])
    fireEvent.click(screen.getByLabelText('Liggend'))
    fireEvent.change(screen.getByLabelText('Papierformaat'), { target: { value: 'a2' } })
    fireEvent.change(screen.getByLabelText('Resolutie'), { target: { value: '300' } })
    fireEvent.click(screen.getByLabelText('Legenda toevoegen'))
    unmount()

    render(
      <PdfExportDialog
        floors={floors}
        activeFloorId="floor-1"
        exportProfiles={createDefaultExportProfiles()}
        isExporting={false}
        onCancel={vi.fn()}
        onExport={vi.fn()}
      />
    )

    expect(screen.getAllByLabelText('Huidige zichtbaarheid')[0]).toBeChecked()
    expect(screen.getAllByLabelText('Huidige zichtbaarheid')[1]).toBeChecked()
    expect(screen.getAllByLabelText('Verlichting')[0]).toBeChecked()
    expect(screen.getByLabelText('Liggend')).toBeChecked()
    expect(screen.getByLabelText('Papierformaat')).toHaveValue('a2')
    expect(screen.getByLabelText('Resolutie')).toHaveValue('300')
    expect(screen.getByLabelText('Legenda toevoegen')).toBeChecked()
  })

  it('ignores stale cached floor and profile selections', () => {
    window.localStorage.setItem(
      PDF_EXPORT_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        selectedProfileIdsByFloorId: {
          'deleted-floor': ['deleted-profile']
        },
        includeLegend: true,
        pageOrientation: 'portrait',
        paperSize: 'a2',
        dpi: 300
      })
    )

    render(
      <PdfExportDialog
        floors={floors}
        activeFloorId="floor-2"
        exportProfiles={createDefaultExportProfiles()}
        isExporting={false}
        onCancel={vi.fn()}
        onExport={vi.fn()}
      />
    )

    expect(screen.getAllByLabelText('Huidige zichtbaarheid')[0]).not.toBeChecked()
    expect(screen.getAllByLabelText('Huidige zichtbaarheid')[1]).toBeChecked()
    expect(screen.getByLabelText('Staand')).toBeChecked()
    expect(screen.getByLabelText('Papierformaat')).toHaveValue('a2')
    expect(screen.getByLabelText('Resolutie')).toHaveValue('300')
    expect(screen.getByLabelText('Legenda toevoegen')).toBeChecked()
  })
})
