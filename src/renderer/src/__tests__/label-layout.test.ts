import { describe, expect, it } from 'vitest'
import { computeSmartLabelLayout } from '../components/labelLayout'

describe('smart label layout', () => {
  it('keeps isolated labels in their default position', () => {
    const layout = computeSmartLabelLayout(
      [
        {
          id: 'a',
          symbolId: 'enkelpolige-schakelaar',
          x: 100,
          y: 100,
          width: 26,
          height: 26,
          itemId: '001'
        }
      ],
      true,
      true
    )

    expect(layout.get('a')).toEqual({ offsetX: 0, offsetY: 0, moved: false })
  })

  it('nudges overlapping labels apart', () => {
    const layout = computeSmartLabelLayout(
      [
        {
          id: 'a',
          symbolId: 'enkelpolige-schakelaar',
          x: 100,
          y: 100,
          width: 26,
          height: 26,
          itemId: '001'
        },
        {
          id: 'b',
          symbolId: 'dimmer',
          x: 106,
          y: 100,
          width: 26,
          height: 26,
          itemId: '002'
        }
      ],
      true,
      true
    )

    expect(layout.get('a')?.moved || layout.get('b')?.moved).toBe(true)
  })

  it('keeps descriptive labels anchored near their symbol', () => {
    const layout = computeSmartLabelLayout(
      [
        {
          id: 'a',
          symbolId: 'aansluitpunt',
          x: 100,
          y: 100,
          width: 16,
          height: 16,
          itemId: '092',
          label: 'Uit meterkast',
          category: 'Overig'
        },
        {
          id: 'b',
          symbolId: 'enkelpolige-schakelaar',
          x: 104,
          y: 100,
          width: 26,
          height: 26,
          itemId: '093',
          category: 'Schakelaars'
        }
      ],
      true,
      true
    )

    expect(layout.get('a')).toEqual({ offsetX: 0, offsetY: 0, moved: false })
  })

  it('does not move a switch label over its own icon', () => {
    const layout = computeSmartLabelLayout(
      [
        {
          id: 'a',
          symbolId: 'enkelpolige-schakelaar',
          x: 100,
          y: 100,
          width: 26,
          height: 26,
          itemId: '001'
        },
        {
          id: 'b',
          symbolId: 'dimmer',
          x: 100,
          y: 116,
          width: 26,
          height: 26,
          itemId: '002'
        }
      ],
      true,
      true
    )

    expect(layout.get('a')).not.toEqual({ offsetX: 0, offsetY: -15, moved: true })
    expect(layout.get('b')).not.toEqual({ offsetX: 0, offsetY: -15, moved: true })
  })
})
