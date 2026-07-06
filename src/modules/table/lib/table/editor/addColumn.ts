import type { TableModel, TableCell } from '../types'

function insertColumn(model: TableModel, insertIdx: number): TableModel {
  const colCount = model.rows[0]?.cells.length ?? 0
  const safeIdx = Math.max(0, Math.min(insertIdx, colCount))

  const rows = model.rows.map((row) => {
    const isHeader = row.rowType === 'header'
    const newCell: TableCell = {
      id: crypto.randomUUID(),
      value: '',
      align: isHeader ? 'center' : 'left',
      bold: isHeader ? true : undefined,
    }
    const cells = [...row.cells]
    cells.splice(safeIdx, 0, newCell)
    return { ...row, cells }
  })

  const columns = [...model.columns]
  columns.splice(safeIdx, 0, '')

  return { ...model, rows, columns }
}

export function addColumnLeft(model: TableModel, colIdx: number): TableModel {
  return insertColumn(model, colIdx)
}

export function addColumnRight(model: TableModel, colIdx: number): TableModel {
  return insertColumn(model, colIdx + 1)
}
