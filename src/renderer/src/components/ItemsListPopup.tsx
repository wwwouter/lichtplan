import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useProjectStore } from '../stores/useProjectStore'
import { getSymbolById } from '../symbols'
import { useUIStore } from '../stores/useUIStore'

type SortDir = 'asc' | 'desc'
interface SortEntry { key: string; dir: SortDir }

function makeKey(id: string, field: string) { return `${id}|${field}` }
function parseKey(key: string) { const [id, field] = key.split('|'); return { id, field } }

export function ItemsListPopup() {
  const itemsListOpen = useUIStore((s) => s.itemsListOpen)
  const setItemsListOpen = useUIStore((s) => s.setItemsListOpen)
  const project = useProjectStore((s) => s.project)
  const activeFloorId = useProjectStore((s) => s.activeFloorId)
  const updateSymbol = useProjectStore((s) => s.updateSymbol)
  const [sorts, setSorts] = useState<SortEntry[]>([])
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [multiEditField, setMultiEditField] = useState<string | null>(null)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [lastClickedKey, setLastClickedKey] = useState<string | null>(null)

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

  const clearSelection = useCallback(() => {
    setSelectedKeys(new Set())
    setMultiEditField(null)
    setEditingKey(null)
    setLastClickedKey(null)
  }, [])

  const handleCellClick = useCallback(
    (e: React.MouseEvent, id: string, field: string) => {
      const key = makeKey(id, field)

      if (e.shiftKey) {
        e.preventDefault()
        e.stopPropagation()

        if (multiEditField && field !== multiEditField) {
          // Shift into a different column — start fresh with single
          setSelectedKeys(new Set([key]))
          setMultiEditField(field)
          setEditingKey(null)
          setLastClickedKey(key)
          return
        }

        if (lastClickedKey) {
          const anchor = parseKey(lastClickedKey)
          const keysInColumn = sortedItems.map((i) => makeKey(i.id, field))
          const startIdx = keysInColumn.indexOf(lastClickedKey)
          const endIdx = keysInColumn.indexOf(key)

          if (startIdx !== -1 && endIdx !== -1) {
            const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx]
            const rangeKeys = keysInColumn.slice(from, to + 1)

            setSelectedKeys((prev) => {
              const next = new Set(prev)
              if (anchor.field !== field) {
                next.clear()
              }
              rangeKeys.forEach((k) => next.add(k))
              return next
            })
            setMultiEditField(field)
            setEditingKey(null)
            return
          }
        }

        // No last clicked key — start a new selection
        setSelectedKeys(new Set([key]))
        setMultiEditField(field)
        setEditingKey(null)
        setLastClickedKey(key)
        return
      }

      if (e.metaKey || e.ctrlKey) {
        e.preventDefault()
        e.stopPropagation()

        if (multiEditField && multiEditField !== field) {
          // Different column — start fresh
          setSelectedKeys(new Set([key]))
          setMultiEditField(field)
          setEditingKey(null)
          return
        }

        setSelectedKeys((prev) => {
          const next = new Set(prev)
          if (next.has(key)) {
            next.delete(key)
            return next.size > 0 ? next : new Set()
          }
          next.add(key)
          return next
        })
        setMultiEditField(field)
        setEditingKey(null)
        setLastClickedKey(key)
        return
      }

      // Normal click — if the clicked cell is already selected, enter edit mode for the selection
      if (selectedKeys.has(key) && selectedKeys.size > 0) {
        setEditingKey(key)
        setLastClickedKey(key)
        return
      }

      // Otherwise, single-cell edit (no selection)
      clearSelection()
      setEditingKey(key)
      setLastClickedKey(key)
    },
    [multiEditField, selectedKeys, clearSelection, lastClickedKey, sortedItems]
  )

  const handleSave = useCallback(
    (key: string, nextValue: string) => {
      const { id, field } = parseKey(key)
      const trimmed = nextValue.trim()

      if (selectedKeys.size > 1 && selectedKeys.has(key)) {
        // Multi-edit: apply to all selected cells in the same column
        selectedKeys.forEach((k) => {
          const target = parseKey(k)
          const val = k === key ? trimmed : trimmed  // same value for all
          if (field === 'itemId') {
            if (isDuplicateItemId(target.id, val)) return
            updateSymbol(activeFloorId, target.id, { itemId: val || undefined })
          } else {
            updateSymbol(activeFloorId, target.id, { [field]: val || undefined })
          }
        })
        clearSelection()
        return
      }

      // Single-cell save
      if (field === 'itemId') {
        if (isDuplicateItemId(id, trimmed)) {
          setEditingKey(null)
          return
        }
        updateSymbol(activeFloorId, id, { itemId: trimmed || undefined })
      } else {
        updateSymbol(activeFloorId, id, { [field]: trimmed || undefined })
      }
      setEditingKey(null)
    },
    [selectedKeys, activeFloorId, updateSymbol, isDuplicateItemId, clearSelection]
  )

  // Handle Cmd+A / Ctrl+A to select all cells in the same column
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection()
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        // Only intercept if the focus is inside the popup table and we're in an editing field
        const active = document.activeElement
        if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
          // Allow native select-all inside input/textarea
          return
        }
        e.preventDefault()
        if (multiEditField) {
          const all = sortedItems.map((i) => makeKey(i.id, multiEditField))
          setSelectedKeys(new Set(all))
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [multiEditField, sortedItems, clearSelection])

  if (!itemsListOpen) return null

  const SortableHeader = ({ colKey, label }: { colKey: string; label: string }) => {
    const idx = sorts.findIndex((s) => s.key === colKey)
    const isSorted = idx !== -1
    const dir = isSorted ? sorts[idx].dir : null
    const orderNum = isSorted && sorts.length > 1 ? idx + 1 : null
    const isMulti = multiEditField === colKey

    return (
      <th
        className={`items-list-sortable-header${isSorted ? ' sorted' : ''}${isMulti ? ' multi-active' : ''}`}
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
    const key = makeKey(item.id, field)
    const isEditing = editingKey === key
    const isSelected = selectedKeys.has(key)
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
      const multiHint = selectedKeys.size > 1 ? ` (${selectedKeys.size} items)` : ''
      if (multiline) {
        return (
          <textarea
            ref={textareaRef}
            className="items-list-cell-textarea"
            defaultValue={value}
            rows={2}
            title={`Bewerken${multiHint}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleSave(key, e.currentTarget.value)
              }
              if (e.key === 'Escape') {
                clearSelection()
              }
            }}
            onBlur={(e) => handleSave(key, e.target.value)}
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
          title={`Bewerken${multiHint}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave(key, e.currentTarget.value)
            }
            if (e.key === 'Escape') {
              clearSelection()
            }
          }}
          onBlur={(e) => handleSave(key, e.target.value)}
        />
      )
    }

    const cellClass = isSelected ? 'items-list-cell-selected' : ''

    if (multiline) {
      return (
        <span
          className={cellClass}
          onClick={(e) => handleCellClick(e, item.id, field)}
        >
          {value.split('\n').map((line, idx, arr) => (
            <span key={idx}>
              {line}
              {idx < arr.length - 1 && <br />}
            </span>
          ))}
        </span>
      )
    }

    return (
      <span
        className={cellClass}
        onClick={(e) => handleCellClick(e, item.id, field)}
      >
        {value}
      </span>
    )
  }

  return (
    <div className="dialog-overlay" onClick={() => setItemsListOpen(false)}>
      <div className="dialog items-list-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Items op deze vloer ({sortedItems.length})</div>
        {selectedKeys.size > 0 && (
          <div className="items-list-multi-hint">
            {selectedKeys.size} geselecteerd · Cmd+klik voor losse selectie · Shift+klik voor bereik · Klik om te bewerken · Escape om te annuleren
          </div>
        )}
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
