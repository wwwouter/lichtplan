import { useEffect } from 'react'
import { useProjectStore } from '../stores/useProjectStore'
import { useCanvasStore } from '../stores/useCanvasStore'

export function useKeyboardShortcuts(onSave?: () => void) {
  const removeSymbol = useProjectStore((s) => s.removeSymbol)
  const updateSymbol = useProjectStore((s) => s.updateSymbol)
  const activeFloorId = useProjectStore((s) => s.activeFloorId)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const { selectedSymbolId, setSelectedSymbol } = useCanvasStore.getState()
      const floor = useProjectStore.getState().getActiveFloor()

      // Save
      if (e.key === 's' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault()
        onSave?.()
        return
      }

      // Delete selected symbol
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedSymbolId && !isInputFocused()) {
        e.preventDefault()
        removeSymbol(activeFloorId, selectedSymbolId)
        setSelectedSymbol(null)
        return
      }

      // Rotate selected symbol 90 degrees
      if (e.key === 'r' && selectedSymbolId && !isInputFocused()) {
        e.preventDefault()
        const sym = floor?.symbols.find((s) => s.id === selectedSymbolId)
        if (sym) {
          updateSymbol(activeFloorId, selectedSymbolId, {
            rotation: (sym.rotation + 90) % 360
          })
        }
        return
      }

      // Duplicate selected symbol
      if (e.key === 'd' && (e.ctrlKey || e.metaKey) && selectedSymbolId && !isInputFocused()) {
        e.preventDefault()
        const newId = useProjectStore.getState().duplicateSymbol(activeFloorId, selectedSymbolId)
        if (newId) setSelectedSymbol(newId)
        return
      }

      // Undo
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey && !isInputFocused()) {
        e.preventDefault()
        useProjectStore.getState().undo()
        return
      }

      // Redo
      if (
        ((e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) ||
          (e.key === 'y' && (e.ctrlKey || e.metaKey))) &&
        !isInputFocused()
      ) {
        e.preventDefault()
        useProjectStore.getState().redo()
        return
      }

      // Deselect
      if (e.key === 'Escape') {
        setSelectedSymbol(null)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeFloorId, removeSymbol, updateSymbol, onSave])
}

function isInputFocused(): boolean {
  const el = document.activeElement
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
}
