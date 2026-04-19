import { useRef, useCallback, useEffect, useState } from 'react'
import { Stage, Layer, Line, Circle, Text, Rect } from 'react-konva'
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

  const { stageX, stageY, scale, selectedSymbolId, setStagePosition, setScale, setSelectedSymbol } =
    useCanvasStore()
  const setContextMenu = useUIStore((s) => s.setContextMenu)
  const setLabelDialog = useUIStore((s) => s.setLabelDialog)
  const hiddenSymbolIds = useUIStore((s) => s.hiddenSymbolIds)
  const interactionMode = useUIStore((s) => s.interactionMode)
  const setInteractionMode = useUIStore((s) => s.setInteractionMode)
  const setCalibrationPixels = useUIStore((s) => s.setCalibrationPixels)

  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null)
  const [measureResult, setMeasureResult] = useState<{
    start: { x: number; y: number }
    end: { x: number; y: number }
    mm: number
  } | null>(null)

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

      const newId = uuidv4()
      addSymbol(activeFloorId, {
        id: newId,
        symbolId,
        x,
        y,
        rotation: 0
      })

      if (symbolId === 'tekst') {
        setLabelDialog({ symbolId: newId, currentLabel: '' })
      }
    },
    [activeFloorId, addSymbol, stageX, stageY, scale, stageRef, setLabelDialog]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  useEffect(() => {
    if (interactionMode === 'default') {
      setMeasureStart(null)
      setMeasureResult(null)
    }
  }, [interactionMode])

  const getCanvasPoint = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage()
      if (!stage) return null
      const pointer = stage.getPointerPosition()
      if (!pointer) return null
      return {
        x: (pointer.x - stageX) / scale,
        y: (pointer.y - stageY) / scale
      }
    },
    [stageX, stageY, scale]
  )

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (interactionMode === 'calibrate' || interactionMode === 'measure') {
        const point = getCanvasPoint(e)
        if (!point) return

        if (!measureStart) {
          setMeasureStart(point)
          setMeasureResult(null)
        } else {
          const dx = point.x - measureStart.x
          const dy = point.y - measureStart.y
          const pixelDist = Math.sqrt(dx * dx + dy * dy)

          if (interactionMode === 'calibrate') {
            setCalibrationPixels(pixelDist)
            setMeasureStart(null)
          } else {
            const ppm = floor?.pixelsPerMm
            if (ppm && ppm > 0) {
              const mm = pixelDist / ppm
              setMeasureResult({ start: measureStart, end: point, mm })
            }
            setMeasureStart(null)
          }
        }
        return
      }

      if (e.target === e.target.getStage()) {
        setSelectedSymbol(null)
        setContextMenu(null)
      }
    },
    [interactionMode, measureStart, getCanvasPoint, setCalibrationPixels, floor, setSelectedSymbol, setContextMenu]
  )

  const handleStageDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (e.target === e.target.getStage()) {
        setStagePosition(e.target.x(), e.target.y())
      }
    },
    [setStagePosition]
  )

  useEffect(() => {
    if (interactionMode === 'default') return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInteractionMode('default')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [interactionMode, setInteractionMode])

  if (!floor) return null

  const cursorStyle =
    interactionMode === 'calibrate' || interactionMode === 'measure' ? 'crosshair' : undefined

  return (
    <div
      ref={containerRef}
      className="floor-canvas-container"
      style={cursorStyle ? { cursor: cursorStyle } : undefined}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        x={stageX}
        y={stageY}
        scaleX={scale}
        scaleY={scale}
        draggable={interactionMode === 'default'}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onDragEnd={handleStageDragEnd}
      >
        <Layer listening={interactionMode === 'default'}>
          {floor.floorPlanImage && <FloorPlanImageLayer image={floor.floorPlanImage} />}
          {floor.symbols.map((sym) => {
            if (hiddenSymbolIds.has(sym.symbolId)) return null
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
        <Layer>
          {measureStart && (
            <Circle x={measureStart.x} y={measureStart.y} radius={4 / scale} fill="#EF4444" />
          )}
          {measureResult && (
            <>
              <Line
                points={[measureResult.start.x, measureResult.start.y, measureResult.end.x, measureResult.end.y]}
                stroke="#EF4444"
                strokeWidth={2 / scale}
                dash={[6 / scale, 4 / scale]}
              />
              <Circle x={measureResult.start.x} y={measureResult.start.y} radius={4 / scale} fill="#EF4444" />
              <Circle x={measureResult.end.x} y={measureResult.end.y} radius={4 / scale} fill="#EF4444" />
              {(() => {
                const midX = (measureResult.start.x + measureResult.end.x) / 2
                const midY = (measureResult.start.y + measureResult.end.y) / 2
                const mm = measureResult.mm
                const label = mm >= 1000 ? `${(mm / 1000).toFixed(2)} m` : `${Math.round(mm)} mm`
                const fs = 14 / scale
                return (
                  <>
                    <Rect x={midX} y={midY - fs - 4 / scale} width={label.length * fs * 0.65} height={fs + 6 / scale} fill="#ffffff" stroke="#EF4444" strokeWidth={1 / scale} cornerRadius={3 / scale} />
                    <Text x={midX + 4 / scale} y={midY - fs - 1 / scale} text={label} fontSize={fs} fill="#EF4444" fontStyle="bold" listening={false} />
                  </>
                )
              })()}
            </>
          )}
        </Layer>
      </Stage>
    </div>
  )
}
