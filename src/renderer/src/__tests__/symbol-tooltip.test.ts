import { describe, expect, it } from 'vitest'
import { formatSymbolTooltipText, getSymbolTooltipRows } from '../components/symbolTooltip'

describe('symbol tooltip details', () => {
  it('only shows contractor-facing fields that have a value', () => {
    expect(getSymbolTooltipRows({ location: 'Keukenwand', description: '' })).toEqual([
      { label: 'Locatie', value: 'Keukenwand' }
    ])

    expect(getSymbolTooltipRows({ location: '', description: 'Dimmer voor spots' })).toEqual([
      { label: 'Omschrijving', value: 'Dimmer voor spots' }
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
