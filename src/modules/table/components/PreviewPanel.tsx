import { useEffect, useRef, useState } from 'react'
import type { TableModel, TableRow, BorderStyle } from '../lib/table/types'
import type { FormattingOptions } from '../lib/table/formatters/options'
import { formatValue } from '../lib/table/formatters/shared/formatValue'
import { TableEditorToolbar } from './TableEditorToolbar'
import type { StylePatch } from '../lib/table/editor/updateCellStyle'
import type { EditMode } from './TableEditorToolbar'
import type { TableNote, NoteStyle, NoteNumbering } from '../lib/table/types'

// Maps xcolor notation to CSS for Preview display
function bgToCss(bg: string): string {
  const map: Record<string, string> = {
    'gray!20': 'rgba(120,120,120,0.25)',
    'green!20': 'rgba(0,160,0,0.25)',
    'blue!15': 'rgba(30,100,255,0.2)',
    'yellow!20': 'rgba(220,180,0,0.3)',
    'red!15': 'rgba(220,50,50,0.22)',
  }
  return map[bg] ?? bg
}

type EditHandlers = {
  onCellChange: (rowId: string, cellId: string, value: string) => void
  onAddRowAbove: (rowId: string) => void
  onAddRowBelow: (rowId: string) => void
  onDeleteRow: (rowId: string) => void
  onAddColumnLeft: (colIdx: number) => void
  onAddColumnRight: (colIdx: number) => void
  onDeleteColumn: (colIdx: number) => void
  onRowBorderChange: (rowId: string, border: BorderStyle) => void
  onCellSelect: (cellId: string, rowIdx: number, colIdx: number, isShift: boolean) => void
  onStyleChange: (patch: StylePatch) => void
  onClearFormatting: () => void
  onSelectAll: () => void
  onSelectRow: (rowIdx: number) => void
  onSelectColumn: (colIdx: number) => void
  selectedColIndices: number[]
  hiddenColumnIndices: number[]
  hiddenColumnNames: string[]
  onHideColumns: () => void
  onShowColumn: (colIdx: number) => void
  onShowAllColumns: () => void
  onEditModeChange: (mode: EditMode) => void
  onAttachNote: (marker: string) => void
  onCreateAndAttachNote: () => void
  onCaptionChange: (title: string) => void
  onLabelChange: (label: string) => void
  onAddNote: () => void
  onUpdateNote: (id: string, patch: Partial<TableNote>) => void
  onRemoveNote: (id: string) => void
  onDetachNoteFromCells: (noteId: string) => void
  canDetachNote: (note: TableNote) => boolean
  onChangeNoteStyle: (style: NoteStyle) => void
  onChangeNoteNumbering: (numbering: NoteNumbering) => void
}

type Props = EditHandlers & {
  model: TableModel
  options: FormattingOptions
  viewMode: 'preview' | 'edit'
  onViewModeChange: (mode: 'preview' | 'edit') => void
  selectedCellIds: Set<string>
  selectedCells: import('../lib/table/types').TableCell[]
  editMode: EditMode
}

const MIN_ZOOM = 0.45

