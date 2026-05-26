import {
  CURRENT_VISIBILITY_EXPORT_PROFILE_ID,
  getVisibleSymbolIdsForExportProfile,
  type ResolvedExportProfile
} from '../services/pdfExportProfiles'
import type { Floor } from '../types/project'

export function getProfileVisibilitySymbolIds(
  floor: Floor | undefined,
  profile: ResolvedExportProfile | undefined,
  hiddenSymbolIds: Set<string>
): Set<string> | null {
  if (!floor || !profile || profile.id === CURRENT_VISIBILITY_EXPORT_PROFILE_ID) return null
  return getVisibleSymbolIdsForExportProfile(floor.symbols, profile, hiddenSymbolIds)
}

export function getEffectiveExportProfile(
  exportProfile: ResolvedExportProfile,
  visibilityProfile: ResolvedExportProfile | undefined
): ResolvedExportProfile {
  if (
    exportProfile.id === CURRENT_VISIBILITY_EXPORT_PROFILE_ID &&
    visibilityProfile &&
    visibilityProfile.id !== CURRENT_VISIBILITY_EXPORT_PROFILE_ID
  ) {
    return visibilityProfile
  }

  return exportProfile
}

export function getVisibleSymbolIdsForPdfExport({
  floor,
  profile,
  baseHiddenSymbolIds,
  activeVisibilityProfile,
  activeFloorId,
  activeFloorVisibleSymbolIds
}: {
  floor: Floor
  profile: ResolvedExportProfile
  baseHiddenSymbolIds: Set<string>
  activeVisibilityProfile?: ResolvedExportProfile
  activeFloorId: string
  activeFloorVisibleSymbolIds: Set<string> | null
}): Set<string> | null {
  const effectiveProfile = getEffectiveExportProfile(profile, activeVisibilityProfile)

  if (
    floor.id === activeFloorId &&
    activeVisibilityProfile &&
    activeVisibilityProfile.id !== CURRENT_VISIBILITY_EXPORT_PROFILE_ID &&
    effectiveProfile.id === activeVisibilityProfile.id &&
    activeFloorVisibleSymbolIds
  ) {
    const floorSymbolIds = new Set(floor.symbols.map((symbol) => symbol.id))
    return new Set(
      Array.from(activeFloorVisibleSymbolIds).filter((symbolId) => floorSymbolIds.has(symbolId))
    )
  }

  return getVisibleSymbolIdsForExportProfile(floor.symbols, effectiveProfile, baseHiddenSymbolIds)
}
