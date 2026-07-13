export function getLabelLeaderLineStyle(scale: number) {
  return {
    haloStroke: '#ffffff',
    haloStrokeWidth: 3 * scale,
    stroke: '#111827',
    strokeWidth: 1.35 * scale,
    opacity: 0.88
  }
}

export interface LabelLeaderBox {
  left: number
  top: number
  width: number
  height: number
}

export interface LabelLeaderSegment {
  from: { x: number; y: number }
  to: { x: number; y: number }
}

export function getLabelLeaderSegment({
  iconBox,
  labelBox
}: {
  iconBox: LabelLeaderBox
  labelBox: LabelLeaderBox
}): LabelLeaderSegment | undefined {
  const iconCenter = getBoxCenter(iconBox)
  const labelCenter = getBoxCenter(labelBox)
  const dx = labelCenter.x - iconCenter.x
  const dy = labelCenter.y - iconCenter.y

  if (dx === 0 && dy === 0) return undefined

  if (Math.abs(dx) > Math.abs(dy)) {
    return {
      from: { x: dx > 0 ? iconBox.left + iconBox.width : iconBox.left, y: iconCenter.y },
      to: { x: dx > 0 ? labelBox.left : labelBox.left + labelBox.width, y: labelCenter.y }
    }
  }

  return {
    from: { x: iconCenter.x, y: dy > 0 ? iconBox.top + iconBox.height : iconBox.top },
    to: { x: labelCenter.x, y: dy > 0 ? labelBox.top : labelBox.top + labelBox.height }
  }
}

function getBoxCenter(box: LabelLeaderBox): { x: number; y: number } {
  return {
    x: box.left + box.width / 2,
    y: box.top + box.height / 2
  }
}
