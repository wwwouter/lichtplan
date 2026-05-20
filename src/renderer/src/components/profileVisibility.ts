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
