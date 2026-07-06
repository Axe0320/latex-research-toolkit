import type { TableModel, TableRow, TableCell } from '../types'

export function normalizeTable(raw: string[][]): TableModel {
  const nonEmpty = raw.filter((row) => row.some((cell) => cell.trim()))
  if (nonEmpty.length === 0) return emptyModel()

  const padded = padToMaxCols(nonEmpty)
  const trimmed = trimTrailingEmptyCols(padded)
  const colCount = trimmed[0]?.length ?? 0
  const colAligns = detectColAlignments(trimmed, colCount)

  const rows: TableRow[] = trimmed.map((rawRow, rowIndex): TableRow => {
    const isHeader = rowIndex === 0

    const cells: TableCell[] = rawRow.map((value, colIndex): TableCell => {
      const colAlign = colAligns[colIndex] ?? 'left'
      return {
        id: crypto.randomUUID(),
        value: value.trim(),
        bold: isHeader ? true : undefined,
        // Header: always center. Data: use column alignment.
        align: isHeader ? 'center' : colAlign,
      }
    })

    return {
      id: crypto.randomUUID(),
      cells,
      rowType: isHeader ? 'header' : 'normal',
      separatorBottom: isHeader ? true : undefined,
    }
  })

  const columns = rows[0]?.cells.map((c) => c.value) ?? []

  return {
    id: crypto.randomUUID(),
    title: '',
    label: '',
    environment: 'table*',
    columns,
    rows,
  }
}

// Pad each row to the same length (max columns in table)
function padToMaxCols(rows: string[][]): string[][] {
  const maxCols = Math.max(...rows.map((r) => r.length))
  return rows.map((row) => {
    const padded = [...row]
    while (padded.length < maxCols) padded.push('')
    return padded
  })
}

// Remove trailing columns where every row is empty/whitespace
function trimTrailingEmptyCols(rows: string[][]): string[][] {
  if (rows.length === 0) return rows
  const colCount = rows[0]?.length ?? 0
  let lastNonEmpty = colCount - 1
  while (lastNonEmpty > 0) {
    const allEmpty = rows.every((row) => !(row[lastNonEmpty] ?? '').trim())
    if (!allEmpty) break
    lastNonEmpty--
  }
  return rows.map((row) => row.slice(0, lastNonEmpty + 1))
}

// For each column, if majority of data rows (non-header) are numeric → 'right', else 'left'
function detectColAlignments(rows: string[][], colCount: number): ('left' | 'right')[] {
  const dataRows = rows.slice(1)
  return Array.from({ length: colCount }, (_, colIdx): 'left' | 'right' => {
    const values = dataRows.map((row) => (row[colIdx] ?? '').trim())
    const nonEmpty = values.filter((v) => v !== '')
    if (nonEmpty.length === 0) return 'left'
    const numericCount = nonEmpty.filter((v) => isFinite(Number(v))).length
    return numericCount > nonEmpty.length / 2 ? 'right' : 'left'
  })
}

function emptyModel(): TableModel {
  return {
    id: crypto.randomUUID(),
    title: '',
    label: '',
    environment: 'table*',
    columns: [],
    rows: [],
  }
}
