import { useState, useEffect, useRef } from 'react'
import { useUIStore } from '../stores/useUIStore'
import { useProjectStore } from '../stores/useProjectStore'

export function LabelDialog() {
  const { labelDialog, setLabelDialog } = useUIStore()
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const updateSymbol = useProjectStore((s) => s.updateSymbol)
  const getActiveFloor = useProjectStore((s) => s.getActiveFloor)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const floor = getActiveFloor()
  const symbol = labelDialog
    ? floor?.symbols.find((s) => s.id === labelDialog.symbolId)
    : undefined
  const isTextSymbol = symbol?.symbolId === 'tekst'

  useEffect(() => {
    if (labelDialog) {
      setValue(labelDialog.currentLabel)
      setTimeout(() => {
        if (isTextSymbol) textareaRef.current?.focus()
        else inputRef.current?.focus()
      }, 0)
    }
  }, [labelDialog, isTextSymbol])

  if (!labelDialog) return null

  const handleSubmit = () => {
    const cleaned = isTextSymbol ? value : value.trim()
    updateSymbol(activeFloorId, labelDialog.symbolId, {
      label: cleaned.length > 0 ? cleaned : undefined
    })
    setLabelDialog(null)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') setLabelDialog(null)
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') setLabelDialog(null)
  }

  return (
    <div className="dialog-overlay" onClick={() => setLabelDialog(null)}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">
          {isTextSymbol ? 'Tekst bewerken' : 'Label bewerken'}
        </div>
        {isTextSymbol ? (
          <textarea
            ref={textareaRef}
            className="dialog-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder="Voer tekst in..."
            rows={5}
          />
        ) : (
          <input
            ref={inputRef}
            className="dialog-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Voer een label in..."
          />
        )}
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
