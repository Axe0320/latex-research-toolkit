import { useState, useMemo, useRef, useEffect } from 'react'
import './table.css'
import { Toast } from '../../shared/ui'
import { loadTableSession, saveTableSession } from './persistence'
import type { TableModel, BorderStyle } from './lib/table/types'
import { parseInput } from './lib/table/parser'
import { PreviewPanel } from './components/PreviewPanel'
import { latexGenerator } from './lib/table/generators/latexGenerator'
import { FormattingBar } from './components/FormattingBar'
import { type FormattingOptions, DEFAULT_OPTIONS } from './lib/table/formatters/options'
import { EXAMPLES } from './lib/example/examples'
import { InputPanel, type InputMode } from './components/InputPanel'
import {
  addRowAbove,
  addRowBelow,
  deleteRow,
  addColumnLeft,
  addColumnRight,
  deleteColumn,
  createEmptyTable,
  updateCellStyle,
  getCellsInRect,
  hideColumns,
  showColumn,
  showAllColumns,
  getHiddenColumnIndices,
  getColIndicesFromCellIds,
} from './lib/table/editor'
import type { StylePatch, CellAnchor } from './lib/table/editor'
import type { EditMode } from './components/TableEditorToolbar'
import type { TableNote, NoteStyle, NoteNumbering } from './lib/table/types'
import { appendRows, appendColumns, replaceWith } from './lib/table/merge/mergeTables'
import type { TableSource } from './lib/table/merge/sourceStack'
import { detect } from './lib/table/parser/detect'
import { parseExcel } from './lib/table/parser/parseExcel'
import { normalizeTable } from './lib/table/normalize'

function makeId(): string {
  return crypto.randomUUID()
}

const DUMMY_MODEL: TableModel = {
  id: 'dummy-initial',
  title: '',
  label: '',
  environment: 'table*',
  columns: ['Method', 'Accuracy', 'Precision', 'F1'],
  rows: [
    {
      id: makeId(),
      rowType: 'header',
      separatorBottom: true,
      cells: [
        { id: makeId(), value: 'Method', bold: true, align: 'center' },
        { id: makeId(), value: 'Accuracy', bold: true, align: 'center' },
        { id: makeId(), value: 'Precision', bold: true, align: 'center' },
        { id: makeId(), value: 'F1', bold: true, align: 'center' },
      ],
    },
    {
      id: makeId(),
      rowType: 'normal',
      cells: [
        { id: makeId(), value: 'Ours', align: 'left' },
        { id: makeId(), value: '0.924', align: 'right' },
        { id: makeId(), value: '0.918', align: 'right' },
        { id: makeId(), value: '0.911', align: 'right' },
      ],
    },
    {
      id: makeId(),
      rowType: 'normal',
      cells: [
        { id: makeId(), value: 'BERT', align: 'left' },
        { id: makeId(), value: '0.901', align: 'right' },
        { id: makeId(), value: '0.895', align: 'right' },
        { id: makeId(), value: '0.887', align: 'right' },
      ],
    },
    {
      id: makeId(),
      rowType: 'summary',
      separatorTop: true,
      cells: [
        { id: makeId(), value: 'Baseline', italic: true, align: 'left' },
        { id: makeId(), value: '0.872', align: 'right' },
        { id: makeId(), value: '0.864', align: 'right' },
        { id: makeId(), value: '0.859', align: 'right' },
      ],
    },
  ],
}

