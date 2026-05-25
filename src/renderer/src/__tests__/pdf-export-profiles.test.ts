import { describe, expect, it } from 'vitest'
import {
  CURRENT_VISIBILITY_EXPORT_PROFILE_ID,
  createDefaultExportProfiles,
  createRule,
  getVisibleSymbolIdsForExportProfile,
  resolvePdfExportOptions,
  resolvePdfExportProfiles
} from '../services/pdfExportProfiles'
import type { PlacedSymbol } from '../types/project'

function symbol(
  id: string,
  symbolId: string,
  overrides: Partial<PlacedSymbol> = {}
): PlacedSymbol {
  return {
    id,
    symbolId,
    x: 0,
    y: 0,
    rotation: 0,
    ...overrides
  }
}

describe('PDF export profiles', () => {
  it('keeps current visibility unfiltered for the current-visibility profile', () => {
    const profile = resolvePdfExportOptions().find(
      (item) => item.id === CURRENT_VISIBILITY_EXPORT_PROFILE_ID
    )!

    expect(
      getVisibleSymbolIdsForExportProfile(
        [symbol('lamp-1', 'wandlamp')],
        profile,
        new Set(['wandlamp'])
      )
    ).toBeNull()
  })

  it('filters beamer profile by subject across icons, lines and text', () => {
    const profile = resolvePdfExportProfiles(createDefaultExportProfiles()).find(
      (item) => item.id === 'beamer'
    )!
    const visible = getVisibleSymbolIdsForExportProfile(
      [
        symbol('lamp-1', 'inbouwspot', { subject: 'beamer' }),
        symbol('line-1', 'lijn', { subject: 'Beamer' }),
        symbol('text-1', 'tekst', { subject: 'beamer' }),
        symbol('lamp-2', 'inbouwspot')
      ],
      profile,
      new Set()
    )

    expect(visible).toEqual(new Set(['lamp-1', 'line-1', 'text-1']))
  })

  it('filters lighting profile by type and excludes beamer subject', () => {
    const profile = resolvePdfExportProfiles(createDefaultExportProfiles()).find(
      (item) => item.id === 'lighting-switches'
    )!
    const visible = getVisibleSymbolIdsForExportProfile(
      [
        symbol('lamp-1', 'inbouwspot'),
        symbol('switch-1', 'dimmer'),
        symbol('line-1', 'lijn', { forSymbolId: 'dimmer' }),
        symbol('beamer-lamp', 'inbouwspot', { subject: 'beamer' }),
        symbol('wcd-1', 'geaard-stopcontact')
      ],
      profile,
      new Set()
    )

    expect(visible).toEqual(new Set(['lamp-1', 'switch-1', 'line-1']))
  })

  it('uses only Cat6a for the default network profile', () => {
    const networkProfile = createDefaultExportProfiles().find((profile) => profile.id === 'network')

    expect(networkProfile?.rules[0].values).toEqual(['cat6a-contactdoos'])
  })

  it('resolves only project profiles without fixed built-ins', () => {
    const profiles = resolvePdfExportProfiles([
      {
        id: 'custom-1',
        name: 'Eigen profiel',
        rules: [createRule('subject', 'is', ['cameras'])]
      }
    ])

    expect(profiles).toHaveLength(1)
    expect(profiles[0]).toMatchObject({
      id: 'custom-1',
      name: 'Eigen profiel',
      rules: [createRule('subject', 'is', ['cameras'])],
      builtIn: false
    })
  })
})
