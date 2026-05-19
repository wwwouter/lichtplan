import { lightingSymbols } from '../symbols/lighting'
import { switchSymbols } from '../symbols/switches'
import { ALL_SYMBOLS } from '../symbols'
import type { ExportProfile } from '../types/project'
import { isAnnotationSymbolId } from '../components/symbolVisibility'

export const CURRENT_VISIBILITY_EXPORT_PROFILE_ID = 'current-visibility'

export interface ResolvedExportProfile {
  id: string
  name: string
  symbolIds: string[] | null
  builtIn: boolean
}

export interface PdfExportSelection {
  floorId: string
  profileId: string
}

const lightingSymbolIds = lightingSymbols.map((symbol) => symbol.id)
const switchSymbolIds = switchSymbols.map((symbol) => symbol.id)

export const BUILT_IN_EXPORT_PROFILES: ResolvedExportProfile[] = [
  {
    id: CURRENT_VISIBILITY_EXPORT_PROFILE_ID,
    name: 'Huidige zichtbaarheid',
    symbolIds: null,
    builtIn: true
  },
  {
    id: 'lighting-switches',
    name: 'Lampen + schakelaars',
    symbolIds: [...lightingSymbolIds, ...switchSymbolIds],
    builtIn: true
  },
  {
    id: 'wcd',
    name: 'WCD',
    symbolIds: ['geaard-stopcontact', 'dubbel-geaard-stopcontact'],
    builtIn: true
  },
  {
    id: '12v',
    name: '12V',
    symbolIds: ['12v-lasdoos'],
    builtIn: true
  },
  {
    id: 'beamer',
    name: 'Beamer',
    symbolIds: [
      'geaard-stopcontact',
      'dubbel-geaard-stopcontact',
      'cat6a-contactdoos',
      'cat5e-uutp-contactdoos',
      '12v-lasdoos'
    ],
    builtIn: true
  },
  {
    id: 'network',
    name: 'Netwerk',
    symbolIds: ['cat6a-contactdoos', 'cat5e-uutp-contactdoos'],
    builtIn: true
  }
]

const regularSymbolIds = ALL_SYMBOLS
  .filter((symbol) => !isAnnotationSymbolId(symbol.id))
  .map((symbol) => symbol.id)

export function resolvePdfExportProfiles(customProfiles: ExportProfile[] = []): ResolvedExportProfile[] {
  return [
    ...BUILT_IN_EXPORT_PROFILES,
    ...customProfiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      symbolIds: profile.symbolIds,
      builtIn: false
    }))
  ]
}

export function getHiddenSymbolIdsForExportProfile(
  profile: ResolvedExportProfile,
  baseHiddenSymbolIds: Set<string>
): Set<string> {
  const hiddenSymbolIds = new Set(baseHiddenSymbolIds)
  if (profile.symbolIds === null) return hiddenSymbolIds

  const visibleSymbolIds = new Set(profile.symbolIds)
  regularSymbolIds.forEach((symbolId) => {
    if (!visibleSymbolIds.has(symbolId)) hiddenSymbolIds.add(symbolId)
  })

  return hiddenSymbolIds
}
