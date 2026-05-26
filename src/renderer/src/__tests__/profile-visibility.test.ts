import { describe, expect, it } from 'vitest'
import {
  CURRENT_VISIBILITY_EXPORT_PROFILE,
  createRule,
  resolvePdfExportProfiles
} from '../services/pdfExportProfiles'
import {
  getEffectiveExportProfile,
  getProfileVisibilitySymbolIds,
  getVisibleSymbolIdsForPdfExport
} from '../components/profileVisibility'
import type { Floor, PlacedSymbol } from '../types/project'

function symbol(id: string, symbolId: string, overrides: Partial<PlacedSymbol> = {}): PlacedSymbol {
  return {
    id,
    symbolId,
    x: 0,
    y: 0,
    rotation: 0,
    ...overrides
  }
}

function floor(symbols: PlacedSymbol[]): Floor {
  return {
    id: 'floor-1',
    name: 'Begane grond',
    order: 0,
    floorPlanImage: null,
    symbols
  }
}

describe('profile visibility', () => {
  it('returns no per-symbol filter for current visibility', () => {
    expect(getProfileVisibilitySymbolIds(floor([]), CURRENT_VISIBILITY_EXPORT_PROFILE, new Set())).toBeNull()
  })

  it('uses PDF profile rules to select visible symbols on the active floor', () => {
    const [profile] = resolvePdfExportProfiles([
      {
        id: 'beamer',
        name: 'Beamer',
        rules: [createRule('subject', 'is', ['beamer'])]
      }
    ])

    expect(
      getProfileVisibilitySymbolIds(
        floor([
          symbol('lamp-1', 'inbouwspot', { subject: 'beamer' }),
          symbol('line-1', 'lijn', { subject: 'beamer' }),
          symbol('wcd-1', 'geaard-stopcontact')
        ]),
        profile,
        new Set()
      )
    ).toEqual(new Set(['lamp-1', 'line-1']))
  })

  it('keeps existing type visibility ahead of profile visibility', () => {
    const [profile] = resolvePdfExportProfiles([
      {
        id: 'beamer',
        name: 'Beamer',
        rules: [createRule('subject', 'is', ['beamer'])]
      }
    ])

    expect(
      getProfileVisibilitySymbolIds(
        floor([symbol('lamp-1', 'inbouwspot', { subject: 'beamer' })]),
        profile,
        new Set(['inbouwspot'])
      )
    ).toEqual(new Set())
  })

  it('uses the active visibility profile when exporting current visibility', () => {
    const [profile] = resolvePdfExportProfiles([
      {
        id: 'beamer',
        name: 'Beamer',
        rules: [createRule('subject', 'is', ['beamer'])]
      }
    ])

    expect(getEffectiveExportProfile(CURRENT_VISIBILITY_EXPORT_PROFILE, profile)).toBe(profile)
  })

  it('preserves the active canvas profile visibility when exporting the active floor', () => {
    const [profile] = resolvePdfExportProfiles([
      {
        id: 'beamer-sonos',
        name: 'beamer/sonos',
        rules: [createRule('subject', 'is', ['beamer/sonos'])]
      }
    ])
    const activeFloor = floor([
      symbol('hdmi-1', 'cat6a-contactdoos', { subject: 'beamer/sonos' }),
      symbol('line-1', 'lijn', { subject: 'beamer/sonos', forSymbolId: 'cat6a-contactdoos' })
    ])

    expect(
      getVisibleSymbolIdsForPdfExport({
        floor: activeFloor,
        profile,
        baseHiddenSymbolIds: new Set(),
        activeVisibilityProfile: profile,
        activeFloorId: activeFloor.id,
        activeFloorVisibleSymbolIds: new Set(['hdmi-1', 'line-1'])
      })
    ).toEqual(new Set(['hdmi-1', 'line-1']))
  })

  it('recalculates profile visibility for non-active floors during PDF export', () => {
    const [profile] = resolvePdfExportProfiles([
      {
        id: 'beamer-sonos',
        name: 'beamer/sonos',
        rules: [createRule('subject', 'is', ['beamer/sonos'])]
      }
    ])

    expect(
      getVisibleSymbolIdsForPdfExport({
        floor: floor([
          symbol('hdmi-1', 'cat6a-contactdoos', { subject: 'beamer/sonos' }),
          symbol('line-1', 'lijn', { subject: 'beamer/sonos', forSymbolId: 'cat6a-contactdoos' })
        ]),
        profile,
        baseHiddenSymbolIds: new Set(),
        activeVisibilityProfile: profile,
        activeFloorId: 'other-floor',
        activeFloorVisibleSymbolIds: new Set(['hdmi-1', 'line-1'])
      })
    ).toEqual(new Set(['hdmi-1', 'line-1']))
  })
})
