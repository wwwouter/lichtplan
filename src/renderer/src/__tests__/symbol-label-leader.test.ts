import { describe, expect, it } from 'vitest'
import { getLabelLeaderLineStyle, getLabelLeaderSegment } from '../components/symbolLabelLeader'

describe('symbol label leader lines', () => {
  it('uses a visible halo and darker foreground line', () => {
    expect(getLabelLeaderLineStyle(0.5)).toEqual({
      haloStroke: '#ffffff',
      haloStrokeWidth: 1.5,
      stroke: '#111827',
      strokeWidth: 0.675,
      opacity: 0.88
    })
  })

  it('connects vertically offset labels from icon edge center to label edge center', () => {
    expect(
      getLabelLeaderSegment({
        iconBox: { left: -5, top: -5, width: 10, height: 10 },
        labelBox: { left: -10, top: 20, width: 20, height: 10 }
      })
    ).toEqual({
      from: { x: 0, y: 5 },
      to: { x: 0, y: 20 }
    })
  })

  it('connects horizontally offset labels from icon edge center to label edge center', () => {
    expect(
      getLabelLeaderSegment({
        iconBox: { left: -5, top: -5, width: 10, height: 10 },
        labelBox: { left: 20, top: -10, width: 10, height: 20 }
      })
    ).toEqual({
      from: { x: 5, y: 0 },
      to: { x: 20, y: 0 }
    })
  })

  it('uses the middle of facing sides for diagonal labels', () => {
    expect(
      getLabelLeaderSegment({
        iconBox: { left: -5, top: -5, width: 10, height: 10 },
        labelBox: { left: 16, top: 10, width: 18, height: 12 }
      })
    ).toEqual({
      from: { x: 5, y: 0 },
      to: { x: 16, y: 16 }
    })
  })

  it('does not create a leader segment when both boxes have the same center', () => {
    expect(
      getLabelLeaderSegment({
        iconBox: { left: -5, top: -5, width: 10, height: 10 },
        labelBox: { left: -10, top: -10, width: 20, height: 20 }
      })
    ).toBeUndefined()
  })
})
