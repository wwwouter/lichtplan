/**
 * Computes the transparent hit-area rect for a symbol.
 * Konva Groups only receive pointer events if at least one child
 * has listening=true. Since all visual shapes use listening={false},
 * SymbolNode must render a transparent Rect with these dimensions.
 */
export function buildHitArea(width: number, height: number) {
  return {
    x: -(width / 2),
    y: -(height / 2),
    width,
    height
  }
}
