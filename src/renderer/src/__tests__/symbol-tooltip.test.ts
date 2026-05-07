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

    expect(getSymbolTooltipRows({ question: 'Klopt deze plek?' })).toEqual([
      { label: 'Vraag', value: 'Klopt deze plek?' }
    ])
  })

  it('formats location and description for hover display', () => {
    expect(
      formatSymbolTooltipText({
        location: 'Naast deur',
        description: 'Dimmer voor spots',
        question: 'Zelfde groep als keuken?'
      })
    ).toBe('Locatie: Naast deur\nOmschrijving: Dimmer voor spots\nVraag: Zelfde groep als keuken?')
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
