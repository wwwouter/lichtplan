import { useEffect, useMemo, useState } from 'react'
import type { ExportProfile, Floor } from '../types/project'
import {
  CURRENT_VISIBILITY_EXPORT_PROFILE_ID,
  resolvePdfExportOptions,
  type PdfExportSelection,
  type ResolvedExportProfile
} from '../services/pdfExportProfiles'
import {
  PDF_DPI_OPTIONS,
  PDF_PAPER_SIZES,
  type PdfPageOrientation,
  type PdfPaperSize,
  type PdfResolutionDpi
} from '../services/exportService'

interface Props {
  floors: Floor[]
  activeFloorId: string
  exportProfiles?: ExportProfile[]
  isExporting: boolean
  onCancel: () => void
  onExport: (
    selections: PdfExportSelection[],
    includeLegend: boolean,
    pageOrientation: PdfPageOrientation,
    paperSize: PdfPaperSize,
    dpi: PdfResolutionDpi
  ) => void
}

export const PDF_EXPORT_PREFERENCES_STORAGE_KEY = 'lichtplan-pdf-export-preferences'

interface PdfExportPreferences {
  selectedProfileIdsByFloorId: Record<string, string[]>
  includeLegend: boolean
  pageOrientation: PdfPageOrientation
  paperSize: PdfPaperSize
  dpi: PdfResolutionDpi
}

const defaultPageOrientation: PdfPageOrientation = 'best-fit'
const defaultPaperSize: PdfPaperSize = 'a1'
const defaultDpi: PdfResolutionDpi = 200

