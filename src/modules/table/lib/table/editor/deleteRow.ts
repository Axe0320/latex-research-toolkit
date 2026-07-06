import type { TableModel } from '../types'

export function deleteRow(model: TableModel, rowId: string): TableModel {
  const row = model.rows.find((r) => r.id === rowId)
  if (!row) return model
  if (row.rowType === 'header') return model
  return { ...model, rows: model.rows.filter((r) => r.id !== rowId) }
}
