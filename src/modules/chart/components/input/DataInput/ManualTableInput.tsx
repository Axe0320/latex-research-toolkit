import { useState } from 'react'
import SpreadsheetTable, { type SpreadsheetColumn } from './SpreadsheetTable'

interface Props {
  firstColHeader: string
  firstColType: 'text' | 'number'
  initRows: string[][]
  initSeriesNames: string[]
  onChange: (rows: string[][], seriesNames: string[]) => void
  minSeries?: number
}

function padRow(row: string[], len: number): string[] {
  const r = [...row]
  while (r.length < len) r.push('')
  return r.slice(0, len)
}

export default function ManualTableInput({
  firstColHeader, firstColType, initRows, initSeriesNames, onChange, minSeries = 1,
}: Props) {
  const [rows, setRows] = useState<string[][]>(initRows)
  const [seriesNames, setSeriesNames] = useState<string[]>(initSeriesNames)

  const columns: SpreadsheetColumn[] = [
    { header: firstColHeader, type: firstColType, bg: 'fixed' },
    ...seriesNames.map(name => ({ header: name, type: 'number' as const, bg: 'series' as const })),
  ]
  const nCols = 1 + seriesNames.length

  const emit = (r: string[][], names: string[]) => {
    const nonEmpty = r.filter(row => row.some(v => v !== ''))
    onChange(nonEmpty.map(row => padRow(row, 1 + names.length)), names)
  }

  const handleTableChange = (newRows: string[][]) => {
    const padded = newRows.map(r => padRow(r, nCols))
    setRows(padded)
    emit(padded, seriesNames)
  }

  const handleAddSeries = () => {
    const newName = `系列${seriesNames.length + 1}`
    const newNames = [...seriesNames, newName]
    const newRows = rows.map(r => [...padRow(r, nCols), ''])
    setSeriesNames(newNames)
    setRows(newRows)
    emit(newRows, newNames)
  }

  const handleRemoveSeries = (colIdx: number) => {
    const si = colIdx - 1
    if (seriesNames.length <= minSeries) return
    const newNames = seriesNames.filter((_, i) => i !== si)
    const newRows = rows.map(r => r.filter((_, ci) => ci !== colIdx))
    setSeriesNames(newNames)
    setRows(newRows)
    emit(newRows, newNames)
  }

  return (
    <SpreadsheetTable
      columns={columns}
      rows={rows}
      onChange={handleTableChange}
      onAddColumn={handleAddSeries}
      onRemoveColumn={seriesNames.length > minSeries ? handleRemoveSeries : undefined}
    />
  )
}
