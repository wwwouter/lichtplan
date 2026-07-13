import { describe, expect, it } from 'vitest'
import { computeSmartLabelLayout, getSymbolLabelText } from '../components/labelLayout'

describe('smart label layout', () => {
  it('includes location in the visible ID and label block', () => {
    expect(
      getSymbolLabelText(
        {
          itemId: '023',
          label: 'Wandlamp',
          location: 'Naast deur\nBoven kast'
        },
        true,
        true
      )
    ).toBe('[023]\nWandlamp\nNaast deur\nBoven kast')
  })

  it('shows location without an ID when label visibility is enabled', () => {
    expect(
      getSymbolLabelText(
        {
          location: 'Keukenwand'
        },
        false,
        true
      )
    ).toBe('Keukenwand')
  })

  it('keeps location hidden when label visibility is disabled', () => {
    expect(
      getSymbolLabelText(
        {
          itemId: '023',
          label: 'Wandlamp',
          location: 'Keukenwand'
        },
        true,
        false
      )
    ).toBe('[023]')
  })

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

  it('nudges clustered descriptive labels apart', () => {
    const layout = computeSmartLabelLayout(
      [
        {
          id: 'a',
          symbolId: 'aansluitpunt',
          x: 100,
          y: 100,
          width: 16,
          height: 16,
          label: 'Laadpaal 2',
          category: 'Overig'
        },
        {
          id: 'b',
          symbolId: 'aansluitpunt',
          x: 112,
          y: 104,
          width: 16,
          height: 16,
          label: 'Laadpaal 1',
          category: 'Overig'
        },
        {
          id: 'c',
          symbolId: 'aansluitpunt',
          x: 124,
          y: 108,
          width: 16,
          height: 16,
          label: 'Data',
          category: 'Overig'
        }
      ],
      false,
      true
    )

    expect([layout.get('a'), layout.get('b'), layout.get('c')].some((item) => item?.moved)).toBe(
      true
    )
  })

  it('keeps moved descriptive labels far enough from their icon for a leader line', () => {
    const layout = computeSmartLabelLayout(
      [
        {
          id: 'a',
          symbolId: 'cat6a-contactdoos',
          x: 100,
          y: 100,
          width: 12,
          height: 12,
          label: '2 poorten naar kelder',
          category: 'Elektra',
          detailScale: 0.5
        },
        {
          id: 'b',
          symbolId: 'cat6a-contactdoos',
          x: 106,
          y: 100,
          width: 12,
          height: 12,
          label: 'Naar beamer',
          category: 'Elektra',
          detailScale: 0.5
        },
        {
          id: 'c',
          symbolId: 'aansluitpunt',
          x: 112,
          y: 100,
          width: 8,
          height: 8,
          label: 'HDMI naar beamer',
          category: 'Overig',
          detailScale: 0.5
        }
      ],
      false,
      true
    )

    const movedLayouts = ['a', 'b', 'c'].map((id) => layout.get(id)).filter((item) => item?.moved)

    expect(movedLayouts.length).toBeGreaterThan(0)
    expect(movedLayouts.some((item) => Math.abs(item?.offsetY ?? 0) >= 4)).toBe(true)
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
