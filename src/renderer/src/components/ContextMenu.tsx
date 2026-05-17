import { useEffect, useRef } from 'react'
import { useUIStore } from '../stores/useUIStore'
import { useProjectStore } from '../stores/useProjectStore'
import { useCanvasStore } from '../stores/useCanvasStore'
import type { DiagramLineType } from '../types/project'
import { DEFAULT_DIAGRAM_LINE, DIAGRAM_LINE_SYMBOL_ID } from './diagramLine'
import { TEXT_SYMBOL_ID } from './symbolVisibility'

export function ContextMenu() {
  const { contextMenu, setContextMenu } = useUIStore()
  const menuRef = useRef<HTMLDivElement>(null)
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const updateSymbol = useProjectStore((s) => s.updateSymbol)
  const removeSymbol = useProjectStore((s) => s.removeSymbol)
  const duplicateSymbol = useProjectStore((s) => s.duplicateSymbol)
  const moveToFront = useProjectStore((s) => s.moveToFront)
  const moveToBack = useProjectStore((s) => s.moveToBack)
  const getActiveFloor = useProjectStore((s) => s.getActiveFloor)
  const setSelectedSymbol = useCanvasStore((s) => s.setSelectedSymbol)
  const setLabelDialog = useUIStore((s) => s.setLabelDialog)
  const setGroupDialog = useUIStore((s) => s.setGroupDialog)
  const setLocationDialog = useUIStore((s) => s.setLocationDialog)
  const setIdDialog = useUIStore((s) => s.setIdDialog)
  const setDescriptionDialog = useUIStore((s) => s.setDescriptionDialog)
  const setQuestionDialog = useUIStore((s) => s.setQuestionDialog)
  const setForTypeDialog = useUIStore((s) => s.setForTypeDialog)

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [setContextMenu])

  if (!contextMenu) return null

  const floor = getActiveFloor()
  const symbol = floor?.symbols.find((s) => s.id === contextMenu.symbolId)
  const isTextSymbol = symbol?.symbolId === TEXT_SYMBOL_ID
  const isDiagramLine = symbol?.symbolId === DIAGRAM_LINE_SYMBOL_ID
  const supportsForType = isTextSymbol || isDiagramLine
  const hasLabel = Boolean(symbol?.label && symbol.label.length > 0)
  const hasGroup = Boolean(symbol?.group && symbol.group.length > 0)
  const hasLocation = Boolean(symbol?.location && symbol.location.length > 0)
  const itemId = symbol?.itemId
  const hasId = Boolean(itemId && itemId.length > 0)
  const hasDescription = Boolean(symbol?.description && symbol.description.length > 0)
  const hasQuestion = Boolean(symbol?.question && symbol.question.length > 0)

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

  const handleOpenQuestionDialog = () => {
    setQuestionDialog({
      symbolId: contextMenu.symbolId,
      currentQuestion: symbol?.question ?? ''
    })
    setContextMenu(null)
  }

  const handleOpenForTypeDialog = () => {
    setForTypeDialog({
      symbolId: contextMenu.symbolId,
      currentForSymbolId: symbol?.forSymbolId
    })
    setContextMenu(null)
  }

  const handleSetLineType = (type: DiagramLineType) => {
    if (!symbol) return
    updateSymbol(activeFloorId, contextMenu.symbolId, {
      diagramLine: {
        ...(symbol.diagramLine ?? DEFAULT_DIAGRAM_LINE),
        type
      }
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
      {!isTextSymbol && !isDiagramLine && (
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
      {supportsForType && (
        <button className="context-menu-item" onClick={handleOpenForTypeDialog}>
          {symbol?.forSymbolId ? 'Voor type bewerken' : 'Voor type instellen'}
        </button>
      )}
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
      <button className="context-menu-item" onClick={handleOpenQuestionDialog}>
        {hasQuestion ? 'Vraag bewerken' : 'Vraag toevoegen'}
      </button>
      {isDiagramLine && (
        <>
          <div className="context-menu-separator" />
          <button
            className={`context-menu-item${symbol?.diagramLine?.type !== 'dotted' ? ' active' : ''}`}
            onClick={() => handleSetLineType('straight')}
          >
            Doorgetrokken lijn
          </button>
          <button
            className={`context-menu-item${symbol?.diagramLine?.type === 'dotted' ? ' active' : ''}`}
            onClick={() => handleSetLineType('dotted')}
          >
            Gestippelde lijn
          </button>
        </>
      )}
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
      {!isTextSymbol && (
        <>
          <button
            className="context-menu-item"
            onClick={() => {
              moveToFront(activeFloorId, contextMenu.symbolId)
              setContextMenu(null)
            }}
          >
            Naar voorgrond
          </button>
          <button
            className="context-menu-item"
            onClick={() => {
              moveToBack(activeFloorId, contextMenu.symbolId)
              setContextMenu(null)
            }}
          >
            Naar achtergrond
          </button>
        </>
      )}
      <div className="context-menu-separator" />
      <button className="context-menu-item danger" onClick={handleDelete}>
        Verwijderen
      </button>
    </div>
  )
}
