import type { TableModel, TableRow, TableCell } from '../types'

function makeEmptyRow(colCount: number): TableRow {
  const cells: TableCell[] = Array.from({ length: colCount }, (): TableCell => ({
    id: crypto.randomUUID(),
    value: '',
    align: 'left',
  }))
  return {
    id: crypto.randomUUID(),
    rowType: 'normal',
    cells,
  }
}

export function addRowAbove(model: TableModel, rowId: string): TableModel {
  const idx = model.rows.findIndex((r) => r.id === rowId)
  if (idx === -1) return model
  const colCount = model.rows[0]?.cells.length ?? 1
  const rows = [...model.rows]
  rows.splice(idx, 0, makeEmptyRow(colCount))
  return { ...model, rows }
}

export function addRowBelow(model: TableModel, rowId: string): TableModel {
  const idx = model.rows.findIndex((r) => r.id === rowId)
  if (idx === -1) return model
  const colCount = model.rows[0]?.cells.length ?? 1
  const rows = [...model.rows]
  rows.splice(idx + 1, 0, makeEmptyRow(colCount))
  return { ...model, rows }
}
