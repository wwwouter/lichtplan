import { useState, useEffect, useRef } from 'react'
import { useUIStore } from '../stores/useUIStore'
import { useProjectStore } from '../stores/useProjectStore'

export function CalibrationDialog() {
  const calibrationPixels = useUIStore((s) => s.calibrationPixels)
  const setCalibrationPixels = useUIStore((s) => s.setCalibrationPixels)
  const setInteractionMode = useUIStore((s) => s.setInteractionMode)
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const setFloorScale = useProjectStore((s) => s.setFloorScale)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (calibrationPixels !== null) {
      setValue('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [calibrationPixels])

  if (calibrationPixels === null) return null

  const handleSubmit = () => {
    const mm = parseFloat(value)
    if (!mm || mm <= 0) return
    setFloorScale(activeFloorId, calibrationPixels / mm)
    setCalibrationPixels(null)
    setInteractionMode('default')
  }

  const handleCancel = () => {
    setCalibrationPixels(null)
    setInteractionMode('default')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') handleCancel()
  }

  return (
    <div className="dialog-overlay" onClick={handleCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Schaal instellen</div>
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>
          Hoeveel mm is de getekende lijn?
        </p>
        <input
          ref={inputRef}
          className="dialog-input"
          type="number"
          min="1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="bijv. 1000"
        />
        <div className="dialog-actions">
          <button className="dialog-btn" onClick={handleCancel}>
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
