export { addRowAbove, addRowBelow } from './addRow'
export { deleteRow } from './deleteRow'
export { addColumnLeft, addColumnRight } from './addColumn'
export { deleteColumn } from './deleteColumn'
export { createEmptyTable } from './createTable'
export { updateCellStyle } from './updateCellStyle'
export type { StylePatch } from './updateCellStyle'
export { getCellsInRect } from './getCellsInRect'
export type { CellAnchor } from './getCellsInRect'
export {
  hideColumns,
  showColumn,
  showAllColumns,
  getHiddenColumnIndices,
  getColIndicesFromCellIds,
} from './columnVisibility'
