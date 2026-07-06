import type { TableModel } from '../types'

export type CellAnchor = {
  rowIdx: number
  colIdx: number
  cellId: string
}

export function getCellsInRect(
  model: TableModel,
  anchor: CellAnchor,
  targetRowIdx: number,
  targetColIdx: number
): string[] {
  const minRow = Math.min(anchor.rowIdx, targetRowIdx)
  const maxRow = Math.max(anchor.rowIdx, targetRowIdx)
  const minCol = Math.min(anchor.colIdx, targetColIdx)
  const maxCol = Math.max(anchor.colIdx, targetColIdx)

  const ids: string[] = []
  for (let r = minRow; r <= maxRow; r++) {
    const row = model.rows[r]
    if (!row) continue
    for (let c = minCol; c <= maxCol; c++) {
      const cell = row.cells[c]
      if (cell) ids.push(cell.id)
    }
  }
  return ids
}
