import { describe, expect, it } from 'vitest'
import { formatSymbolTooltipText, getSymbolTooltipRows } from '../components/symbolTooltip'

describe('symbol tooltip details', () => {
  it('shows both contractor-facing fields when either value exists', () => {
    expect(getSymbolTooltipRows({ location: 'Keukenwand', description: '' })).toEqual([
      { label: 'Locatie', value: 'Keukenwand' },
      { label: 'Omschrijving', value: '-' }
    ])
  })

  it('formats location and description for hover display', () => {
    expect(
      formatSymbolTooltipText({
        location: 'Naast deur',
        description: 'Dimmer voor spots'
      })
    ).toBe('Locatie: Naast deur\nOmschrijving: Dimmer voor spots')
  })

  it('places multiline values under their field label', () => {
    expect(
      formatSymbolTooltipText({
        location: 'Keuken\r\nOnder bovenkast',
        description: 'Stopcontact'
      })
    ).toBe('Locatie:\nKeuken\nOnder bovenkast\nOmschrijving: Stopcontact')
  })

  it('does not show a tooltip for symbols without details', () => {
    expect(formatSymbolTooltipText({})).toBeNull()
  })
})
