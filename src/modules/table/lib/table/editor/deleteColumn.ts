import type { TableModel } from '../types'

export function deleteColumn(model: TableModel, colIdx: number): TableModel {
  const colCount = model.rows[0]?.cells.length ?? 0
  if (colCount <= 1) return model

  const rows = model.rows.map((row) => ({
    ...row,
    cells: row.cells.filter((_, i) => i !== colIdx),
  }))

  const columns = model.columns.filter((_, i) => i !== colIdx)

  return { ...model, rows, columns }
}
