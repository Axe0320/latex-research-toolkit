import type { TableModel } from '../types'

export function hideColumns(model: TableModel, colIndices: number[]): TableModel {
  const toHide = new Set(colIndices)
  return {
    ...model,
    rows: model.rows.map((row) => ({
      ...row,
      cells: row.cells.map((cell, idx) =>
        toHide.has(idx) ? { ...cell, hidden: true } : cell
      ),
    })),
  }
}

export function showColumn(model: TableModel, colIdx: number): TableModel {
  return {
    ...model,
    rows: model.rows.map((row) => ({
      ...row,
      cells: row.cells.map((cell, idx) =>
        idx === colIdx ? { ...cell, hidden: undefined } : cell
      ),
    })),
  }
}

export function showAllColumns(model: TableModel): TableModel {
  return {
    ...model,
    rows: model.rows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) =>
        cell.hidden ? { ...cell, hidden: undefined } : cell
      ),
    })),
  }
}

// Returns model indices of columns where all cells are hidden
export function getHiddenColumnIndices(model: TableModel): number[] {
  const colCount = model.rows[0]?.cells.length ?? 0
  if (model.rows.length === 0) return []
  return Array.from({ length: colCount }, (_, i) => i).filter((colIdx) =>
    model.rows.every((row) => row.cells[colIdx]?.hidden === true)
  )
}

// Returns column indices that contain any of the given cellIds
export function getColIndicesFromCellIds(
  model: TableModel,
  cellIds: Set<string>
): number[] {
  const indices = new Set<number>()
  model.rows.forEach((row) => {
    row.cells.forEach((cell, colIdx) => {
      if (cellIds.has(cell.id)) indices.add(colIdx)
    })
  })
  return Array.from(indices)
}