export function PreviewPanel({
  model,
  options,
  viewMode,
  onViewModeChange,
  onCellChange,
  onCellSelect,
  onStyleChange,
  onClearFormatting,
  onSelectAll,
  onSelectRow,
  onSelectColumn,
  selectedColIndices,
  hiddenColumnIndices,
  hiddenColumnNames,
  onHideColumns,
  onShowColumn,
  onShowAllColumns,
  onEditModeChange,
  onAttachNote,
  onCreateAndAttachNote,
  onCaptionChange,
  onLabelChange,
  onAddNote,
  onUpdateNote,
  onRemoveNote,
  onDetachNoteFromCells,
  canDetachNote,
  onChangeNoteStyle,
  onChangeNoteNumbering,
  onAddRowAbove,
  onAddRowBelow,
  onDeleteRow,
  onAddColumnLeft,
  onAddColumnRight,
  onDeleteColumn,
  onRowBorderChange,
  selectedCellIds,
  selectedCells,
  editMode,
}: Props) {
  // In Preview mode always use formatted display; in Edit mode respect editMode
  const effectiveEditMode: EditMode = viewMode === 'edit' ? editMode : 'output'
  const visibleRows = model.rows.filter((r) => !r.cells.every((c) => c.hidden))
  const visibleColCount = visibleRows[0]?.cells.filter((c) => !c.hidden).length ?? 0

  const lastRowId = visibleRows[visibleRows.length - 1]?.id ?? ''

  // Note triangle badge toggle (local UI state, Edit mode only)
  const [showNoteTriangle, setShowNoteTriangle] = useState(false)

  // Caption/Label local state (immediate display, debounce propagated to model via props)
  const [captionInput, setCaptionInput] = useState(model.title)
  const [labelInput, setLabelInput] = useState(model.label)
  useEffect(() => setCaptionInput(model.title), [model.title])
  useEffect(() => setLabelInput(model.label), [model.label])

  // Drag selection state
  // isDraggingRef: used in event handlers (avoids stale closure)
  // isDragging: used for user-select style (triggers re-render)
  const isDraggingRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const endDrag = () => {
      isDraggingRef.current = false
      setIsDragging(false)
    }
    document.addEventListener('mouseup', endDrag)
    return () => document.removeEventListener('mouseup', endDrag)
  }, [])

  // Scroll add-row button into view when rows increase in Edit mode
  const addRowBtnRef = useRef<HTMLButtonElement>(null)
  const prevRowCountRef = useRef(model.rows.length)
  useEffect(() => {
    if (viewMode === 'edit' && model.rows.length > prevRowCountRef.current) {
      addRowBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
    prevRowCountRef.current = model.rows.length
  }, [model.rows.length, viewMode])

  // Auto-zoom: shrink table to fit container width when columns overflow
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const zoomTargetRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)

  useEffect(() => {
    function applyZoom() {
      const container = tableContainerRef.current
      const zoomTarget = zoomTargetRef.current
      const table = tableRef.current
      if (!container || !zoomTarget || !table) return

      // Reset zoom to measure natural table width
      zoomTarget.style.zoom = '1'

      requestAnimationFrame(() => {
        if (!container || !zoomTarget || !table) return
        const naturalW = table.scrollWidth
        const containerW = container.clientWidth
        if (naturalW > containerW && containerW > 0) {
          const zoom = Math.max(MIN_ZOOM, containerW / naturalW)
          zoomTarget.style.zoom = String(zoom)
        } else {
          zoomTarget.style.zoom = '1'
        }
      })
    }

    applyZoom()

    const ro = new ResizeObserver(applyZoom)
    if (tableContainerRef.current) ro.observe(tableContainerRef.current)
    return () => ro.disconnect()
  }, [visibleColCount, viewMode])

  // Check whether a column has any non-empty content
  function colHasContent(colIdx: number): boolean {
    return model.rows.some((row) => (row.cells[colIdx]?.value ?? '').trim() !== '')
  }

  function handleDeleteLastRow() {
    const last = [...visibleRows].reverse().find((r) => r.rowType !== 'header')
    if (!last) return
    const hasContent = last.cells.some((c) => c.value.trim() !== '')
    if (!hasContent || window.confirm('入力内容のある行を削除しますか？')) {
      onDeleteRow(last.id)
    }
  }

  function handleDeleteLastColumn() {
    const lastIdx = visibleColCount - 1
    const hasContent = colHasContent(lastIdx)
    if (!hasContent || window.confirm('入力内容のある列を削除しますか？')) {
      onDeleteColumn(lastIdx)
    }
  }

  return (
    <div className="card" style={{ padding: 0, minWidth: 0 }}>
      {/* Sticky header — stays visible while scrolling table */}
      <div
        style={{
          position: 'sticky',
          top: '70px',
          zIndex: 5,
          background: 'var(--card)',
          borderRadius: 'var(--r) var(--r) 0 0',
          padding: '1.25rem 1.5rem 0',
          borderBottom: viewMode === 'edit' ? '1px solid var(--border)' : 'none',
          paddingBottom: viewMode === 'edit' ? '0.75rem' : '0',
        }}
      >
        <PanelHeader viewMode={viewMode} onViewModeChange={onViewModeChange} />

        {viewMode === 'edit' && (
          <TableEditorToolbar
            onAddRow={() => onAddRowBelow(lastRowId)}
            onDeleteLastRow={handleDeleteLastRow}
            onAddColumn={() => onAddColumnRight(visibleColCount - 1)}
            onDeleteLastColumn={handleDeleteLastColumn}
            selectedCells={selectedCells}
            selectedColIndices={selectedColIndices}
            hiddenColumnIndices={hiddenColumnIndices}
            hiddenColumnNames={hiddenColumnNames}
            onStyleChange={onStyleChange}
            onClearFormatting={onClearFormatting}
            onSelectAll={onSelectAll}
            notes={model.notes ?? []}
            onAttachNote={onAttachNote}
            onCreateAndAttachNote={onCreateAndAttachNote}
            onHideColumns={onHideColumns}
            onShowColumn={onShowColumn}
            onShowAllColumns={onShowAllColumns}
            editMode={editMode}
            onEditModeChange={onEditModeChange}
          />
        )}
      </div>

      {visibleRows.length === 0 ? (
        <div style={{ padding: '1.25rem 1.5rem' }}><EmptyState /></div>
      ) : (
        <div style={{ padding: '0.75rem 1.5rem 1.25rem' }}>

          {/*
            Layout:
            ┌─────────────────────────────┐ ┌──┐
            │ tableContainerRef (flex:1)   │ │  │
            │  zoomTargetRef (zoom here)   │ │＋│ ← right-side button (outside zoom)
            │   <table>                    │ │  │
            │  add-row button              │ │  │
            └─────────────────────────────┘ └──┘
            Right-side button is a flex sibling of tableContainerRef,
            completely outside zoom — no overlap with table content.
          */}
          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'stretch' }}>

            {/* tableContainerRef: flex:1, constrained width, overflow:hidden for zoom */}
            <div ref={tableContainerRef} style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>

              {/* zoomTargetRef: zoom CSS applied here — contains ONLY the table */}
              <div ref={zoomTargetRef}>
                <table
                  ref={tableRef}
                  style={{
                    borderCollapse: 'collapse',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    minWidth: '100%',
                    userSelect: isDragging ? 'none' : 'auto',
                    width: 'auto',
                  }}
                >
                  <tbody>
                    {/* Column controls row — Edit mode only */}
                    {viewMode === 'edit' && (
                      <tr>
                        <td style={{ width: '3.5rem' }} />
                        {Array.from({ length: visibleColCount }, (_, colIdx) => (
                          <td key={colIdx} style={{ textAlign: 'center', padding: '2px 4px', cursor: 'default' }}
                            onMouseDown={(e) => {
                              if ((e.target as HTMLElement).closest('button')) return
                              e.preventDefault()
                              onSelectColumn(colIdx)
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                              <EBtn
                                title="左に列を追加"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => onAddColumnLeft(colIdx)}
                              >
                                ←＋
                              </EBtn>
                              <EBtn
                                title="列を削除"
                                danger
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  const hasContent = colHasContent(colIdx)
                                  if (!hasContent || window.confirm('入力内容のある列を削除しますか？')) {
                                    onDeleteColumn(colIdx)
                                  }
                                }}
                              >
                                ✕
                              </EBtn>
                              <EBtn
                                title="右に列を追加"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => onAddColumnRight(colIdx)}
                              >
                                ＋→
                              </EBtn>
                            </div>
                          </td>
                        ))}
                      </tr>
                    )}

                    {/* Data rows */}
                    {visibleRows.map((row, rowIdx) => (
                      <DataRow
                        key={row.id}
                        row={row}
                        modelRowIdx={model.rows.findIndex((r) => r.id === row.id)}
                        isFirst={rowIdx === 0}
                        isLast={rowIdx === visibleRows.length - 1}
                        viewMode={viewMode}
                        editMode={effectiveEditMode}
                        options={options}
                        selectedCellIds={selectedCellIds}
                        isDraggingRef={isDraggingRef}
                        showNoteTriangle={showNoteTriangle}
                        onCellChange={onCellChange}
                        onCellSelect={onCellSelect}
                        onSelectRow={onSelectRow}
                        onStartDrag={() => { isDraggingRef.current = true; setIsDragging(true) }}
                        onAddRowAbove={() => onAddRowAbove(row.id)}
                        onAddRowBelow={() => onAddRowBelow(row.id)}
                        onDeleteRow={() => onDeleteRow(row.id)}
                        onRowBorderChange={(border) => onRowBorderChange(row.id, border)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>{/* /zoomTarget */}

              {/* Add-row button: outside zoom, always full size */}
              {viewMode === 'edit' && (
                <button
                  ref={addRowBtnRef}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onAddRowBelow(lastRowId)}
                  style={{
                    width: '100%',
                    marginTop: '0.375rem',
                    height: '28px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    border: '1.5px dashed var(--border)',
                    borderRadius: 'var(--rs)',
                    background: 'transparent',
                    color: 'var(--text-light)',
                    cursor: 'pointer',
                    transition: 'all .15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)'
                    e.currentTarget.style.color = 'var(--accent)'
                    e.currentTarget.style.background = 'var(--accent-light)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.color = 'var(--text-light)'
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  ＋ 行を追加
                </button>
              )}
            </div>{/* /tableContainerRef */}

            {/* Right-side add-column button: outside zoom AND outside tableContainerRef */}
            {viewMode === 'edit' && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onAddColumnRight(visibleColCount - 1)}
                title="列を追加"
                style={{
                  width: '28px',
                  flexShrink: 0,
                  border: '1.5px dashed var(--border)',
                  borderRadius: 'var(--rs)',
                  background: 'transparent',
                  color: 'var(--text-light)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all .15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.color = 'var(--accent)'
                  e.currentTarget.style.background = 'var(--accent-light)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text-light)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                ＋
              </button>
            )}
          </div>{/* /outer flex */}

          {model.label && (
            <p className="text-xs mt-2" style={{ color: 'var(--text-light)' }}>
              \label{'{' + model.label + '}'}
            </p>
          )}

          {/* Caption / Label (outside sticky — reduces sticky header height) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
            <CaptionField label="Caption" value={captionInput} placeholder="表のタイトルを入力..."
              onChange={(v) => { setCaptionInput(v); onCaptionChange(v) }} />
            <CaptionField label="Label" value={labelInput} placeholder="tab:result"
              onChange={(v) => { setLabelInput(v); onLabelChange(v) }} />
          </div>

          {/* Notes management UI */}
          <NotesManager
            notes={model.notes ?? []}
            noteStyle={model.noteStyle ?? 'tnote'}
            noteNumbering={model.noteNumbering ?? 'alpha'}
            viewMode={viewMode}
            showNoteTriangle={showNoteTriangle}
            onToggleTriangle={() => setShowNoteTriangle(v => !v)}
            onAddNote={onAddNote}
            onUpdateNote={onUpdateNote}
            onRemoveNote={onRemoveNote}
            onDetachNoteFromCells={onDetachNoteFromCells}
            canDetachNote={canDetachNote}
            onChangeNoteStyle={onChangeNoteStyle}
            onChangeNoteNumbering={onChangeNoteNumbering}
          />
        </div>
      )}
    </div>
  )
}

type DataRowProps = {
  row: TableRow
  modelRowIdx: number
  isFirst: boolean
  isLast: boolean
  viewMode: 'preview' | 'edit'
  editMode: EditMode
  options: FormattingOptions
  selectedCellIds: Set<string>
  isDraggingRef: React.MutableRefObject<boolean>
  showNoteTriangle: boolean
  onCellChange: (rowId: string, cellId: string, value: string) => void
  onCellSelect: (cellId: string, rowIdx: number, colIdx: number, isShift: boolean) => void
  onSelectRow: (rowIdx: number) => void
  onStartDrag: () => void
  onAddRowAbove: () => void
  onAddRowBelow: () => void
  onDeleteRow: () => void
  onRowBorderChange: (border: BorderStyle) => void
}

function DataRow({
  row,
  modelRowIdx,
  isFirst,
  isLast,
  viewMode,
  editMode,
  options,
  selectedCellIds,
  isDraggingRef,
  showNoteTriangle,
  onCellChange,
  onCellSelect,
  onSelectRow,
  onStartDrag,
  onAddRowAbove,
  onAddRowBelow,
  onDeleteRow,
  onRowBorderChange,
}: DataRowProps) {
  const visibleCells = row.cells.filter((c) => !c.hidden)
  const rowHasContent = row.cells.some((c) => c.value.trim() !== '')

  const template = options.borderTemplate

  const borderTop = (() => {
    // First row always gets thick top border
    if (isFirst) return '2px solid var(--text)'
    // Row-level override takes precedence
    if (row.topBorder === 'none') return undefined
    if (row.topBorder === 'hline' || row.topBorder === 'midrule') return '1px solid var(--text)'
    // Template-based: full → always, minimal → never intermediate, academic/classic → separator only
    if (template === 'full') return '1px solid var(--text)'
    if (template === 'minimal') return undefined
    if (row.separatorTop) return '1px solid var(--text)'
    return undefined
  })()

  const borderBottom = (() => {
    // Last row always gets thick bottom border
    if (isLast) return '2px solid var(--text)'
    // Row-level override takes precedence
    if (row.bottomBorder === 'none') return undefined
    if (row.bottomBorder === 'hline' || row.bottomBorder === 'midrule') return '1px solid var(--text)'
    // Template-based
    if (template === 'full') return '1px solid var(--text)'
    if (template === 'minimal') return undefined
    if (row.separatorBottom) return '1px solid var(--text)'
    return undefined
  })()

  return (
    <tr>
      {/* Row controls — Edit mode only */}
      {viewMode === 'edit' && (
        <td
          title="クリックで行を全選択"
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).closest('button, select')) return
            e.preventDefault()
            onSelectRow(modelRowIdx)
          }}
          style={{
            width: '3.5rem',
            padding: '2px',
            verticalAlign: 'middle',
            cursor: 'default',
            borderTop,
            borderBottom,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            <EBtn
              title="上に行を追加"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onAddRowAbove}
            >
              ＋↑
            </EBtn>
            {row.rowType !== 'header' && (
              <EBtn
                title="行を削除"
                danger
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (!rowHasContent || window.confirm('入力内容のある行を削除しますか？')) {
                    onDeleteRow()
                  }
                }}
              >
                ✕
              </EBtn>
            )}
            <EBtn
              title="下に行を追加"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onAddRowBelow}
            >
              ＋↓
            </EBtn>
            {/* Border select */}
            <select
              title="下罫線"
              value={row.bottomBorder ?? 'none'}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => onRowBorderChange(e.target.value as BorderStyle)}
              style={{
                marginTop: '4px',
                fontSize: '0.7rem',
                padding: '2px 4px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                background: 'var(--card)',
                color: 'var(--text)',
                cursor: 'pointer',
                maxWidth: '3.5rem',
              }}
            >
              <option value="none">–</option>
              <option value="hline">\hline</option>
              <option value="midrule">\midrule</option>
            </select>
          </div>
        </td>
      )}

      {/* Data cells */}
      {visibleCells.map((cell, visibleColIdx) => {
        const Tag = row.rowType === 'header' ? 'th' : 'td'
        // Source mode shows cell.value directly; Output mode applies formatValue to data cells
        const displayValue = (editMode === 'source' || row.rowType === 'header')
          ? cell.value
          : formatValue(cell.value, options)
        const isEditable = viewMode === 'edit'
        const isSelected = isEditable && selectedCellIds.has(cell.id)
        // Use visible index as model col index (hidden cells not yet implemented)
        const modelColIdx = row.cells.findIndex((c) => c.id === cell.id)
        const baseBg = cell.backgroundColor ? bgToCss(cell.backgroundColor) : 'transparent'
        const hasNoteMarkers = isEditable && (cell.noteMarkers ?? []).length > 0

        return (
          <Tag
            key={cell.id}
            className={[
              hasNoteMarkers ? 'cell-note-text' : '',
              hasNoteMarkers && showNoteTriangle ? 'cell-note-triangle' : '',
            ].filter(Boolean).join(' ') || undefined}
            data-markers={hasNoteMarkers ? cell.noteMarkers!.join(',') : undefined}
            title={hasNoteMarkers ? `注釈: ${cell.noteMarkers!.join(', ')}` : undefined}
            contentEditable={isEditable ? 'plaintext-only' : undefined}
            suppressContentEditableWarning
            onMouseDown={(e) => {
              if (!isEditable) return
              if (e.shiftKey) {
                // shift+click: extend rectangle, strict e.preventDefault (req.2)
                e.preventDefault()
                onCellSelect(cell.id, modelRowIdx, modelColIdx, true)
              } else {
                // normal click: allow contentEditable focus, start potential drag
                onCellSelect(cell.id, modelRowIdx, modelColIdx, false)
                onStartDrag()
              }
            }}
            onMouseEnter={(e) => {
              // drag extension: strict e.preventDefault to stop caret jumping (req.2)
              if (isEditable && isDraggingRef.current) {
                e.preventDefault()
                onCellSelect(cell.id, modelRowIdx, modelColIdx, true)
              }
            }}
            onKeyDown={
              isEditable
                ? (e) => {
                    if (e.key === 'Enter' && e.shiftKey) {
                      e.preventDefault()
                      document.execCommand('insertText', false, '\n')
                    } else if (e.key === 'Enter') {
                      e.preventDefault()
                    }
                  }
                : undefined
            }
            onPaste={
              isEditable
                ? (e) => {
                    e.preventDefault()
                    const text = e.clipboardData.getData('text/plain')
                    document.execCommand('insertText', false, text)
                  }
                : undefined
            }
            onBlur={
              isEditable
                ? (e) => {
                    const newValue = e.currentTarget.textContent ?? ''
                    if (newValue !== cell.value) {
                      onCellChange(row.id, cell.id, newValue)
                    }
                  }
                : undefined
            }
            style={{
              padding: '0.35rem 0.75rem',
              textAlign: cell.align ?? 'left',
              fontWeight: cell.bold ? 700 : row.rowType === 'header' ? 600 : 400,
              fontStyle: cell.italic ? 'italic' : 'normal',
              textDecoration: cell.underline ? 'underline' : 'none',
              borderTop,
              borderBottom,
              color: 'var(--text)',
              whiteSpace: cell.value.includes('\n') ? 'pre-wrap' : 'nowrap',
              outline: isSelected ? '2px solid var(--accent)' : 'none',
              outlineOffset: '-2px',
              cursor: isEditable ? 'text' : 'default',
              transition: 'background .1s',
              backgroundColor: baseBg,
              position: hasNoteMarkers ? 'relative' : undefined,
            }}
            onFocus={
              isEditable
                ? (e) => { e.currentTarget.style.backgroundColor = 'var(--accent-light)' }
                : undefined
            }
            onBlurCapture={
              isEditable
                ? (e) => { e.currentTarget.style.backgroundColor = baseBg }
                : undefined
            }
          >
            {/* Preview mode: show value + note superscripts; \n → <br> */}
            {isEditable ? displayValue : (
              <>
                {displayValue.includes('\n')
                  ? displayValue.split('\n').flatMap((line, i, arr) =>
                      i < arr.length - 1 ? [line, <br key={i} />] : [line]
                    )
                  : displayValue}
                {(cell.noteMarkers ?? []).map(m => (
                  <sup key={m} style={{ fontSize: '0.65em', color: 'var(--accent)', marginLeft: '1px', userSelect: 'none' }}>
                    {m}
                  </sup>
                ))}
              </>
            )}
          </Tag>
        )
        void visibleColIdx  // suppress unused warning
      })}
    </tr>
  )
}

