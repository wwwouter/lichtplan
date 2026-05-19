import { useState, type KeyboardEvent } from 'react'
import type { FloorPlanImage } from '../types/project'

interface Props {
  image: FloorPlanImage
  onCancel: () => void
  onScale: (percentage: number) => void
}

export function FloorPlanScaleDialog({ image, onCancel, onScale }: Props) {
  const [value, setValue] = useState('100')
  const percentage = Number(value.replace(',', '.').trim())
  const isValid = Number.isFinite(percentage) && percentage > 0 && percentage <= 1000
  const factor = isValid ? percentage / 100 : 1
  const nextWidth = Math.max(1, Math.round(image.width * factor))
  const nextHeight = Math.max(1, Math.round(image.height * factor))

  const handleSubmit = () => {
    if (!isValid) return
    onScale(percentage)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') handleSubmit()
    if (event.key === 'Escape') onCancel()
  }

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog" onClick={(event) => event.stopPropagation()}>
        <div className="dialog-title">Plattegrond schalen</div>

        <label className="dialog-field">
          <span>Percentage</span>
          <input
            className="dialog-input"
            aria-label="Percentage"
            type="number"
            min="1"
            max="1000"
            step="1"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </label>

        <div className="dialog-help">
          {image.width} x {image.height}px {'->'} {nextWidth} x {nextHeight}px
        </div>
        {!isValid && <div className="dialog-error">Voer een percentage in tussen 1 en 1000.</div>}

        <div className="dialog-actions">
          <button className="dialog-btn" onClick={onCancel}>
            Annuleren
          </button>
          <button className="dialog-btn primary" onClick={handleSubmit} disabled={!isValid}>
            Schalen
          </button>
        </div>
      </div>
    </div>
  )
}
