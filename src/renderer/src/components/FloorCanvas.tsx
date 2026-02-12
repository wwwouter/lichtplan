import { useRef, useCallback, useEffect, useState } from 'react'
import { Stage, Layer } from 'react-konva'
import Konva from 'konva'
import { v4 as uuidv4 } from 'uuid'
import { useProjectStore } from '../stores/useProjectStore'
import { useCanvasStore } from '../stores/useCanvasStore'
import { useUIStore } from '../stores/useUIStore'
import { getSymbolById } from '../symbols'
import { FloorPlanImageLayer } from './FloorPlanImage'
import { SymbolNode } from './SymbolNode'

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>
}

export function FloorCanvas({ stageRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 800, height: 600 })

  const floor = useProjectStore((s) =>
    s.project.floors.find((f) => f.id === s.activeFloorId)
  )
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const addSymbol = useProjectStore((s) => s.addSymbol)

  const { stageX, stageY, scale, selectedSymbolId, activeTool, setStagePosition, setScale, setSelectedSymbol } =
    useCanvasStore()
  const setContextMenu = useUIStore((s) => s.setContextMenu)

  // Resize observer
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        })
      }
    })
    observer.observe(container)
    setSize({ width: container.clientWidth, height: container.clientHeight })
    return () => observer.disconnect()
  }, [])

  // Wheel zoom (pointer-relative)
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault()
      const stage = e.target.getStage()
      if (!stage) return

      const oldScale = scale
      const pointer = stage.getPointerPosition()
      if (!pointer) return

      const scaleBy = 1.08
      const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy
      const clampedScale = Math.min(5, Math.max(0.1, newScale))

      const mousePointTo = {
        x: (pointer.x - stageX) / oldScale,
        y: (pointer.y - stageY) / oldScale
      }

      setScale(clampedScale)
      setStagePosition(
        pointer.x - mousePointTo.x * clampedScale,
        pointer.y - mousePointTo.y * clampedScale
      )
    },
    [scale, stageX, stageY, setScale, setStagePosition]
  )

  // Drop handler for symbols from sidebar
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const symbolId = e.dataTransfer.getData('symbolId')
      if (!symbolId || !stageRef.current) return

      const stage = stageRef.current
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const x = (e.clientX - rect.left - stageX) / scale
      const y = (e.clientY - rect.top - stageY) / scale

      addSymbol(activeFloorId, {
        id: uuidv4(),
        symbolId,
        x,
        y,
        rotation: 0
      })
    },
    [activeFloorId, addSymbol, stageX, stageY, scale, stageRef]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  // Click on empty area deselects
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        setSelectedSymbol(null)
        setContextMenu(null)
      }
    },
    [setSelectedSymbol, setContextMenu]
  )

  const handleStageDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (e.target === e.target.getStage()) {
        setStagePosition(e.target.x(), e.target.y())
      }
    },
    [setStagePosition]
  )

  if (!floor) return null

  return (
    <div
      ref={containerRef}
      className="floor-canvas-container"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        x={stageX}
        y={stageY}
        scaleX={scale}
        scaleY={scale}
        draggable={activeTool === 'pan'}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onDragEnd={handleStageDragEnd}
      >
        <Layer>
          {floor.floorPlanImage && <FloorPlanImageLayer image={floor.floorPlanImage} />}
          {floor.symbols.map((sym) => {
            const def = getSymbolById(sym.symbolId)
            if (!def) return null
            return (
              <SymbolNode
                key={sym.id}
                symbol={sym}
                definition={def}
                floorId={activeFloorId}
                isSelected={selectedSymbolId === sym.id}
              />
            )
          })}
        </Layer>
      </Stage>
    </div>
  )
}
