import { useState, useEffect, useRef } from 'react'
import { useUIStore } from '../stores/useUIStore'
import { useProjectStore } from '../stores/useProjectStore'

export function LocationDialog() {
  const { locationDialog, setLocationDialog } = useUIStore()
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const updateSymbol = useProjectStore((s) => s.updateSymbol)
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (locationDialog) {
      setValue(locationDialog.currentLocation)
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 0)
    }
  }, [locationDialog])

  if (!locationDialog) return null

  const handleSubmit = () => {
    const cleaned = value.trim()
    updateSymbol(activeFloorId, locationDialog.symbolId, {
      location: cleaned.length > 0 ? cleaned : undefined
    })
    setLocationDialog(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') setLocationDialog(null)
  }

  return (
    <div className="dialog-overlay" onClick={() => setLocationDialog(null)}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">{value ? 'Locatie bewerken' : 'Locatie toevoegen'}</div>
        <textarea
          ref={textareaRef}
          className="dialog-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Voer locatie informatie in..."
          rows={5}
        />
        <div className="dialog-actions">
          <button className="dialog-btn" onClick={() => setLocationDialog(null)}>
            Annuleren
          </button>
          <button className="dialog-btn primary" onClick={handleSubmit}>
            Opslaan
          </button>
        </div>
      </div>
    </div>
  )
}
