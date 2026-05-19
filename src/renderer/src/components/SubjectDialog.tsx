import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useProjectStore } from '../stores/useProjectStore'
import { useUIStore } from '../stores/useUIStore'

export function SubjectDialog() {
  const { subjectDialog, setSubjectDialog } = useUIStore()
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const updateSymbol = useProjectStore((s) => s.updateSymbol)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!subjectDialog) return
    setValue(subjectDialog.currentSubject)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }, [subjectDialog])

  if (!subjectDialog) return null

  const handleSubmit = () => {
    const cleaned = value.trim()
    updateSymbol(activeFloorId, subjectDialog.symbolId, {
      subject: cleaned.length > 0 ? cleaned : undefined
    })
    setSubjectDialog(null)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') handleSubmit()
    if (event.key === 'Escape') setSubjectDialog(null)
  }

  return (
    <div className="dialog-overlay" onClick={() => setSubjectDialog(null)}>
      <div className="dialog" onClick={(event) => event.stopPropagation()}>
        <div className="dialog-title">
          {value ? 'Onderwerp bewerken' : 'Onderwerp toevoegen'}
        </div>
        <input
          ref={inputRef}
          className="dialog-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="bijv. beamer, cameras"
        />
        <div className="dialog-actions">
          <button className="dialog-btn" onClick={() => setSubjectDialog(null)}>
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
