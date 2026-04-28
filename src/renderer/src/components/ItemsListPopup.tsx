import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useProjectStore } from '../stores/useProjectStore'
import { getSymbolById } from '../symbols'
import { useUIStore } from '../stores/useUIStore'

type SortDir = 'asc' | 'desc'
interface SortEntry { key: string; dir: SortDir }

interface EditingCell { id: string; field: string }

export function ItemsListPopup() {
  const itemsListOpen = useUIStore((s) => s.itemsListOpen)
  const setItemsListOpen = useUIStore((s) => s.setItemsListOpen)
  const project = useProjectStore((s) => s.project)
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const updateSymbol = useProjectStore((s) => s.updateSymbol)
  const [sorts, setSorts] = useState<SortEntry[]>([])
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)

  const floor = project.floors.find((f) => f.id === activeFloorId)

  const isDuplicateItemId = useCallback(
    (symbolId: string, value: string) => {
      const trimmed = value.trim()
      if (!trimmed) return false
      return floor?.symbols.some((s) => s.id !== symbolId && s.itemId === trimmed) ?? false
    },
    [floor]
  )

  const items = useMemo(() => {
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
  }, [floor])

  const sortedItems = useMemo(() => {
    return [...items].sort((a: Record<string, string>, b: Record<string, string>) => {
      for (const s of sorts) {
        const av = a[s.key] ?? ''
        const bv = b[s.key] ?? ''
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

  const handleCellSave = (symbolId: string, field: string, _originalValue: string, nextValue: string) => {
    const trimmed = nextValue.trim()
    if (field === 'itemId') {
      if (isDuplicateItemId(symbolId, trimmed)) {
        setEditingCell(null)
        return
      }
      updateSymbol(activeFloorId, symbolId, { itemId: trimmed || undefined })
    } else {
      updateSymbol(activeFloorId, symbolId, { [field]: trimmed || undefined })
    }
    setEditingCell(null)
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

  function InlineCell({
    item,
    field,
    multiline = false
  }: {
    item: { id: string } & Record<string, string>
    field: string
    multiline?: boolean
  }) {
    const isEditing = editingCell?.id === item.id && editingCell?.field === field
    const value = item[field] ?? ''
    const inputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
      if (isEditing) {
        const el = multiline ? textareaRef.current : inputRef.current
        if (el) {
          el.focus()
          el.select()
        }
      }
    }, [isEditing, multiline])

    if (isEditing) {
      if (multiline) {
        return (
          <textarea
            ref={textareaRef}
            className="items-list-cell-textarea"
            defaultValue={value}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleCellSave(item.id, field, value, e.currentTarget.value)
              }
              if (e.key === 'Escape') {
                setEditingCell(null)
              }
            }}
            onBlur={(e) => handleCellSave(item.id, field, value, e.target.value)}
          />
        )
      }
      return (
        <input
          ref={inputRef}
          className="items-list-cell-input"
          type="text"
          defaultValue={value}
          maxLength={field === 'itemId' ? 3 : undefined}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCellSave(item.id, field, value, e.currentTarget.value)
            }
            if (e.key === 'Escape') {
              setEditingCell(null)
            }
          }}
          onBlur={(e) => handleCellSave(item.id, field, value, e.target.value)}
        />
      )
    }

    if (multiline) {
      return (
        <span onClick={() => setEditingCell({ id: item.id, field })}>
          {value.split('\n').map((line, idx, arr) => (
            <span key={idx}>
              {line}
              {idx < arr.length - 1 && <br />}
            </span>
          ))}
        </span>
      )
    }

    return <span onClick={() => setEditingCell({ id: item.id, field })}>{value}</span>
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
                  <td><InlineCell item={item} field="itemId" /></td>
                  <td>{item.type}</td>
                  <td><InlineCell item={item} field="label" /></td>
                  <td><InlineCell item={item} field="group" /></td>
                  <td className="items-list-location"><InlineCell item={item} field="location" multiline /></td>
                  <td className="items-list-location"><InlineCell item={item} field="description" multiline /></td>
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
