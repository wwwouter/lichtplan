import { useState, useEffect, useRef } from 'react'
import { useUIStore } from '../stores/useUIStore'
import { useProjectStore } from '../stores/useProjectStore'

export function DescriptionDialog() {
  const { descriptionDialog, setDescriptionDialog } = useUIStore()
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const updateSymbol = useProjectStore((s) => s.updateSymbol)
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (descriptionDialog) {
      setValue(descriptionDialog.currentDescription)
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 0)
    }
  }, [descriptionDialog])

  if (!descriptionDialog) return null

  const handleSubmit = () => {
    const cleaned = value.trim()
    updateSymbol(activeFloorId, descriptionDialog.symbolId, {
      description: cleaned.length > 0 ? cleaned : undefined
    })
    setDescriptionDialog(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') setDescriptionDialog(null)
  }

  return (
    <div className="dialog-overlay" onClick={() => setDescriptionDialog(null)}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">{value ? 'Omschrijving bewerken' : 'Omschrijving toevoegen'}</div>
        <textarea
          ref={textareaRef}
          className="dialog-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Voer een omschrijving in..."
          rows={5}
        />
        <div className="dialog-actions">
          <button className="dialog-btn" onClick={() => setDescriptionDialog(null)}>Annuleren</button>
          <button className="dialog-btn primary" onClick={handleSubmit}>Opslaan</button>
        </div>
      </div>
    </div>
  )
}