function TableModule() {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'input' | 'preview' | 'latex'>('input')

  // 複数表管理（IndexedDB `tableSessions` ストアに永続化。リロード後も保持される）
  const [tables, setTables] = useState<TableModel[]>([DUMMY_MODEL])
  const [activeTableId, setActiveTableId] = useState<string>(DUMMY_MODEL.id)
  const [sessionLoaded, setSessionLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadTableSession().then((session) => {
      if (cancelled) return
      if (session && session.tables.length > 0) {
        setTables(session.tables)
        const stillExists = session.tables.some((t) => t.id === session.activeTableId)
        setActiveTableId(stillExists ? session.activeTableId : session.tables[0]!.id)
      }
      setSessionLoaded(true)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!sessionLoaded) return
    const t = setTimeout(() => { saveTableSession({ tables, activeTableId }) }, 300)
    return () => clearTimeout(t)
  }, [tables, activeTableId, sessionLoaded])

  const model = useMemo(
    () => tables.find(t => t.id === activeTableId) ?? tables[0]!,
    [tables, activeTableId]
  )

  function setModel(updater: (prev: TableModel) => TableModel) {
    isDirtyRef.current = true
    setTables(prev => prev.map(t => {
      if (t.id !== activeTableId) return t
      const updated = updater(t)
      // updater が別の id を返しても activeTableId との一致を壊さないよう id は常に保持
      return updated.id === t.id ? updated : { ...updated, id: t.id }
    }))
  }

  function handleAddTable() {
    const newTable: TableModel = { id: makeId(), title: '', label: '', environment: 'table*', columns: [], rows: [] }
    setTables(prev => [...prev, newTable])
    setActiveTableId(newTable.id)
  }

  function handleDeleteTable(id: string) {
    if (tables.length <= 1) return
    const idx = tables.findIndex(t => t.id === id)
    const nextTable = tables[idx === 0 ? 1 : idx - 1]!
    setTables(prev => prev.filter(t => t.id !== id))
    if (id === activeTableId) setActiveTableId(nextTable.id)
  }

  const isDirtyRef = useRef(false)

  const [options, setOptions] = useState<FormattingOptions>(DEFAULT_OPTIONS)
  const [exampleIdx, setExampleIdx] = useState(0)
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview')
  const [selectedCellIds, setSelectedCellIds] = useState<Set<string>>(new Set())
  const [anchorCell, setAnchorCell] = useState<CellAnchor | null>(null)
  const [editMode, setEditMode] = useState<EditMode>('output')
  const [sources, setSources] = useState<TableSource[]>([])
  const [inputMode, setInputMode] = useState<InputMode>('paste')
  const [inputCollapsed, setInputCollapsed] = useState(false)
  const hasAutoCollapsed = useRef(false)

  // Auto-collapse Input when entering Edit mode in Paste mode (once per session)
  useEffect(() => {
    if (viewMode === 'edit' && inputMode === 'paste' && !hasAutoCollapsed.current) {
      setInputCollapsed(true)
      hasAutoCollapsed.current = true
    }
  }, [viewMode, inputMode])

  // Merge モードに切り替えたとき、まだ未編集なら行ゼロの空モデルに自動クリア
  useEffect(() => {
    if (inputMode !== 'merge') return
    if (isDirtyRef.current) return
    setModel(prev => ({ ...prev, columns: [], rows: [], notes: undefined }))
    clearSelection()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMode])
  const latex = useMemo(() => latexGenerator(model, options), [model, options])
  const latexAll = useMemo(
    () => tables.map(t => latexGenerator(t, options)).join('\n\n% --- table separator ---\n\n'),
    [tables, options]
  )


  const selectedCells = useMemo(
    () => model.rows.flatMap((row) => row.cells.filter((c) => selectedCellIds.has(c.id))),
    [model, selectedCellIds]
  )

  const hiddenColumnIndices = useMemo(() => getHiddenColumnIndices(model), [model])

  const hiddenColumnNames = useMemo(() => {
    const headerRow = model.rows.find((r) => r.rowType === 'header')
    return hiddenColumnIndices.map((colIdx) =>
      headerRow?.cells[colIdx]?.value || `列${colIdx + 1}`
    )
  }, [model, hiddenColumnIndices])

  const selectedColIndices = useMemo(
    () => getColIndicesFromCellIds(model, selectedCellIds),
    [model, selectedCellIds]
  )

  function handleHideColumns() {
    if (selectedColIndices.length === 0) return
    setModel((prev) => hideColumns(prev, selectedColIndices))
    clearSelection()
  }
  function handleShowColumn(colIdx: number) {
    setModel((prev) => showColumn(prev, colIdx))
  }
  function handleShowAllColumns() {
    setModel((prev) => showAllColumns(prev))
  }

  // ── Caption / Label debounce (with unmount cleanup) ──
  const captionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const labelDebounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (captionDebounceRef.current) clearTimeout(captionDebounceRef.current)
    if (labelDebounceRef.current)   clearTimeout(labelDebounceRef.current)
  }, [])

  function handleCaptionChange(title: string) {
    if (captionDebounceRef.current) clearTimeout(captionDebounceRef.current)
    captionDebounceRef.current = setTimeout(() => setModel(p => ({ ...p, title })), 300)
  }
  function handleLabelChange(label: string) {
    if (labelDebounceRef.current) clearTimeout(labelDebounceRef.current)
    labelDebounceRef.current = setTimeout(() => setModel(p => ({ ...p, label })), 300)
  }

  // ── Bulk selection ────────────────────────────────────
  function handleSelectRow(rowIdx: number) {
    const row = model.rows[rowIdx]
    if (!row) return
    setSelectedCellIds(new Set(row.cells.map(c => c.id)))  // includes hidden
    setAnchorCell(null)
  }
  function handleSelectColumn(colIdx: number) {
    const ids = new Set(
      model.rows.flatMap(row => row.cells[colIdx] ? [row.cells[colIdx]!.id] : [])
    )
    setSelectedCellIds(ids)
    setAnchorCell(null)
  }
  function handleSelectAll() {
    // Requirement: hidden cells are included (model全体基準)
    setSelectedCellIds(new Set(model.rows.flatMap(row => row.cells.map(c => c.id))))
    setAnchorCell(null)
  }

  // ── Notes ──────────────────────────────────────────────
  function getNextMarker(notes: TableNote[], numbering: NoteNumbering): string {
    const n = notes.length + 1
    if (numbering === 'numeric') return String(n)
    if (n <= 26) return String.fromCharCode(96 + n)
    const outer = String.fromCharCode(96 + Math.floor((n - 1) / 26))
    const inner = String.fromCharCode(96 + ((n - 1) % 26) + 1)
    return outer + inner
  }

  function handleAddNote() {
    const marker = getNextMarker(model.notes ?? [], model.noteNumbering ?? 'alpha')
    setModel(prev => ({
      ...prev,
      notes: [...(prev.notes ?? []), { id: crypto.randomUUID(), marker, text: '' }],
    }))
  }

  function handleUpdateNote(id: string, patch: Partial<TableNote>) {
    setModel(prev => ({
      ...prev,
      notes: (prev.notes ?? []).map(n => n.id === id ? { ...n, ...patch } : n),
    }))
  }

  function findCellById(cellId: string) {
    for (const row of model.rows) {
      const cell = row.cells.find(c => c.id === cellId)
      if (cell) return cell
    }
    return undefined
  }

  // invariant: note.marker must be unique across notes
  function handleRemoveNote(id: string) {
    const note = model.notes?.find(n => n.id === id)
    if (!note) return
    setModel(prev => ({
      ...prev,
      notes: prev.notes?.filter(n => n.id !== id),
      rows: prev.rows.map(row => ({
        ...row,
        cells: row.cells.map(cell => ({
          ...cell,
          noteMarkers: cell.noteMarkers?.filter(m => m !== note.marker),
        })),
      })),
    }))
  }

  function canDetachNote(note: TableNote): boolean {
    return [...selectedCellIds].some(cellId => {
      const cell = findCellById(cellId)
      return cell?.noteMarkers?.includes(note.marker) ?? false
    })
  }

  function handleDetachNoteFromCells(noteId: string) {
    const note = model.notes?.find(n => n.id === noteId)
    if (!note) return
    setModel(prev => ({
      ...prev,
      rows: prev.rows.map(row => ({
        ...row,
        cells: row.cells.map(cell => {
          if (!selectedCellIds.has(cell.id)) return cell
          return {
            ...cell,
            noteMarkers: cell.noteMarkers?.filter(m => m !== note.marker) ?? [],
          }
        }),
      })),
    }))
  }

  function handleAttachNote(marker: string) {
    if (selectedCellIds.size === 0) return
    setModel(prev => ({
      ...prev,
      rows: prev.rows.map(row => ({
        ...row,
        cells: row.cells.map(cell => {
          if (!selectedCellIds.has(cell.id)) return cell
          const current = cell.noteMarkers ?? []
          if (current.includes(marker)) return cell  // marker duplicate: MVP allows, skip re-attach
          return { ...cell, noteMarkers: [...current, marker] }
        }),
      })),
    }))
  }

  function handleCreateAndAttachNote() {
    const marker = getNextMarker(model.notes ?? [], model.noteNumbering ?? 'alpha')
    const newNote: TableNote = { id: crypto.randomUUID(), marker, text: '' }
    setModel(prev => ({
      ...prev,
      notes: [...(prev.notes ?? []), newNote],
      rows: prev.rows.map(row => ({
        ...row,
        cells: row.cells.map(cell => {
          if (!selectedCellIds.has(cell.id)) return cell
          const current = cell.noteMarkers ?? []
          return { ...cell, noteMarkers: [...current, marker] }
        }),
      })),
    }))
  }

  function handleChangeNoteStyle(style: NoteStyle) {
    setModel(prev => ({ ...prev, noteStyle: style }))
  }

  function handleChangeNoteNumbering(numbering: NoteNumbering) {
    setModel(prev => ({ ...prev, noteNumbering: numbering }))
  }

  // Shared props objects (defined after all handlers)
  const previewProps = {
    model, options, viewMode, onViewModeChange: setViewMode,
    editMode, onEditModeChange: setEditMode,
    onCellChange: updateCell, onCellSelect: handleCellSelect,
    onStyleChange: handleStyleChange, onClearFormatting: handleClearFormatting,
    onSelectAll: handleSelectAll,
    onSelectRow: handleSelectRow, onSelectColumn: handleSelectColumn,
    selectedCellIds, selectedCells, selectedColIndices,
    hiddenColumnIndices, hiddenColumnNames,
    onHideColumns: handleHideColumns, onShowColumn: handleShowColumn,
    onShowAllColumns: handleShowAllColumns,
    onCaptionChange: handleCaptionChange, onLabelChange: handleLabelChange,
    onAttachNote: handleAttachNote, onCreateAndAttachNote: handleCreateAndAttachNote,
    onAddNote: handleAddNote, onUpdateNote: handleUpdateNote,
    onRemoveNote: handleRemoveNote, onDetachNoteFromCells: handleDetachNoteFromCells,
    canDetachNote,
    onChangeNoteStyle: handleChangeNoteStyle,
    onChangeNoteNumbering: handleChangeNoteNumbering,
    onAddRowAbove: handleAddRowAbove, onAddRowBelow: handleAddRowBelow,
    onDeleteRow: handleDeleteRow, onAddColumnLeft: handleAddColumnLeft,
    onAddColumnRight: handleAddColumnRight, onDeleteColumn: handleDeleteColumn,
    onRowBorderChange: handleRowBorderChange,
  } as const

  const inputPanelProps = {
    onParse: handleParse, onMainFileUpload: handleMainFileUpload,
    onCreateTable: handleCreateTable, sources,
    onAddSourceFiles: handleAddSourceFiles,
    onApplyMerge: handleApplyMerge,
    onReplaceWith: handleReplaceWith,
    onRemoveSource: handleRemoveSource,
    onReorderSources: handleReorderSources,
    onSetSourceDirection: handleSetSourceDirection,
    onResetTable: handleResetTable,
  } as const

  function handleCellSelect(cellId: string, rowIdx: number, colIdx: number, isShift: boolean) {
    if (!isShift || !anchorCell) {
      setAnchorCell({ cellId, rowIdx, colIdx })
      setSelectedCellIds(new Set([cellId]))
    } else {
      const ids = getCellsInRect(model, anchorCell, rowIdx, colIdx)
      setSelectedCellIds(new Set(ids))
    }
  }

  function handleStyleChange(patch: StylePatch) {
    if (selectedCellIds.size === 0) return
    setModel((prev) => updateCellStyle(prev, selectedCellIds, patch))
  }

  function handleClearFormatting() {
    if (selectedCellIds.size === 0) return
    setModel((prev) => updateCellStyle(prev, selectedCellIds, {
      bold: undefined,
      italic: undefined,
      underline: undefined,
      backgroundColor: undefined,
      // align is intentionally NOT cleared
    }))
  }

  function clearSelection() {
    setSelectedCellIds(new Set())
    setAnchorCell(null)
  }

  function handleParse(parsed: TableModel) {
    setModel(() => parsed)
    clearSelection()
  }

  // ── File upload helpers ──────────────────────────────
  async function parseFileToModel(file: File) {
    const isExcel = /\.(xlsx|xls)$/i.test(file.name)
    if (isExcel) {
      const buffer = await file.arrayBuffer()
      const rows = await parseExcel(buffer)
      return rows.length > 0 ? normalizeTable(rows) : null
    }
    const text = await file.text()
    return parseInput(text)
  }

  // Load single file into main table (called from InputPanel Upload tab)
  async function handleMainFileUpload(file: File): Promise<void> {
    const parsed = await parseFileToModel(file)
    if (parsed) { setModel(() => parsed); clearSelection() }
  }

  // ── Merge handlers ─────────────────────────────────
  async function handleAddSourceFiles(files: File[]): Promise<void> {
    for (const file of files) {
      const model = await parseFileToModel(file)
      if (!model) continue
      const detectedType = /\.(xlsx|xls)$/i.test(file.name) ? 'csv' as const : detect(await file.text().catch(() => ''))
      const source: TableSource = {
        id: crypto.randomUUID(),
        name: file.name,
        sourceType: detectedType === 'unknown' ? 'manual' : detectedType,
        model,
        direction: 'rows',
      }
      setSources((prev) => [...prev, source])
    }
  }

  function handleReorderSources(newOrder: TableSource[]) {
    setSources(newOrder)
  }

  // React state batching 対策: setModel を1回だけ呼び、全ソースを内部で累積
  // 各ソースの direction に従って適用
  function handleApplyMerge() {
    setModel(prev => {
      let result = prev
      for (const source of sources) {
        result = source.direction === 'columns'
          ? appendColumns(result, source.model)
          : appendRows(result, source.model)
      }
      return result
    })
    clearSelection()
  }

  function handleReplaceWith(source: TableSource) {
    if (window.confirm('現在のテーブルを置き換えますか？')) {
      setModel(() => replaceWith(source.model))
      clearSelection()
    }
  }

  function handleResetTable() {
    if (window.confirm('現在のテーブルをクリアしますか？')) {
      setModel(prev => ({ ...prev, columns: [], rows: [], notes: undefined }))
      clearSelection()
    }
  }

  function handleSetSourceDirection(id: string, direction: 'rows' | 'columns') {
    setSources(prev => prev.map(s => s.id === id ? { ...s, direction } : s))
  }

  function handleRemoveSource(id: string) {
    setSources((prev) => prev.filter((s) => s.id !== id))
  }

  function handleLoadExample() {
    const example = EXAMPLES[exampleIdx % EXAMPLES.length]!
    const parsed = parseInput(example.input)
    if (parsed) {
      parsed.title = example.description
      setModel(() => parsed)
    }
    setExampleIdx((i) => i + 1)
    clearSelection()
  }

  function updateCell(rowId: string, cellId: string, value: string) {
    setModel((prev) => {
      const updatedRows = prev.rows.map((row) =>
        row.id !== rowId
          ? row
          : { ...row, cells: row.cells.map((cell) => cell.id !== cellId ? cell : { ...cell, value }) }
      )
      // Keep columns in sync with header row values
      const headerRow = updatedRows.find((r) => r.rowType === 'header')
      const columns = headerRow ? headerRow.cells.map((c) => c.value) : prev.columns
      return { ...prev, rows: updatedRows, columns }
    })
  }

  function handleAddRowAbove(rowId: string) { setModel((prev) => addRowAbove(prev, rowId)) }
  function handleAddRowBelow(rowId: string) { setModel((prev) => addRowBelow(prev, rowId)) }
  function handleDeleteRow(rowId: string) { setModel((prev) => deleteRow(prev, rowId)) }
  function handleAddColumnLeft(colIdx: number) { setModel((prev) => addColumnLeft(prev, colIdx)) }
  function handleAddColumnRight(colIdx: number) { setModel((prev) => addColumnRight(prev, colIdx)) }
  function handleDeleteColumn(colIdx: number) { setModel((prev) => deleteColumn(prev, colIdx)) }
  function handleRowBorderChange(rowId: string, border: BorderStyle) {
    setModel((prev) => ({
      ...prev,
      rows: prev.rows.map((r) => r.id !== rowId ? r : { ...r, bottomBorder: border }),
    }))
  }
  function handleCreateTable(rows: number, cols: number) {
    setModel(() => createEmptyTable(rows, cols))
    setViewMode('edit')
    clearSelection()
  }

  const [copyAllMode, setCopyAllMode] = useState(false)

  function handleCopyLatex() {
    const text = copyAllMode ? latexAll : latex
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="table-module min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Action bar (module title removed — the app shell's own header already
          shows "LaTeX Research Toolkit" + the active tab; repeating a module
          brand name here just duplicated it) */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="mx-auto flex items-center justify-end gap-2 px-5 py-3" style={{ maxWidth: '960px' }}>
          <button className="btn-secondary text-sm" onClick={handleLoadExample}>
            Load Example
          </button>
          <button className="btn-primary text-sm" onClick={handleCopyLatex}>
            {copied ? 'Copied!' : 'Copy LaTeX'}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto px-5 py-8" style={{ maxWidth: '960px' }}>
        {/* Table tab bar */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--r)', boxShadow: 'var(--shadow-md)',
          padding: '0.75rem 1rem', marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--text-light)',
            }}>Tables</span>
            <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <button
              onClick={handleAddTable}
              title="新しい表を追加"
              style={{
                padding: '3px 10px', fontSize: '0.78rem', fontWeight: 700,
                border: '1.5px dashed var(--accent)', borderRadius: 'var(--rx)',
                background: 'var(--accent-light)', color: 'var(--accent)',
                cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--accent)' }}
            >
              + 表を追加
            </button>
          </div>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {tables.map((t, i) => {
              const isActive = t.id === activeTableId
              return (
                <div
                  key={t.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '6px 10px 6px 14px',
                    border: '1.5px solid',
                    borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                    borderLeft: isActive ? '4px solid var(--accent)' : '1.5px solid var(--border)',
                    borderRadius: 'var(--rs)',
                    background: isActive ? 'var(--accent-light)' : 'var(--bg)',
                    color: isActive ? 'var(--accent)' : 'var(--text-sub)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 700 : 500,
                    whiteSpace: 'nowrap',
                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                    transition: 'all .15s',
                    flexShrink: 0,
                  }}
                  onClick={() => setActiveTableId(t.id)}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--card)' } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)' } }}
                >
                  <span style={{ fontSize: '0.72rem', opacity: 0.6, marginRight: '1px' }}>#{i + 1}</span>
                  <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.title || `表 ${i + 1}`}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteTable(t.id) }}
                    disabled={tables.length <= 1}
                    title="この表を削除"
                    style={{
                      width: '18px', height: '18px', marginLeft: '2px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: 'none', background: 'none',
                      cursor: tables.length <= 1 ? 'default' : 'pointer',
                      color: 'inherit', opacity: tables.length <= 1 ? 0.2 : 0.45,
                      fontSize: '0.8rem', padding: 0, lineHeight: 1, borderRadius: '3px',
                      transition: 'opacity .12s',
                    }}
                    onMouseEnter={e => { if (tables.length > 1) e.currentTarget.style.opacity = '0.9' }}
                    onMouseLeave={e => { if (tables.length > 1) e.currentTarget.style.opacity = '0.45' }}
                  >×</button>
                </div>
              )
            })}
          </div>
        </div>

      {/* Mobile tab switcher */}
        <div
          className="flex gap-1 mb-4 md:hidden"
          style={{ background: 'var(--border)', borderRadius: 'var(--rs)', padding: '3px' }}
        >
          {(['input', 'preview', 'latex'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-1.5 text-sm font-semibold capitalize transition-all"
              style={{
                borderRadius: 'calc(var(--rs) - 2px)',
                background: activeTab === tab ? 'var(--card)' : 'transparent',
                color: activeTab === tab ? 'var(--accent)' : 'var(--text-sub)',
                boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {tab === 'input' ? 'Input' : tab === 'preview' ? 'Preview' : 'LaTeX'}
            </button>
          ))}
        </div>

        {/* Mode selector — Citation⇄BibTeX style */}
        <ModeSelector active={inputMode} onChange={setInputMode} />

        {/* Formatting controls — below mode selector */}
        <FormattingBar options={options} onChange={setOptions} />

        {/* Desktop layout: changes based on inputMode */}
        <div className="hidden md:flex md:flex-col gap-5 mt-5">
          {inputMode === 'paste' ? (
            /* Paste: side-by-side, Input collapses in Edit mode */
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
              {inputCollapsed ? (
                <button
                  onClick={() => setInputCollapsed(false)}
                  title="Input を開く"
                  style={{
                    flexShrink: 0, width: '2rem', padding: '0.5rem 0',
                    border: '1px solid var(--border)', borderRadius: 'var(--rs)',
                    background: 'var(--card)', color: 'var(--text-sub)', cursor: 'pointer',
                    fontSize: '0.8rem', writingMode: 'vertical-rl', letterSpacing: '0.05em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)', transition: 'all .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-light)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sub)'; e.currentTarget.style.background = 'var(--card)' }}
                >
                  » INPUT
                </button>
              ) : (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <InputPanel mode="paste" {...inputPanelProps}
                    onCollapse={viewMode === 'edit' ? () => setInputCollapsed(true) : undefined} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <PreviewPanel {...previewProps} />
              </div>

            </div>
          ) : (
            /* Upload / Create / Merge: full-width mode panel + Preview below */
            <>
              <InputPanel mode={inputMode} {...inputPanelProps} />
              <PreviewPanel {...previewProps} />
            </>
          )}
          <LaTeXPanel latex={latex} latexAll={latexAll} copyAllMode={copyAllMode} onToggleCopyAll={() => setCopyAllMode(m => !m)} onCopy={handleCopyLatex} copied={copied} />
        </div>

        {/* Mobile: single panel by tab */}
        <div className="md:hidden mt-4">
          {activeTab === 'input' && (
            <div>
              <InputPanel mode={inputMode} {...inputPanelProps} />
            </div>
          )}
          {activeTab === 'preview' && <PreviewPanel {...previewProps} />}
          {activeTab === 'latex' && <LaTeXPanel latex={latex} latexAll={latexAll} copyAllMode={copyAllMode} onToggleCopyAll={() => setCopyAllMode(m => !m)} onCopy={handleCopyLatex} copied={copied} />}
        </div>
      </main>

      <Toast message="Copied to clipboard!" visible={copied} />


    </div>
  )
}


const MODE_OPTIONS: { value: InputMode; icon: string; label: string; desc: string }[] = [
  { value: 'paste', icon: '✏️', label: 'Paste', desc: 'テキスト貼り付け' },
  { value: 'upload', icon: '📂', label: 'Upload', desc: 'ファイル読み込み' },
  { value: 'create', icon: '🆕', label: 'Create', desc: '空テーブル作成' },
  { value: 'merge', icon: '🔗', label: 'Merge', desc: 'ソース統合' },
  { value: 'ocr', icon: '🖼️', label: 'OCR', desc: '画像から読み取り' },
]

function ModeSelector({ active, onChange }: { active: InputMode; onChange: (m: InputMode) => void }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        padding: '4px',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '1.25rem',
      }}
    >
      {MODE_OPTIONS.map(({ value, icon, label, desc }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          style={{
            flex: 1,
            padding: '0.5rem 0.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            border: 'none',
            borderRadius: 'var(--rs)',
            cursor: 'pointer',
            transition: 'all .18s',
            background: active === value ? 'var(--card)' : 'transparent',
            color: active === value ? 'var(--accent)' : 'var(--text-sub)',
            boxShadow: active === value ? 'var(--shadow-sm)' : 'none',
          }}
          onMouseEnter={(e) => { if (active !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.5)' }}
          onMouseLeave={(e) => { if (active !== value) e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{icon}</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.2 }}>{label}</span>
          <span style={{ fontSize: '0.65rem', color: active === value ? 'var(--accent)' : 'var(--text-light)', lineHeight: 1.2 }}>
            {desc}
          </span>
        </button>
      ))}
    </div>
  )
}

function LaTeXPanel({
  latex,
  latexAll,
  copyAllMode,
  onToggleCopyAll,
  onCopy,
  copied,
}: {
  latex: string
  latexAll: string
  copyAllMode: boolean
  onToggleCopyAll: () => void
  onCopy: () => void
  copied: boolean
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center text-xs font-extrabold"
            style={{ width: '1.375rem', height: '1.375rem', borderRadius: '50%',
              background: 'var(--accent-light)', color: 'var(--accent)' }}>3</span>
          <span className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-light)', letterSpacing: '0.1em' }}>LaTeX</span>
        </div>
        <div style={{ display: 'flex', gap: '2px', padding: '2px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--rs)' }}>
          {(['現在の表', 'すべての表'] as const).map((label, i) => (
            <button
              key={label}
              onClick={() => { if ((i === 0) !== !copyAllMode) onToggleCopyAll() }}
              style={{
                padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600,
                border: 'none', borderRadius: 'calc(var(--rs) - 2px)', cursor: 'pointer', transition: 'all .15s',
                background: (i === 0 ? !copyAllMode : copyAllMode) ? 'var(--card)' : 'transparent',
                color: (i === 0 ? !copyAllMode : copyAllMode) ? 'var(--accent)' : 'var(--text-sub)',
                boxShadow: (i === 0 ? !copyAllMode : copyAllMode) ? 'var(--shadow-sm)' : 'none',
              }}
            >{label}</button>
          ))}
        </div>
      </div>
      <textarea
        readOnly
        className="w-full font-mono text-sm resize-none"
        rows={8}
        value={copyAllMode ? latexAll : latex}
        style={{
          background: '#F9F9FF',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--rs)',
          padding: '.75rem 1rem',
          outline: 'none',
          lineHeight: 1.75,
          color: 'var(--accent-dark)',
          cursor: 'default',
        }}
      />
      <button className="btn-primary w-full mt-1 text-sm" onClick={onCopy}>
        {copied ? 'Copied!' : (copyAllMode ? 'Copy All Tables' : 'Copy LaTeX')}
      </button>
    </div>
  )
}

export default TableModule
