import { useState } from 'react'
import { useProjectStore } from '../stores/useProjectStore'
import { useCanvasStore } from '../stores/useCanvasStore'

export function FloorTabs() {
  const { project, activeFloorId, setActiveFloor, addFloor, removeFloor, renameFloor } =
    useProjectStore()
  const resetZoom = useCanvasStore((s) => s.resetZoom)
  const setSelectedSymbol = useCanvasStore((s) => s.setSelectedSymbol)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleSwitchFloor = (floorId: string) => {
    setActiveFloor(floorId)
    setSelectedSymbol(null)
    resetZoom()
  }

  const handleAddFloor = () => {
    const number = project.floors.length
    const name =
      number === 0
        ? 'Begane grond'
        : number === 1
          ? '1e Verdieping'
          : `${number}e Verdieping`
    addFloor(name)
  }

  const handleDoubleClick = (floorId: string, currentName: string) => {
    setEditingId(floorId)
    setEditValue(currentName)
  }

  const handleRenameSubmit = (floorId: string) => {
    if (editValue.trim()) {
      renameFloor(floorId, editValue.trim())
    }
    setEditingId(null)
  }

  const handleDelete = (e: React.MouseEvent, floorId: string) => {
    e.stopPropagation()
    if (project.floors.length <= 1) return
    removeFloor(floorId)
  }

  return (
    <div className="floor-tabs">
      <div className="floor-tabs-list">
        {project.floors.map((floor) => (
          <div
            key={floor.id}
            className={`floor-tab ${activeFloorId === floor.id ? 'active' : ''}`}
            onClick={() => handleSwitchFloor(floor.id)}
            onDoubleClick={() => handleDoubleClick(floor.id, floor.name)}
          >
            {editingId === floor.id ? (
              <input
                className="floor-tab-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleRenameSubmit(floor.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(floor.id)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="floor-tab-name">{floor.name}</span>
                {project.floors.length > 1 && (
                  <button
                    className="floor-tab-close"
                    onClick={(e) => handleDelete(e, floor.id)}
                    title="Verdieping verwijderen"
                  >
                    ×
                  </button>
                )}
              </>
            )}
          </div>
        ))}
        <button className="floor-tab-add" onClick={handleAddFloor} title="Verdieping toevoegen">
          +
        </button>
      </div>
      <div className="floor-tabs-status">
        {project.floors.find((f) => f.id === activeFloorId)?.symbols.length ?? 0} symbolen
      </div>
    </div>
  )
}
