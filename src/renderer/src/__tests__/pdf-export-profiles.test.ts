import { describe, expect, it } from 'vitest'
import {
  CURRENT_VISIBILITY_EXPORT_PROFILE_ID,
  getHiddenSymbolIdsForExportProfile,
  resolvePdfExportProfiles
} from '../services/pdfExportProfiles'

describe('PDF export profiles', () => {
  it('keeps current visibility unchanged for the current-visibility profile', () => {
    const profile = resolvePdfExportProfiles().find(
      (item) => item.id === CURRENT_VISIBILITY_EXPORT_PROFILE_ID
    )!

    expect(getHiddenSymbolIdsForExportProfile(profile, new Set(['wandlamp']))).toEqual(
      new Set(['wandlamp'])
    )
  })

  it('hides regular symbol types outside the selected profile while preserving base hidden items', () => {
    const profile = resolvePdfExportProfiles().find((item) => item.id === '12v')!
    const hidden = getHiddenSymbolIdsForExportProfile(profile, new Set(['tekst']))

    expect(hidden.has('12v-lasdoos')).toBe(false)
    expect(hidden.has('geaard-stopcontact')).toBe(true)
    expect(hidden.has('lichtpunt-plafond')).toBe(true)
    expect(hidden.has('tekst')).toBe(true)
  })

  it('includes custom profiles after the built-in profiles', () => {
    const profiles = resolvePdfExportProfiles([
      { id: 'custom-1', name: 'Eigen profiel', symbolIds: ['cat6a-contactdoos'] }
    ])

    expect(profiles.at(-1)).toMatchObject({
      id: 'custom-1',
      name: 'Eigen profiel',
      symbolIds: ['cat6a-contactdoos'],
      builtIn: false
    })
  })
})
