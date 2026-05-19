import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FloorPlanScaleDialog } from '../components/FloorPlanScaleDialog'
import type { FloorPlanImage } from '../types/project'

const image: FloorPlanImage = {
  data: 'data:image/png;base64,image-data',
  width: 100,
  height: 80,
  fileName: 'plattegrond.png',
  grayscale: false
}

describe('FloorPlanScaleDialog', () => {
  it('shows the resized dimensions and confirms the percentage', () => {
    const onScale = vi.fn()

    render(<FloorPlanScaleDialog image={image} onCancel={vi.fn()} onScale={onScale} />)

    expect(screen.getByText('100 x 80px -> 100 x 80px')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Percentage'), { target: { value: '150' } })

    expect(screen.getByText('100 x 80px -> 150 x 120px')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Schalen' }))

    expect(onScale).toHaveBeenCalledWith(150)
  })

  it('blocks invalid percentages', () => {
    const onScale = vi.fn()

    render(<FloorPlanScaleDialog image={image} onCancel={vi.fn()} onScale={onScale} />)

    fireEvent.change(screen.getByLabelText('Percentage'), { target: { value: '0' } })

    expect(screen.getByText('Voer een percentage in tussen 1 en 1000.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Schalen' })).toBeDisabled()
  })

  it('cancels with Escape', () => {
    const onCancel = vi.fn()

    render(<FloorPlanScaleDialog image={image} onCancel={onCancel} onScale={vi.fn()} />)

    fireEvent.keyDown(screen.getByLabelText('Percentage'), { key: 'Escape' })

    expect(onCancel).toHaveBeenCalled()
  })
})
