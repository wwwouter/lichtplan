import { useState, useMemo, useCallback } from 'react'
import { useProjectStore } from '../stores/useProjectStore'
import { getSymbolById } from '../symbols'
import { useUIStore } from '../stores/useUIStore'

type SortDir = 'asc' | 'desc'
interface SortEntry { key: string; dir: SortDir }

export function ItemsListPopup() {
  const itemsListOpen = useUIStore((s) => s.itemsListOpen)
  const setItemsListOpen = useUIStore((s) => s.setItemsListOpen)
  const project = useProjectStore((s) => s.project)
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const [sorts, setSorts] = useState<SortEntry[]>([])

  const items = useMemo(() => {
    const floor = project.floors.find((f) => f.id === activeFloorId)
    if (!floor) return []
    return floor.symbols
      .filter((s) => s.symbolId !== 'tekst' && s.symbolId !== 'persoon')
      .map((s) => {
        const def = getSymbolById(s.symbolId)
        return {
          id: s.id,
          symbolId: s.symbolId,
          type: def?.name ?? s.symbolId,
          label: s.label ?? '',
          group: s.group ?? '',
          location: s.location ?? '',
          description: s.description ?? '',
          itemId: s.itemId ?? ''
        }
      })
      .sort((a, b) => a.itemId.localeCompare(b.itemId, 'nl', { numeric: true }))
  }, [project, activeFloorId])

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      for (const s of sorts) {
        const av = (a as Record<string, string>)[s.key] ?? ''
        const bv = (b as Record<string, string>)[s.key] ?? ''
        const cmp = av.localeCompare(bv, 'nl')
        if (cmp !== 0) return s.dir === 'asc' ? cmp : -cmp
      }
      return 0
    })
  }, [items, sorts])

  const toggleSort = useCallback(
    (key: string) => {
      setSorts((prev) => {
        const idx = prev.findIndex((s) => s.key === key)
        if (idx === -1) {
          return [...prev, { key, dir: 'asc' as SortDir }]
        }
        const lastIdx = prev.length - 1
        if (idx !== lastIdx) {
          const next = prev.filter((s) => s.key !== key)
          return [...next, { key, dir: 'asc' as SortDir }]
        }
        const entry = prev[idx]
        const next = prev.slice(0, lastIdx)
        if (entry.dir === 'asc') {
          return [...next, { key, dir: 'desc' as SortDir }]
        }
        return next
      })
    },
    []
  )

  function quoteTSV(value: string): string {
    if (value.includes('\t') || value.includes('\n') || value.includes('"')) {
      return '"' + value.replace(/"/g, '""') + '"'
    }
    return value
  }

  const tableLines = sortedItems
    .map(
      (i) =>
        `${quoteTSV(i.itemId)}\t${quoteTSV(i.type)}\t${quoteTSV(i.label)}\t${quoteTSV(i.group)}\t${quoteTSV(i.location)}\t${quoteTSV(i.description)}`
    )
    .join('\n')
  const text = `Num\tType\tLabel\tGroep\tLocatie\tOmschrijving\n${tableLines}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // noop
    }
  }

  if (!itemsListOpen) return null

  const SortableHeader = ({ colKey, label }: { colKey: string; label: string }) => {
    const idx = sorts.findIndex((s) => s.key === colKey)
    const isSorted = idx !== -1
    const dir = isSorted ? sorts[idx].dir : null
    const orderNum = isSorted && sorts.length > 1 ? idx + 1 : null

    return (
      <th
        className={`items-list-sortable-header${isSorted ? ' sorted' : ''}`}
        onClick={() => toggleSort(colKey)}
        title="Sorteren"
      >
        {label}
        {dir && (dir === 'asc' ? ' ↑' : ' ↓')}
        {orderNum != null && <span className="sort-order">{orderNum}</span>}
      </th>
    )
  }

  return (
    <div className="dialog-overlay" onClick={() => setItemsListOpen(false)}>
      <div className="dialog items-list-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Items op deze vloer ({sortedItems.length})</div>
        <div className="items-list-table-wrapper">
          <table className="items-list-table">
            <thead>
              <tr>
                <SortableHeader colKey="itemId" label="Num" />
                <SortableHeader colKey="type" label="Type" />
                <SortableHeader colKey="label" label="Label" />
                <SortableHeader colKey="group" label="Groep" />
                <SortableHeader colKey="location" label="Locatie" />
                <SortableHeader colKey="description" label="Omschrijving" />
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.itemId}</td>
                  <td>{item.type}</td>
                  <td>{item.label}</td>
                  <td>{item.group}</td>
                  <td className="items-list-location">
                    {item.location.split('\n').map((line, idx, arr) => (
                      <span key={idx}>
                        {line}
                        {idx < arr.length - 1 && <br />}
                      </span>
                    ))}
                  </td>
                  <td className="items-list-location">
                    {item.description.split('\n').map((line, idx, arr) => (
                      <span key={idx}>
                        {line}
                        {idx < arr.length - 1 && <br />}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
              {sortedItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="items-list-empty">
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
          <button className="dialog-btn primary" onClick={handleCopy} disabled={sortedItems.length === 0}>
            Kopiëren naar klembord
          </button>
        </div>
      </div>
    </div>
  )
}
