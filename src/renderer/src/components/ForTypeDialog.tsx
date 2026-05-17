import { useEffect, useState } from 'react'
import { useUIStore } from '../stores/useUIStore'
import { useProjectStore } from '../stores/useProjectStore'
import { getForTypeOptions } from './symbolVisibility'

export function ForTypeDialog() {
  const { forTypeDialog, setForTypeDialog } = useUIStore()
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const updateSymbol = useProjectStore((s) => s.updateSymbol)
  const [value, setValue] = useState('')

  useEffect(() => {
    if (forTypeDialog) setValue(forTypeDialog.currentForSymbolId ?? '')
  }, [forTypeDialog])

  if (!forTypeDialog) return null

  const options = getForTypeOptions()

  const handleSubmit = () => {
    updateSymbol(activeFloorId, forTypeDialog.symbolId, {
      forSymbolId: value || undefined
    })
    setForTypeDialog(null)
  }

  return (
    <div className="dialog-overlay" onClick={() => setForTypeDialog(null)}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Voor type</div>
        <select
          className="dialog-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
            if (e.key === 'Escape') setForTypeDialog(null)
          }}
          autoFocus
        >
          <option value="">Geen type</option>
          {options.map((symbol) => (
            <option key={symbol.id} value={symbol.id}>
              {symbol.name}
            </option>
          ))}
        </select>
        <div className="dialog-actions">
          <button className="dialog-btn" onClick={() => setForTypeDialog(null)}>
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
