import { Circle, Line, Arc, Rect, Text, Path } from 'react-konva'
import { SymbolShape } from '../symbols/types'

interface Props {
  shapes: SymbolShape[]
  color: string
  offsetX: number
  offsetY: number
}

export function SymbolRenderer({ shapes, color, offsetX, offsetY }: Props) {
  return (
    <>
      {shapes.map((shape, i) => {
        const key = `shape-${i}`
        switch (shape.type) {
          case 'circle':
            return (
              <Circle
                key={key}
                x={shape.x - offsetX}
                y={shape.y - offsetY}
                radius={shape.radius}
                fill={shape.fill ?? undefined}
                stroke={shape.stroke ?? color}
                strokeWidth={shape.strokeWidth ?? 0}
                listening={false}
              />
            )
          case 'line':
            return (
              <Line
                key={key}
                points={shape.points.map((p, idx) =>
                  idx % 2 === 0 ? p - offsetX : p - offsetY
                )}
                stroke={shape.stroke ?? color}
                strokeWidth={shape.strokeWidth ?? 2}
                dash={shape.dash}
                closed={shape.closed}
                fill={shape.fill}
                listening={false}
              />
            )
          case 'arc':
            return (
              <Arc
                key={key}
                x={shape.x - offsetX}
                y={shape.y - offsetY}
                innerRadius={shape.innerRadius}
                outerRadius={shape.outerRadius}
                angle={shape.angle}
                rotation={shape.rotation}
                fill={shape.fill}
                stroke={shape.stroke ?? color}
                strokeWidth={shape.strokeWidth ?? 0}
                listening={false}
              />
            )
          case 'rect':
            return (
              <Rect
                key={key}
                x={shape.x - offsetX}
                y={shape.y - offsetY}
                width={shape.width}
                height={shape.height}
                fill={shape.fill}
                stroke={shape.stroke ?? color}
                strokeWidth={shape.strokeWidth ?? 0}
                listening={false}
              />
            )
          case 'text':
            return (
              <Text
                key={key}
                x={shape.x - offsetX}
                y={shape.y - offsetY}
                text={shape.text}
                fontSize={shape.fontSize}
                fill={shape.fill ?? color}
                fontStyle={shape.fontStyle}
                listening={false}
              />
            )
          case 'path':
            return (
              <Path
                key={key}
                x={-offsetX}
                y={-offsetY}
                data={shape.data}
                fill={shape.fill}
                stroke={shape.stroke ?? color}
                strokeWidth={shape.strokeWidth ?? 2}
                listening={false}
              />
            )
          default:
            return null
        }
      })}
    </>
  )
}
