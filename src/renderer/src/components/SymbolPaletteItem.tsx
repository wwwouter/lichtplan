import { useRef, useEffect } from 'react'
import Konva from 'konva'
import { SymbolDefinition, CATEGORY_COLORS } from '../symbols'

interface Props {
  symbol: SymbolDefinition
  color: string
}

export function SymbolPaletteItem({ symbol, color }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage | null>(null)

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
      className="symbol-palette-item"
      draggable
      onDragStart={handleDragStart}
      title={symbol.name}
    >
      <div ref={canvasRef} className="symbol-preview" />
      <span className="symbol-name">{symbol.name}</span>
    </div>
  )
}