export function PdfExportDialog({
  floors,
  activeFloorId,
  exportProfiles = [],
  isExporting,
  onCancel,
  onExport
}: Props) {
  const profiles = useMemo(() => resolvePdfExportOptions(exportProfiles), [exportProfiles])
  const initialPreferences = useMemo(
    () => readPdfExportPreferences(floors, profiles, activeFloorId),
    [activeFloorId, floors, profiles]
  )
  const [selectedProfileIdsByFloorId, setSelectedProfileIdsByFloorId] = useState<
    Record<string, string[]>
  >(initialPreferences.selectedProfileIdsByFloorId)
  const [includeLegend, setIncludeLegend] = useState(initialPreferences.includeLegend)
  const [pageOrientation, setPageOrientation] = useState<PdfPageOrientation>(
    initialPreferences.pageOrientation
  )
  const [paperSize, setPaperSize] = useState<PdfPaperSize>(initialPreferences.paperSize)
  const [dpi, setDpi] = useState<PdfResolutionDpi>(initialPreferences.dpi)

  const selections = floors.flatMap((floor) =>
    (selectedProfileIdsByFloorId[floor.id] ?? []).map((profileId) => ({
      floorId: floor.id,
      profileId
    }))
  )

  useEffect(() => {
    writePdfExportPreferences({
      selectedProfileIdsByFloorId,
      includeLegend,
      pageOrientation,
      paperSize,
      dpi
    })
  }, [dpi, includeLegend, pageOrientation, paperSize, selectedProfileIdsByFloorId])

  const toggleProfile = (floorId: string, profileId: string) => {
    setSelectedProfileIdsByFloorId((current) => {
      const currentProfileIds = current[floorId] ?? []
      const nextProfileIds = currentProfileIds.includes(profileId)
        ? currentProfileIds.filter((id) => id !== profileId)
        : [...currentProfileIds, profileId]
      return { ...current, [floorId]: nextProfileIds }
    })
  }

  const selectActive = () =>
    setSelectedProfileIdsByFloorId({
      [activeFloorId]: [CURRENT_VISIBILITY_EXPORT_PROFILE_ID]
    })

  const selectAll = () =>
    setSelectedProfileIdsByFloorId(
      Object.fromEntries(
        floors.map((floor) => [floor.id, [CURRENT_VISIBILITY_EXPORT_PROFILE_ID]])
      )
    )

  return (
    <div className="dialog-overlay" onClick={isExporting ? undefined : onCancel}>
      <div className="dialog pdf-export-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">PDF exporteren</div>

        <div className="pdf-export-section">
          <div className="pdf-export-section-header">
            <span>Profielen per verdieping</span>
            <div className="pdf-export-inline-actions">
              <button type="button" onClick={selectActive} disabled={isExporting}>
                Huidige
              </button>
              <button type="button" onClick={selectAll} disabled={isExporting}>
                Alles
              </button>
            </div>
          </div>

          <div className="pdf-profile-matrix">
            {floors.map((floor) => (
              <div key={floor.id} className="pdf-profile-floor">
                <div className="pdf-profile-floor-name">{floor.name}</div>
                <div className="pdf-profile-options">
                  {profiles.map((profile) => (
                    <label key={profile.id} className="pdf-profile-option">
                      <input
                        type="checkbox"
                        checked={(selectedProfileIdsByFloorId[floor.id] ?? []).includes(profile.id)}
                        onChange={() => toggleProfile(floor.id, profile.id)}
                        disabled={isExporting}
                      />
                      <span>{profile.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pdf-export-section">
          <div className="pdf-export-section-header">
            <span>Pagina-indeling</span>
          </div>

          <div className="pdf-orientation-options">
            <label className="pdf-option-row">
              <input
                type="radio"
                name="pdf-page-orientation"
                value="best-fit"
                checked={pageOrientation === 'best-fit'}
                onChange={() => setPageOrientation('best-fit')}
                disabled={isExporting}
              />
              <span>Best passend</span>
            </label>
            <label className="pdf-option-row">
              <input
                type="radio"
                name="pdf-page-orientation"
                value="portrait"
                checked={pageOrientation === 'portrait'}
                onChange={() => setPageOrientation('portrait')}
                disabled={isExporting}
              />
              <span>Staand</span>
            </label>
            <label className="pdf-option-row">
              <input
                type="radio"
                name="pdf-page-orientation"
                value="landscape"
                checked={pageOrientation === 'landscape'}
                onChange={() => setPageOrientation('landscape')}
                disabled={isExporting}
              />
              <span>Liggend</span>
            </label>
          </div>
        </div>

        <div className="pdf-export-section">
          <div className="pdf-export-section-header">
            <span>Printkwaliteit</span>
          </div>

          <div className="pdf-select-grid">
            <label className="pdf-select-row">
              <span>Papier</span>
              <select
                aria-label="Papierformaat"
                value={paperSize}
                onChange={(event) => setPaperSize(event.target.value as PdfPaperSize)}
                disabled={isExporting}
              >
                {Object.entries(PDF_PAPER_SIZES).map(([value, size]) => (
                  <option key={value} value={value}>
                    {size.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="pdf-select-row">
              <span>DPI</span>
              <select
                aria-label="Resolutie"
                value={dpi}
                onChange={(event) => setDpi(Number(event.target.value) as PdfResolutionDpi)}
                disabled={isExporting}
              >
                {PDF_DPI_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <label className="pdf-option-row">
          <input
            type="checkbox"
            checked={includeLegend}
            onChange={() => setIncludeLegend((value) => !value)}
            disabled={isExporting}
          />
          <span>Legenda toevoegen</span>
        </label>

        <div className="dialog-actions">
          <button className="dialog-btn" onClick={onCancel} disabled={isExporting}>
            Annuleren
          </button>
          <button
            className="dialog-btn primary"
            onClick={() => onExport(selections, includeLegend, pageOrientation, paperSize, dpi)}
            disabled={selections.length === 0 || isExporting}
          >
            {isExporting ? 'Exporteren...' : 'Exporteren'}
          </button>
        </div>
      </div>
    </div>
  )
}

function readPdfExportPreferences(
  floors: Floor[],
  profiles: ResolvedExportProfile[],
  activeFloorId: string
): PdfExportPreferences {
  const fallback = getDefaultPdfExportPreferences(activeFloorId)
  if (typeof window === 'undefined') return fallback

  try {
    const raw = window.localStorage.getItem(PDF_EXPORT_PREFERENCES_STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<PdfExportPreferences>

    return {
      selectedProfileIdsByFloorId: sanitizeSelectedProfiles(
        parsed.selectedProfileIdsByFloorId,
        floors,
        profiles,
        activeFloorId
      ),
      includeLegend:
        typeof parsed.includeLegend === 'boolean' ? parsed.includeLegend : fallback.includeLegend,
      pageOrientation: isPdfPageOrientation(parsed.pageOrientation)
        ? parsed.pageOrientation
        : fallback.pageOrientation,
      paperSize: isPdfPaperSize(parsed.paperSize) ? parsed.paperSize : fallback.paperSize,
      dpi: isPdfResolutionDpi(parsed.dpi) ? parsed.dpi : fallback.dpi
    }
  } catch {
    return fallback
  }
}

function writePdfExportPreferences(preferences: PdfExportPreferences): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(PDF_EXPORT_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // Ignore storage failures; export settings should still work for the current dialog.
  }
}

function getDefaultPdfExportPreferences(activeFloorId: string): PdfExportPreferences {
  return {
    selectedProfileIdsByFloorId: { [activeFloorId]: [CURRENT_VISIBILITY_EXPORT_PROFILE_ID] },
    includeLegend: false,
    pageOrientation: defaultPageOrientation,
    paperSize: defaultPaperSize,
    dpi: defaultDpi
  }
}

function sanitizeSelectedProfiles(
  selectedProfileIdsByFloorId: unknown,
  floors: Floor[],
  profiles: ResolvedExportProfile[],
  activeFloorId: string
): Record<string, string[]> {
  const floorIds = new Set(floors.map((floor) => floor.id))
  const profileIds = new Set(profiles.map((profile) => profile.id))
  const fallback = getDefaultPdfExportPreferences(activeFloorId).selectedProfileIdsByFloorId
  if (!selectedProfileIdsByFloorId || typeof selectedProfileIdsByFloorId !== 'object') {
    return fallback
  }

  const next: Record<string, string[]> = {}
  Object.entries(selectedProfileIdsByFloorId as Record<string, unknown>).forEach(
    ([floorId, value]) => {
      if (!floorIds.has(floorId) || !Array.isArray(value)) return
      const validProfileIds = Array.from(
        new Set(
          value.filter(
            (profileId): profileId is string =>
              typeof profileId === 'string' && profileIds.has(profileId)
          )
        )
      )
      if (validProfileIds.length > 0) next[floorId] = validProfileIds
    }
  )

  return Object.keys(next).length > 0 ? next : fallback
}

function isPdfPageOrientation(value: unknown): value is PdfPageOrientation {
  return value === 'best-fit' || value === 'portrait' || value === 'landscape'
}

function isPdfPaperSize(value: unknown): value is PdfPaperSize {
  return typeof value === 'string' && value in PDF_PAPER_SIZES
}

function isPdfResolutionDpi(value: unknown): value is PdfResolutionDpi {
  return typeof value === 'number' && PDF_DPI_OPTIONS.includes(value as PdfResolutionDpi)
}
