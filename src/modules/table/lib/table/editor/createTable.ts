import type { TableModel, TableRow, TableCell } from '../types'

export function createEmptyTable(rowCount = 3, colCount = 4): TableModel {
  const headerCells: TableCell[] = Array.from({ length: colCount }, (_, i): TableCell => ({
    id: crypto.randomUUID(),
    value: `Column ${i + 1}`,
    bold: true,
    align: 'center',
  }))

  const headerRow: TableRow = {
    id: crypto.randomUUID(),
    rowType: 'header',
    separatorBottom: true,
    cells: headerCells,
  }

  const dataRows: TableRow[] = Array.from({ length: rowCount }, (): TableRow => ({
    id: crypto.randomUUID(),
    rowType: 'normal',
    cells: Array.from({ length: colCount }, (): TableCell => ({
      id: crypto.randomUUID(),
      value: '',
      align: 'left',
    })),
  }))

  return {
    id: crypto.randomUUID(),
    title: '',
    label: '',
    environment: 'table*',
    columns: headerCells.map((c) => c.value),
    rows: [headerRow, ...dataRows],
  }
}
