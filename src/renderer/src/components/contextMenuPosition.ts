export function clampContextMenuPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number
): { left: number; top: number } {
  const margin = 8
  const maxLeft = Math.max(margin, viewportWidth - width - margin)
  const maxTop = Math.max(margin, viewportHeight - height - margin)

  return {
    left: Math.min(Math.max(margin, x), maxLeft),
    top: Math.min(Math.max(margin, y), maxTop)
  }
}
