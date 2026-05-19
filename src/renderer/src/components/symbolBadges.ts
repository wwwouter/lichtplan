import { SymbolCategory } from '../symbols'

interface GroupBadgePositionOptions {
  category: SymbolCategory
  offsetX: number
  offsetY: number
  definitionWidth: number
  scale: number
}

export function getGroupBadgePosition({
  category,
  offsetX,
  offsetY,
  definitionWidth,
  scale
}: GroupBadgePositionOptions): { x: number; y: number; radius: number } {
  const radius = 7 * scale

  if (category === SymbolCategory.Schakelaars) {
    return {
      x: -offsetX - radius - 2 * scale,
      y: offsetY - radius,
      radius
    }
  }

  return {
    x: -offsetX + definitionWidth * 0.125,
    y: offsetY - radius,
    radius
  }
}
