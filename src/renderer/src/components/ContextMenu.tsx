import { useEffect, useRef } from 'react'
import { useUIStore } from '../stores/useUIStore'
import { useProjectStore } from '../stores/useProjectStore'
import { useCanvasStore } from '../stores/useCanvasStore'

export function ContextMenu() {
  const { contextMenu, setContextMenu } = useUIStore()
  const menuRef = useRef<HTMLDivElement>(null)
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const updateSymbol = useProjectStore((s) => s.updateSymbol)
  const removeSymbol = useProjectStore((s) => s.removeSymbol)
  const duplicateSymbol = useProjectStore((s) => s.duplicateSymbol)
  const getActiveFloor = useProjectStore((s) => s.getActiveFloor)
  const setSelectedSymbol = useCanvasStore((s) => s.setSelectedSymbol)
  const setLabelDialog = useUIStore((s) => s.setLabelDialog)

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [setContextMenu])

  if (!contextMenu) return null

  const floor = getActiveFloor()
  const symbol = floor?.symbols.find((s) => s.id === contextMenu.symbolId)

  const handleRotate = (degrees: number) => {
    if (!symbol) return
    updateSymbol(activeFloorId, contextMenu.symbolId, {
      rotation: (symbol.rotation + degrees) % 360
    })
    setContextMenu(null)
  }

  const handleDelete = () => {
    removeSymbol(activeFloorId, contextMenu.symbolId)
    setSelectedSymbol(null)
    setContextMenu(null)
  }

  const handleAddLabel = () => {
    setLabelDialog({
      symbolId: contextMenu.symbolId,
      currentLabel: symbol?.label ?? ''
    })
    setContextMenu(null)
  }

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: contextMenu.x, top: contextMenu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <button className="context-menu-item" onClick={() => handleRotate(90)}>
        Roteer 90°
      </button>
      <button className="context-menu-item" onClick={() => handleRotate(45)}>
        Roteer 45°
      </button>
      <button className="context-menu-item" onClick={handleAddLabel}>
        Label toevoegen
      </button>
      <button className="context-menu-item" onClick={() => {
        const newId = duplicateSymbol(activeFloorId, contextMenu.symbolId)
        if (newId) setSelectedSymbol(newId)
        setContextMenu(null)
      }}>
        Dupliceren
      </button>
      <div className="context-menu-separator" />
      <button className="context-menu-item danger" onClick={handleDelete}>
        Verwijderen
      </button>
    </div>
  )
}
