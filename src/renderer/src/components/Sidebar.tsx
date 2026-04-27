import { SYMBOLS_BY_CATEGORY, CATEGORY_COLORS, SymbolCategory } from '../symbols'
import { useUIStore } from '../stores/useUIStore'
import { SymbolPaletteItem } from './SymbolPaletteItem'

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      className={`visibility-toggle ${active ? 'active' : ''}`}
      onClick={onClick}
      title={`${active ? 'Verberg' : 'Toon'} ${label.toLowerCase()}`}
    >
      {label}
    </button>
  )
}

export function Sidebar() {
  const { sidebarCollapsed, expandedCategories, toggleCategory, showItemId, showGroup, showLabel, toggleShowItemId, toggleShowGroup, toggleShowLabel } = useUIStore()

  if (sidebarCollapsed) return null

  return (
    <div className="sidebar">
      <div className="visibility-toggles">
        <Toggle label="ID" active={showItemId} onClick={toggleShowItemId} />
        <Toggle label="Groep" active={showGroup} onClick={toggleShowGroup} />
        <Toggle label="Label" active={showLabel} onClick={toggleShowLabel} />
      </div>
      <div className="sidebar-header">Symbolen</div>
      {Object.values(SymbolCategory).map((category) => {
        const symbols = SYMBOLS_BY_CATEGORY[category]
        const isExpanded = expandedCategories[category] ?? true
        const color = CATEGORY_COLORS[category]

        return (
          <div key={category} className="symbol-category">
            <button
              className="category-header"
              onClick={() => toggleCategory(category)}
              style={{ borderLeftColor: color }}
            >
              <span className="category-arrow">{isExpanded ? '▼' : '▶'}</span>
              <span className="category-name">{category}</span>
              <span className="category-count">{symbols.length}</span>
            </button>
            {isExpanded && (
              <div className="category-symbols">
                {symbols.map((symbol) => (
                  <SymbolPaletteItem key={symbol.id} symbol={symbol} color={color} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
