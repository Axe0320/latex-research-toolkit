import type { TableModel } from '../types'

export type StylePatch = {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  backgroundColor?: string
  align?: 'left' | 'center' | 'right'
}

export function updateCellStyle(
  model: TableModel,
  cellIds: Set<string>,
  patch: StylePatch
): TableModel {
  return {
    ...model,
    rows: model.rows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => {
        if (!cellIds.has(cell.id)) return cell
        const updated = { ...cell }
        if ('bold' in patch) updated.bold = patch.bold
        if ('italic' in patch) updated.italic = patch.italic
        if ('underline' in patch) updated.underline = patch.underline
        if ('backgroundColor' in patch) updated.backgroundColor = patch.backgroundColor
        if ('align' in patch) updated.align = patch.align
        return updated
      }),
    })),
  }
}
