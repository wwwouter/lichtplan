import { useState, useEffect, useRef } from 'react'
import { useUIStore } from '../stores/useUIStore'
import { useProjectStore } from '../stores/useProjectStore'

export function LabelDialog() {
  const { labelDialog, setLabelDialog } = useUIStore()
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const updateSymbol = useProjectStore((s) => s.updateSymbol)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (labelDialog) {
      setValue(labelDialog.currentLabel)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [labelDialog])

  if (!labelDialog) return null

  const handleSubmit = () => {
    updateSymbol(activeFloorId, labelDialog.symbolId, {
      label: value.trim() || undefined
    })
    setLabelDialog(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') setLabelDialog(null)
  }

  return (
    <div className="dialog-overlay" onClick={() => setLabelDialog(null)}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Label bewerken</div>
        <input
          ref={inputRef}
          className="dialog-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Voer een label in..."
        />
        <div className="dialog-actions">
          <button className="dialog-btn" onClick={() => setLabelDialog(null)}>
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
