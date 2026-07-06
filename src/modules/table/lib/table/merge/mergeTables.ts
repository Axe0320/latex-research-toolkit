import type { TableModel, TableRow, TableCell } from '../types'

function makeEmptyCell(): TableCell {
  return { id: crypto.randomUUID(), value: '', align: 'left' }
}

function padRowToColCount(row: TableRow, targetCols: number): TableRow {
  if (row.cells.length >= targetCols) return row
  const extra = Array.from(
    { length: targetCols - row.cells.length },
    () => makeEmptyCell()
  )
  return { ...row, cells: [...row.cells, ...extra] }
}

function freshCellIds(row: TableRow): TableRow {
  return { ...row, id: crypto.randomUUID(), cells: row.cells.map(c => ({ ...c, id: crypto.randomUUID() })) }
}

// Append Rows: source data rows (rowType !== 'header') added to primary bottom.
// If primary has no rows, use the full source (header + data) as the base.
export function appendRows(primary: TableModel, source: TableModel): TableModel {
  if (primary.rows.length === 0) {
    return {
      ...primary,
      columns: source.columns,
      rows: source.rows.map(freshCellIds),
    }
  }

  const primaryCols = primary.rows[0]?.cells.length ?? 0
  const sourceCols = source.rows[0]?.cells.length ?? 0
  const maxCols = Math.max(primaryCols, sourceCols)

  const paddedPrimary = primary.rows.map(r => padRowToColCount(r, maxCols))

  const sourceDataRows = source.rows
    .filter(r => r.rowType !== 'header')
    .map(r => freshCellIds(padRowToColCount(r, maxCols)))

  return {
    ...primary,
    rows: [...paddedPrimary, ...sourceDataRows],
  }
}

// Append Columns: source columns appended to primary.
// If primary has no rows, use the full source as the base.
// Aligns by row type: header↔header, data↔data (by data-row index).
export function appendColumns(primary: TableModel, source: TableModel): TableModel {
  if (primary.rows.length === 0) {
    return {
      ...primary,
      columns: source.columns,
      rows: source.rows.map(freshCellIds),
    }
  }

  const primaryColCount = primary.rows[0]?.cells.length ?? 0
  const sourceColCount = source.rows[0]?.cells.length ?? 0

  // Requirement 3: find source header row (by rowType)
  const sourceHeaderRow = source.rows.find(r => r.rowType === 'header')
  const newHeaderCells: TableCell[] = Array.from({ length: sourceColCount }, (_, i): TableCell => ({
    id: crypto.randomUUID(),
    value: sourceHeaderRow?.cells[i]?.value || `Column ${primaryColCount + i + 1}`,
    bold: true,
    align: 'center',
  }))

  const sourceDataRows = source.rows.filter(r => r.rowType !== 'header')

  let dataRowIdx = 0
  const extendedRows = primary.rows.map((row): TableRow => {
    if (row.rowType === 'header') {
      return { ...row, cells: [...row.cells, ...newHeaderCells.map(c => ({ ...c, id: crypto.randomUUID() }))] }
    }

    const sourceRow = sourceDataRows[dataRowIdx]
    dataRowIdx++

    const appendedCells: TableCell[] = sourceRow
      ? sourceRow.cells.map(c => ({ ...c, id: crypto.randomUUID() }))
      : Array.from({ length: sourceColCount }, makeEmptyCell)

    return { ...row, cells: [...row.cells, ...appendedCells] }
  })

  // Extra source data rows (when source has more data rows than primary)
  const extraRows: TableRow[] = sourceDataRows.slice(dataRowIdx).map((sourceRow): TableRow => ({
    id: crypto.randomUUID(),
    rowType: 'normal',
    cells: [
      ...Array.from({ length: primaryColCount }, makeEmptyCell),
      ...sourceRow.cells.map(c => ({ ...c, id: crypto.randomUUID() })),
    ],
  }))

  const allRows = [...extendedRows, ...extraRows]
  const headerRow = allRows.find(r => r.rowType === 'header')
  const columns = headerRow?.cells.map(c => c.value) ?? []

  return { ...primary, rows: allRows, columns }
}

// Replace: returns source model with fresh cell/row IDs.
// window.confirm() is the caller's responsibility (App.tsx).
export function replaceWith(source: TableModel): TableModel {
  return {
    ...source,
    rows: source.rows.map(freshCellIds),
  }
}
