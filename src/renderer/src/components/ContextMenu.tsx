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
  const setGroupDialog = useUIStore((s) => s.setGroupDialog)
  const setLocationDialog = useUIStore((s) => s.setLocationDialog)
  const setIdDialog = useUIStore((s) => s.setIdDialog)
  const setDescriptionDialog = useUIStore((s) => s.setDescriptionDialog)

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [setContextMenu])

  if (!contextMenu) return null

  const floor = getActiveFloor()
  const symbol = floor?.symbols.find((s) => s.id === contextMenu.symbolId)
  const isTextSymbol = symbol?.symbolId === 'tekst'
  const hasLabel = Boolean(symbol?.label && symbol.label.length > 0)
  const hasGroup = Boolean(symbol?.group && symbol.group.length > 0)
  const hasLocation = Boolean(symbol?.location && symbol.location.length > 0)
  const itemId = symbol?.itemId
  const hasId = Boolean(itemId && itemId.length > 0)
  const hasDescription = Boolean(symbol?.description && symbol.description.length > 0)

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

  const handleOpenGroupDialog = () => {
    setGroupDialog({
      symbolId: contextMenu.symbolId,
      currentGroup: symbol?.group ?? ''
    })
    setContextMenu(null)
  }

  const handleOpenLocationDialog = () => {
    setLocationDialog({
      symbolId: contextMenu.symbolId,
      currentLocation: symbol?.location ?? ''
    })
    setContextMenu(null)
  }

  const handleOpenIdDialog = () => {
    setIdDialog({
      symbolId: contextMenu.symbolId,
      currentId: symbol?.itemId ?? ''
    })
    setContextMenu(null)
  }

  const handleOpenDescriptionDialog = () => {
    setDescriptionDialog({
      symbolId: contextMenu.symbolId,
      currentDescription: symbol?.description ?? ''
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
      {!isTextSymbol && (
        <>
          <button className="context-menu-item" onClick={() => handleRotate(90)}>
            Roteer 90°
          </button>
          <button className="context-menu-item" onClick={() => handleRotate(180)}>
            Roteer 180°
          </button>
        </>
      )}
      <button className="context-menu-item" onClick={handleAddLabel}>
        {isTextSymbol ? 'Bewerken' : hasLabel ? 'Label bewerken' : 'Label toevoegen'}
      </button>
      <button className="context-menu-item" onClick={handleOpenGroupDialog}>
        {hasGroup ? 'Groep bewerken' : 'Groep toevoegen'}
      </button>
      {!isTextSymbol && (
        <button className="context-menu-item" onClick={handleOpenLocationDialog}>
          {hasLocation ? 'Locatie bewerken' : 'Locatie toevoegen'}
        </button>
      )}
      <button className="context-menu-item" onClick={handleOpenIdDialog}>
        {hasId ? 'Nummer bewerken' : 'Nummer toevoegen'}
      </button>
      <button className="context-menu-item" onClick={handleOpenDescriptionDialog}>
        {hasDescription ? 'Omschrijving bewerken' : 'Omschrijving toevoegen'}
      </button>
      <button
        className="context-menu-item"
        onClick={() => {
          const newId = duplicateSymbol(activeFloorId, contextMenu.symbolId)
          if (newId) setSelectedSymbol(newId)
          setContextMenu(null)
        }}
      >
        Dupliceren
      </button>
      <div className="context-menu-separator" />
      <button className="context-menu-item danger" onClick={handleDelete}>
        Verwijderen
      </button>
    </div>
  )
}
