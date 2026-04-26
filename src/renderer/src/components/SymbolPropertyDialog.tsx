import { useState, useEffect, useRef } from 'react'
import { useUIStore } from '../stores/useUIStore'
import { useProjectStore } from '../stores/useProjectStore'

export function SymbolPropertyDialog() {
  const { propertyDialog, setPropertyDialog } = useUIStore()
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const updateSymbol = useProjectStore((s) => s.updateSymbol)
  const getActiveFloor = useProjectStore((s) => s.getActiveFloor)
  const [group, setGroup] = useState('')
  const [location, setLocation] = useState('')
  const groupRef = useRef<HTMLInputElement>(null)
  const locationRef = useRef<HTMLTextAreaElement>(null)

  const floor = getActiveFloor()
  const symbol = propertyDialog
    ? floor?.symbols.find((s) => s.id === propertyDialog.symbolId)
    : undefined

  useEffect(() => {
    if (propertyDialog) {
      setGroup(propertyDialog.group)
      setLocation(propertyDialog.location)
      setTimeout(() => {
        groupRef.current?.focus()
      }, 0)
    }
  }, [propertyDialog])

  if (!propertyDialog) return null

  const handleSubmit = () => {
    const groupValue = group.trim()
    const locationValue = location.trim()
    updateSymbol(activeFloorId, propertyDialog.symbolId, {
      group: groupValue.length > 0 ? groupValue : undefined,
      location: locationValue.length > 0 ? locationValue : undefined
    })
    setPropertyDialog(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') setPropertyDialog(null)
  }

  const hasGroup = Boolean(symbol?.group && symbol.group.length > 0)
  const hasLocation = Boolean(symbol?.location && symbol.location.length > 0)
  const titleParts: string[] = []
  if (hasGroup) titleParts.push('Groep bewerken')
  if (hasLocation) titleParts.push('Locatie bewerken')
  const dialogTitle = titleParts.length > 0 ? titleParts.join(' / ') : 'Groep & Locatie'

  return (
    <div className="dialog-overlay" onClick={() => setPropertyDialog(null)}>
      <div className="dialog property-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">{dialogTitle}</div>
        <div className="property-field">
          <label htmlFor="prop-group">Groep</label>
          <input
            id="prop-group"
            ref={groupRef}
            className="dialog-input"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Voer een groep in..."
          />
        </div>
        <div className="property-field">
          <label htmlFor="prop-location">Locatie</label>
          <textarea
            id="prop-location"
            ref={locationRef}
            className="dialog-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Voer locatie informatie in..."
            rows={4}
          />
        </div>
        <div className="dialog-actions">
          <button className="dialog-btn" onClick={() => setPropertyDialog(null)}>
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
