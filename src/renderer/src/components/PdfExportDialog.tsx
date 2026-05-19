import { useMemo, useState } from 'react'
import { PALETTE_SYMBOLS_BY_CATEGORY, SymbolCategory } from '../symbols'
import type { ExportProfile, Floor } from '../types/project'
import {
  CURRENT_VISIBILITY_EXPORT_PROFILE_ID,
  resolvePdfExportProfiles,
  type PdfExportSelection
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
  onAddProfile?: (profile: Omit<ExportProfile, 'id'>) => string
  onRemoveProfile?: (profileId: string) => void
  onExport: (
    selections: PdfExportSelection[],
    includeLegend: boolean,
    pageOrientation: PdfPageOrientation,
    paperSize: PdfPaperSize,
    dpi: PdfResolutionDpi
  ) => void
}

export function PdfExportDialog({
  floors,
  activeFloorId,
  exportProfiles = [],
  isExporting,
  onCancel,
  onAddProfile,
  onRemoveProfile,
  onExport
}: Props) {
  const profiles = useMemo(() => resolvePdfExportProfiles(exportProfiles), [exportProfiles])
  const [selectedProfileIdsByFloorId, setSelectedProfileIdsByFloorId] = useState<
    Record<string, string[]>
  >({ [activeFloorId]: [CURRENT_VISIBILITY_EXPORT_PROFILE_ID] })
  const [includeLegend, setIncludeLegend] = useState(false)
  const [pageOrientation, setPageOrientation] = useState<PdfPageOrientation>('best-fit')
  const [paperSize, setPaperSize] = useState<PdfPaperSize>('a2')
  const [dpi, setDpi] = useState<PdfResolutionDpi>(200)
  const [newProfileName, setNewProfileName] = useState('')
  const [newProfileSymbolIds, setNewProfileSymbolIds] = useState<string[]>([])

  const selections = floors.flatMap((floor) =>
    (selectedProfileIdsByFloorId[floor.id] ?? []).map((profileId) => ({
      floorId: floor.id,
      profileId
    }))
  )
  const symbolGroups = Object.values(SymbolCategory)
    .filter((category) => category !== SymbolCategory.Annotaties)
    .map((category) => ({
      category,
      symbols: PALETTE_SYMBOLS_BY_CATEGORY[category]
    }))
    .filter((group) => group.symbols.length > 0)

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

  const toggleNewProfileSymbol = (symbolId: string) => {
    setNewProfileSymbolIds((current) =>
      current.includes(symbolId)
        ? current.filter((id) => id !== symbolId)
        : [...current, symbolId]
    )
  }

  const handleAddProfile = () => {
    const name = newProfileName.trim()
    if (!name || newProfileSymbolIds.length === 0 || !onAddProfile) return

    const profileId = onAddProfile({ name, symbolIds: newProfileSymbolIds })
    setSelectedProfileIdsByFloorId((current) => ({
      ...current,
      [activeFloorId]: [...(current[activeFloorId] ?? []), profileId]
    }))
    setNewProfileName('')
    setNewProfileSymbolIds([])
  }

  const handleRemoveProfile = (profileId: string) => {
    if (!onRemoveProfile) return
    onRemoveProfile(profileId)
    setSelectedProfileIdsByFloorId((current) =>
      Object.fromEntries(
        Object.entries(current).map(([floorId, profileIds]) => [
          floorId,
          profileIds.filter((id) => id !== profileId)
        ])
      )
    )
  }

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
                      {!profile.builtIn && (
                        <button
                          type="button"
                          className="pdf-profile-remove"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            handleRemoveProfile(profile.id)
                          }}
                          disabled={isExporting}
                          title="Profiel verwijderen"
                        >
                          x
                        </button>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pdf-export-section">
          <div className="pdf-export-section-header">
            <span>Nieuw exportprofiel</span>
          </div>

          <input
            className="dialog-input"
            aria-label="Profielnaam"
            placeholder="Naam"
            value={newProfileName}
            onChange={(event) => setNewProfileName(event.target.value)}
            disabled={isExporting}
          />

          <div className="pdf-symbol-picker">
            {symbolGroups.map((group) => (
              <div key={group.category} className="pdf-symbol-picker-group">
                <div className="pdf-symbol-picker-header">{group.category}</div>
                {group.symbols.map((symbol) => (
                  <label key={symbol.id} className="pdf-symbol-picker-row">
                    <input
                      type="checkbox"
                      checked={newProfileSymbolIds.includes(symbol.id)}
                      onChange={() => toggleNewProfileSymbol(symbol.id)}
                      disabled={isExporting}
                    />
                    <span>{symbol.name}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="dialog-btn"
            onClick={handleAddProfile}
            disabled={
              isExporting ||
              !onAddProfile ||
              newProfileName.trim().length === 0 ||
              newProfileSymbolIds.length === 0
            }
          >
            Profiel toevoegen
          </button>
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