/* ── Shared inline edit button ──────────────────────── */
type EBtnProps = {
  title?: string
  danger?: boolean
  children: React.ReactNode
  onClick?: () => void
  onMouseDown?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

function EBtn({ title, danger = false, children, onClick, onMouseDown }: EBtnProps) {
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseDown={onMouseDown}
      style={{
        minWidth: '28px',
        height: '28px',
        padding: '0 6px',
        fontSize: '0.75rem',
        fontWeight: 600,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${danger ? '#FECACA' : 'var(--border)'}`,
        borderRadius: '4px',
        background: danger ? '#FEF2F2' : 'var(--card)',
        color: danger ? '#EF4444' : 'var(--text-sub)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all .12s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = danger ? '#EF4444' : 'var(--accent)'
        e.currentTarget.style.color = danger ? '#EF4444' : 'var(--accent)'
        e.currentTarget.style.background = danger ? '#FEE2E2' : 'var(--accent-light)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = danger ? '#FECACA' : 'var(--border)'
        e.currentTarget.style.color = danger ? '#EF4444' : 'var(--text-sub)'
        e.currentTarget.style.background = danger ? '#FEF2F2' : 'var(--card)'
      }}
    >
      {children}
    </button>
  )
}

/* ── Caption / Label field ──────────────────────────── */
function CaptionField({ label, value, placeholder, onChange }: {
  label: string; value: string; placeholder: string; onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)',
        whiteSpace: 'nowrap', width: '3.5rem', textAlign: 'right' }}>
        {label}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1, padding: '3px 8px', fontSize: '0.8rem',
          border: '1px solid var(--border)', borderRadius: 'var(--rx)',
          background: '#FAFAFA', color: 'var(--text)', outline: 'none',
          transition: 'border-color .15s',
        }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--border-focus)' }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
      />
    </div>
  )
}

/* ── Panel header with mode toggle ─────────────────── */
function PanelHeader({
  viewMode,
  onViewModeChange,
}: {
  viewMode: 'preview' | 'edit'
  onViewModeChange: (m: 'preview' | 'edit') => void
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span
        className="flex items-center justify-center text-xs font-extrabold"
        style={{
          width: '1.375rem',
          height: '1.375rem',
          borderRadius: '50%',
          background: 'var(--accent-light)',
          color: 'var(--accent)',
        }}
      >
        2
      </span>
      <span
        className="text-xs font-bold uppercase"
        style={{ color: 'var(--text-light)', letterSpacing: '0.1em' }}
      >
        {viewMode === 'edit' ? 'Edit' : 'Preview'}
      </span>

      {/* Mode toggle */}
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          background: 'var(--bg)',
          borderRadius: 'var(--rx)',
          padding: '2px',
          gap: '2px',
          border: '1px solid var(--border)',
        }}
      >
        {(['preview', 'edit'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            style={{
              padding: '3px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: 'calc(var(--rx) - 1px)',
              border: 'none',
              cursor: 'pointer',
              background: viewMode === mode ? 'var(--card)' : 'transparent',
              color: viewMode === mode ? 'var(--accent)' : 'var(--text-sub)',
              boxShadow: viewMode === mode ? 'var(--shadow-sm)' : 'none',
              transition: 'all .18s',
            }}
          >
            {mode === 'preview' ? 'Preview' : 'Edit'}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Notes Manager ───────────────────────────────────── */
function NotesManager({
  notes, noteStyle, noteNumbering, viewMode,
  showNoteTriangle, onToggleTriangle,
  onAddNote, onUpdateNote, onRemoveNote, onDetachNoteFromCells, canDetachNote,
  onChangeNoteStyle, onChangeNoteNumbering,
}: {
  notes: TableNote[]
  noteStyle: NoteStyle
  noteNumbering: NoteNumbering
  viewMode: 'preview' | 'edit'
  showNoteTriangle: boolean
  onToggleTriangle: () => void
  onAddNote: () => void
  onUpdateNote: (id: string, patch: Partial<TableNote>) => void
  onRemoveNote: (id: string) => void
  onDetachNoteFromCells: (noteId: string) => void
  canDetachNote: (note: TableNote) => boolean
  onChangeNoteStyle: (s: NoteStyle) => void
  onChangeNoteNumbering: (n: NoteNumbering) => void
}) {
  if (viewMode === 'preview' && notes.length === 0) return null

  return (
    <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.625rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          Notes
        </span>
        {viewMode === 'edit' && (
          <>
            {/* Note style */}
            {(['tnote', 'footnote'] as const).map(s => (
              <button key={s} onMouseDown={e => e.preventDefault()} onClick={() => onChangeNoteStyle(s)}
                style={{
                  padding: '1px 8px', fontSize: '0.7rem', fontWeight: 600, borderRadius: 'var(--rx)',
                  border: 'none', cursor: 'pointer', transition: 'all .15s',
                  background: noteStyle === s ? 'var(--accent-light)' : 'var(--bg)',
                  color: noteStyle === s ? 'var(--accent)' : 'var(--text-sub)',
                }}>
                {s === 'tnote' ? '\\tnote' : '\\footnotemark'}
              </button>
            ))}
            <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
            {/* Numbering */}
            {(['alpha', 'numeric'] as const).map(n => (
              <button key={n} onMouseDown={e => e.preventDefault()} onClick={() => onChangeNoteNumbering(n)}
                style={{
                  padding: '1px 8px', fontSize: '0.7rem', fontWeight: 600, borderRadius: 'var(--rx)',
                  border: 'none', cursor: 'pointer', transition: 'all .15s',
                  background: noteNumbering === n ? 'var(--accent-light)' : 'var(--bg)',
                  color: noteNumbering === n ? 'var(--accent)' : 'var(--text-sub)',
                }}>
                {n === 'alpha' ? 'a,b,c…' : '1,2,3…'}
              </button>
            ))}
            <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
            {/* Triangle badge toggle (option A) */}
            <button onMouseDown={e => e.preventDefault()} onClick={onToggleTriangle}
              title={showNoteTriangle ? '三角バッジを非表示' : '三角バッジを表示（Excel スタイル）'}
              style={{
                padding: '1px 8px', fontSize: '0.7rem', fontWeight: 600, borderRadius: 'var(--rx)',
                border: 'none', cursor: 'pointer', transition: 'all .15s',
                background: showNoteTriangle ? 'var(--accent-light)' : 'var(--bg)',
                color: showNoteTriangle ? 'var(--accent)' : 'var(--text-sub)',
              }}>
              △
            </button>
          </>
        )}
      </div>

      {/* Note list */}
      {notes.map(note => (
        <div key={note.id} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '4px' }}>
          {/* Marker */}
          {viewMode === 'edit' ? (
            <input value={note.marker} onChange={e => onUpdateNote(note.id, { marker: e.target.value })}
              style={{ width: '36px', padding: '2px 4px', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center',
                border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--accent-light)',
                color: 'var(--accent)', outline: 'none' }} />
          ) : (
            <span style={{ width: '36px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)',
              textAlign: 'center', flexShrink: 0 }}>[{note.marker}]</span>
          )}
          {/* Text */}
          {viewMode === 'edit' ? (
            <input value={note.text} placeholder="注釈テキストを入力..."
              onChange={e => onUpdateNote(note.id, { text: e.target.value })}
              style={{ flex: 1, padding: '2px 6px', fontSize: '0.8rem',
                border: '1px solid var(--border)', borderRadius: '4px',
                background: '#FAFAFA', color: 'var(--text)', outline: 'none' }} />
          ) : (
            <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-sub)' }}>{note.text}</span>
          )}
          {/* Detach from selected cells */}
          {viewMode === 'edit' && (
            <button
              onMouseDown={e => e.preventDefault()}
              onClick={() => onDetachNoteFromCells(note.id)}
              disabled={!canDetachNote(note)}
              title="選択中のセルからマーカーを外す（注釈は残す）"
              style={{
                padding: '1px 6px', fontSize: '0.7rem', borderRadius: '4px', cursor: canDetachNote(note) ? 'pointer' : 'default',
                border: '1px solid var(--border)', background: 'var(--bg)',
                color: canDetachNote(note) ? 'var(--text-sub)' : 'var(--text-light)',
                opacity: canDetachNote(note) ? 1 : 0.4,
              }}>⊘</button>
          )}
          {/* Remove */}
          {viewMode === 'edit' && (
            <button onMouseDown={e => e.preventDefault()} onClick={() => onRemoveNote(note.id)}
              style={{ padding: '1px 6px', fontSize: '0.7rem', border: '1px solid #FECACA',
                borderRadius: '4px', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer' }}>✕</button>
          )}
        </div>
      ))}

      {/* Add note button */}
      {viewMode === 'edit' && (
        <button onMouseDown={e => e.preventDefault()} onClick={onAddNote}
          style={{ marginTop: '4px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600,
            border: '1.5px dashed var(--border)', borderRadius: 'var(--rx)',
            background: 'transparent', color: 'var(--text-light)', cursor: 'pointer', transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-light)' }}>
          ＋ 注釈を追加
        </button>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div
      className="flex items-center justify-center text-sm"
      style={{
        minHeight: '240px',
        border: '1.5px dashed var(--border)',
        borderRadius: 'var(--rs)',
        color: 'var(--text-light)',
      }}
    >
      Table preview will appear here
    </div>
  )
}
