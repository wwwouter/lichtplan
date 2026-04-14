import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

const { mockPathRender } = vi.hoisted(() => ({
  mockPathRender: vi.fn(() => null)
}))

vi.mock('react-konva', () => ({
  Circle: () => null,
  Line: () => null,
  Arc: () => null,
  Rect: () => null,
  Text: () => null,
  Path: (props: Record<string, unknown>) => mockPathRender(props)
}))

import { SymbolRenderer } from '../components/SymbolRenderer'

describe('SymbolRenderer path offset', () => {
  beforeEach(() => {
    mockPathRender.mockClear()
  })

  it('should apply offset to path shapes like all other shape types', () => {
    const shapes = [
      { type: 'path' as const, data: 'M 5 10 A 8 8 0 0 1 25 10', stroke: '#8B5CF6', strokeWidth: 2 }
    ]

    render(<SymbolRenderer shapes={shapes} color="#8B5CF6" offsetX={15} offsetY={15} />)

    expect(mockPathRender).toHaveBeenCalledTimes(1)
    const props = mockPathRender.mock.calls[0][0]
    expect(props.x).toBe(-15)
    expect(props.y).toBe(-15)
  })
})
