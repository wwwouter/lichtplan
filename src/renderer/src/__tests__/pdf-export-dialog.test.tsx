import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PdfExportDialog } from '../components/PdfExportDialog'
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

    expect(screen.getByLabelText('Begane grond')).toBeChecked()
    expect(screen.getByLabelText('1e Verdieping')).not.toBeChecked()

    fireEvent.click(screen.getByRole('button', { name: 'Alles' }))
    fireEvent.click(screen.getByLabelText('Legenda toevoegen'))
    fireEvent.click(screen.getByRole('button', { name: 'Exporteren' }))

    expect(onExport).toHaveBeenCalledWith(['floor-1', 'floor-2'], true, 'best-fit')
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

    expect(onExport).toHaveBeenCalledWith(['floor-1'], false, 'landscape')
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

    fireEvent.click(screen.getByLabelText('Begane grond'))

    expect(screen.getByRole('button', { name: 'Exporteren' })).toBeDisabled()
  })
})
