import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useProjectStore } from '../stores/useProjectStore'
import { useUIStore } from '../stores/useUIStore'

const SUBJECT_OPTIONS_ID = 'subject-options'

export function SubjectDialog() {
  const { subjectDialog, setSubjectDialog } = useUIStore()
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const floors = useProjectStore((s) => s.project.floors)
  const updateSymbol = useProjectStore((s) => s.updateSymbol)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const subjectOptions = useMemo(() => getUsedSubjects(floors), [floors])

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
          list={SUBJECT_OPTIONS_ID}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="bijv. beamer, cameras"
        />
        <datalist id={SUBJECT_OPTIONS_ID}>
          {subjectOptions.map((subject) => (
            <option key={subject} value={subject} />
          ))}
        </datalist>
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

function getUsedSubjects(floors: ReturnType<typeof useProjectStore.getState>['project']['floors']): string[] {
  const subjectsByKey = new Map<string, string>()

  floors.forEach((floor) => {
    floor.symbols.forEach((symbol) => {
      const subject = symbol.subject?.trim()
      if (!subject) return
      const key = subject.toLocaleLowerCase('nl')
      if (!subjectsByKey.has(key)) subjectsByKey.set(key, subject)
    })
  })

  return Array.from(subjectsByKey.values()).sort((a, b) => a.localeCompare(b, 'nl'))
}
