import { useState, useEffect, useRef } from 'react'
import { useUIStore } from '../stores/useUIStore'
import { useProjectStore } from '../stores/useProjectStore'

export function QuestionDialog() {
  const { questionDialog, setQuestionDialog } = useUIStore()
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const updateSymbol = useProjectStore((s) => s.updateSymbol)
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (questionDialog) {
      setValue(questionDialog.currentQuestion)
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 0)
    }
  }, [questionDialog])

  if (!questionDialog) return null

  const hasCurrentQuestion = questionDialog.currentQuestion.trim().length > 0

  const closeDialog = () => setQuestionDialog(null)

  const handleSubmit = () => {
    const cleaned = value.trim()
    updateSymbol(activeFloorId, questionDialog.symbolId, {
      question: cleaned.length > 0 ? cleaned : undefined
    })
    closeDialog()
  }

  const handleRemove = () => {
    updateSymbol(activeFloorId, questionDialog.symbolId, { question: undefined })
    closeDialog()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') closeDialog()
  }

  return (
    <div className="dialog-overlay" onClick={closeDialog}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">{hasCurrentQuestion ? 'Vraag bewerken' : 'Vraag toevoegen'}</div>
        <textarea
          ref={textareaRef}
          className="dialog-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Voer een vraag in..."
          rows={5}
        />
        <div className="dialog-actions">
          {hasCurrentQuestion && (
            <button className="dialog-btn danger" onClick={handleRemove}>
              Vraag verwijderen
            </button>
          )}
          <button className="dialog-btn" onClick={closeDialog}>
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
