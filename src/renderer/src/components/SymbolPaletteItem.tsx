import { useRef, useEffect } from 'react'
import Konva from 'konva'
import { SymbolDefinition, CATEGORY_COLORS } from '../symbols'
import { useUIStore } from '../stores/useUIStore'

interface Props {
  symbol: SymbolDefinition
  color: string
}

export function SymbolPaletteItem({ symbol, color }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage | null>(null)
  const hidden = useUIStore((s) => s.hiddenSymbolIds.has(symbol.id))
  const toggleVisibility = useUIStore((s) => s.toggleSymbolVisibility)

  useEffect(() => {
    if (!canvasRef.current || stageRef.current) return

    const padding = 4
    const previewSize = 32
    const scaleX = (previewSize - padding * 2) / symbol.width
    const scaleY = (previewSize - padding * 2) / symbol.height
    const s = Math.min(scaleX, scaleY)

    const stage = new Konva.Stage({
      container: canvasRef.current,
      width: previewSize,
      height: previewSize
    })

    const layer = new Konva.Layer()
    stage.add(layer)

    const group = new Konva.Group({
      x: (previewSize - symbol.width * s) / 2,
      y: (previewSize - symbol.height * s) / 2,
      scaleX: s,
      scaleY: s
    })

    symbol.shapes.forEach((shape) => {
      switch (shape.type) {
        case 'circle':
          group.add(
            new Konva.Circle({
              x: shape.x,
              y: shape.y,
              radius: shape.radius,
              fill: shape.fill,
              stroke: shape.stroke ?? color,
              strokeWidth: shape.strokeWidth ?? 0
            })
          )
          break
        case 'line':
          group.add(
            new Konva.Line({
              points: shape.points,
              stroke: shape.stroke ?? color,
              strokeWidth: shape.strokeWidth ?? 2,
              dash: shape.dash,
              closed: shape.closed,
              fill: shape.fill
            })
          )
          break
        case 'arc':
          group.add(
            new Konva.Arc({
              x: shape.x,
              y: shape.y,
              innerRadius: shape.innerRadius,
              outerRadius: shape.outerRadius,
              angle: shape.angle,
              rotation: shape.rotation,
              fill: shape.fill,
              stroke: shape.stroke ?? color,
              strokeWidth: shape.strokeWidth ?? 0
            })
          )
          break
        case 'rect':
          group.add(
            new Konva.Rect({
              x: shape.x,
              y: shape.y,
              width: shape.width,
              height: shape.height,
              fill: shape.fill,
              stroke: shape.stroke ?? color,
              strokeWidth: shape.strokeWidth ?? 0
            })
          )
          break
        case 'text':
          group.add(
            new Konva.Text({
              x: shape.x,
              y: shape.y,
              text: shape.text,
              fontSize: shape.fontSize,
              fill: shape.fill ?? color,
              fontStyle: shape.fontStyle
            })
          )
          break
      }
    })

    layer.add(group)
    layer.draw()
    stageRef.current = stage

    return () => {
      stage.destroy()
      stageRef.current = null
    }
  }, [symbol, color])

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('symbolId', symbol.id)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div
      className={`symbol-palette-item${hidden ? ' symbol-hidden' : ''}`}
      draggable
      onDragStart={handleDragStart}
      title={symbol.name}
    >
      <div ref={canvasRef} className="symbol-preview" />
      <span className="symbol-name">{symbol.name}</span>
      <button
        className="symbol-visibility-toggle"
        onClick={(e) => {
          e.stopPropagation()
          toggleVisibility(symbol.id)
        }}
        title={hidden ? 'Tonen' : 'Verbergen'}
      >
        {hidden ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  )
}
