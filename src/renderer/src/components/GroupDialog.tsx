import { useState, useEffect, useRef } from 'react'
import { useUIStore } from '../stores/useUIStore'
import { useProjectStore } from '../stores/useProjectStore'

export function GroupDialog() {
  const { groupDialog, setGroupDialog } = useUIStore()
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const updateSymbol = useProjectStore((s) => s.updateSymbol)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (groupDialog) {
      setValue(groupDialog.currentGroup)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [groupDialog])

  if (!groupDialog) return null

  const handleSubmit = () => {
    const cleaned = value.trim()
    updateSymbol(activeFloorId, groupDialog.symbolId, {
      group: cleaned.length > 0 ? cleaned : undefined
    })
    setGroupDialog(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') setGroupDialog(null)
  }

  return (
    <div className="dialog-overlay" onClick={() => setGroupDialog(null)}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">{value ? 'Groep bewerken' : 'Groep toevoegen'}</div>
        <input
          ref={inputRef}
          className="dialog-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={2}
          placeholder="Voer een groep in..."
        />
        <div className="dialog-actions">
          <button className="dialog-btn" onClick={() => setGroupDialog(null)}>
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
