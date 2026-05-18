import { useState } from 'react'
import type { Floor } from '../types/project'
import type { PdfPageOrientation } from '../services/exportService'

interface Props {
  floors: Floor[]
  activeFloorId: string
  isExporting: boolean
  onCancel: () => void
  onExport: (
    floorIds: string[],
    includeLegend: boolean,
    pageOrientation: PdfPageOrientation
  ) => void
}

export function PdfExportDialog({ floors, activeFloorId, isExporting, onCancel, onExport }: Props) {
  const [selectedFloorIds, setSelectedFloorIds] = useState<string[]>([activeFloorId])
  const [includeLegend, setIncludeLegend] = useState(false)
  const [pageOrientation, setPageOrientation] = useState<PdfPageOrientation>('best-fit')

  const toggleFloor = (floorId: string) => {
    setSelectedFloorIds((current) =>
      current.includes(floorId) ? current.filter((id) => id !== floorId) : [...current, floorId]
    )
  }

  const selectAll = () => setSelectedFloorIds(floors.map((floor) => floor.id))
  const selectActive = () => setSelectedFloorIds([activeFloorId])

  return (
    <div className="dialog-overlay" onClick={isExporting ? undefined : onCancel}>
      <div className="dialog pdf-export-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">PDF exporteren</div>

        <div className="pdf-export-section">
          <div className="pdf-export-section-header">
            <span>Verdiepingen</span>
            <div className="pdf-export-inline-actions">
              <button type="button" onClick={selectActive} disabled={isExporting}>
                Huidige
              </button>
              <button type="button" onClick={selectAll} disabled={isExporting}>
                Alles
              </button>
            </div>
          </div>

          <div className="pdf-floor-list">
            {floors.map((floor) => (
              <label key={floor.id} className="pdf-floor-row">
                <input
                  type="checkbox"
                  checked={selectedFloorIds.includes(floor.id)}
                  onChange={() => toggleFloor(floor.id)}
                  disabled={isExporting}
                />
                <span>{floor.name}</span>
              </label>
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
            onClick={() => onExport(selectedFloorIds, includeLegend, pageOrientation)}
            disabled={selectedFloorIds.length === 0 || isExporting}
          >
            {isExporting ? 'Exporteren...' : 'Exporteren'}
          </button>
        </div>
      </div>
    </div>
  )
}
