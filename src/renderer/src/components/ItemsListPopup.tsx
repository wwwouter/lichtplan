import { useProjectStore } from '../stores/useProjectStore'
import { getSymbolById } from '../symbols'
import { useUIStore } from '../stores/useUIStore'
import { useMemo } from 'react'

export function ItemsListPopup() {
  const itemsListOpen = useUIStore((s) => s.itemsListOpen)
  const setItemsListOpen = useUIStore((s) => s.setItemsListOpen)
  const project = useProjectStore((s) => s.project)
  const activeFloorId = useProjectStore((s) => s.activeFloorId)

  const items = useMemo(() => {
    const floor = project.floors.find((f) => f.id === activeFloorId)
    if (!floor) return []
    return floor.symbols.map((s) => {
      const def = getSymbolById(s.symbolId)
      return {
        id: s.id,
        symbolId: s.symbolId,
        type: def?.name ?? s.symbolId,
        label: s.label ?? '',
        group: s.group ?? '',
        location: s.location ?? ''
      }
    })
  }, [project, activeFloorId])

  if (!itemsListOpen) return null

  const tableLines = items.map((i) => `${i.type}\t${i.label}\t${i.group}\t${i.location}`).join('\n')
  const text = `Type\tLabel\tGroep\tLocatie\n${tableLines}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // noop
    }
  }

  return (
    <div className="dialog-overlay" onClick={() => setItemsListOpen(false)}>
      <div className="dialog items-list-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Items op deze vloer ({items.length})</div>
        <div className="items-list-table-wrapper">
          <table className="items-list-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Label</th>
                <th>Groep</th>
                <th>Locatie</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.type}</td>
                  <td>{item.label}</td>
                  <td>{item.group}</td>
                  <td>{item.location}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="items-list-empty">
                    Geen items op deze vloer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="dialog-actions">
          <button className="dialog-btn" onClick={() => setItemsListOpen(false)}>
            Sluiten
          </button>
          <button className="dialog-btn primary" onClick={handleCopy} disabled={items.length === 0}>
            Kopiëren naar klembord
          </button>
        </div>
      </div>
    </div>
  )
}
