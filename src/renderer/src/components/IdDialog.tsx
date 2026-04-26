import { useState, useEffect, useRef } from 'react'
import { useUIStore } from '../stores/useUIStore'
import { useProjectStore } from '../stores/useProjectStore'

export function IdDialog() {
  const { idDialog, setIdDialog } = useUIStore()
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const updateSymbol = useProjectStore((s) => s.updateSymbol)
  const project = useProjectStore((s) => s.project)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const floor = project.floors.find((f) => f.id === activeFloorId)
  const existingIds = floor?.symbols.map((s) => s.itemId).filter(Boolean) as string[] | undefined

  useEffect(() => {
    if (idDialog) {
      setValue(idDialog.currentId)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [idDialog])

  if (!idDialog) return null

  const isDuplicate = value && value !== idDialog.currentId && existingIds?.includes(value)

  const handleSubmit = () => {
    const cleaned = value.trim()
    updateSymbol(activeFloorId, idDialog.symbolId, {
      itemId: cleaned.length > 0 ? cleaned : undefined
    })
    setIdDialog(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') setIdDialog(null)
  }

  return (
    <div className="dialog-overlay" onClick={() => setIdDialog(null)}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">{idDialog.currentId ? 'Nummer bewerken' : 'Nummer toevoegen'}</div>
        <input
          ref={inputRef}
          className="dialog-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={3}
          placeholder="Voer een nummer in..."
        />
        {isDuplicate && (
          <div style={{ color: '#EF4444', fontSize: '11px', marginTop: '6px' }}>
            Dit nummer is al in gebruik op deze vloer.
          </div>
        )}
        <div className="dialog-actions">
          <button className="dialog-btn" onClick={() => setIdDialog(null)}>Annuleren</button>
          <button className="dialog-btn primary" onClick={handleSubmit}>Opslaan</button>
        </div>
      </div>
    </div>
  )
}
