import { useState } from 'react'
import type { ErrorBarData } from '../../../types/figures'
import SpreadsheetTable, { type SpreadsheetColumn } from './SpreadsheetTable'

interface Props {
  initData: ErrorBarData
  onChange: (data: ErrorBarData) => void
}

function dataToRows(data: ErrorBarData): string[][] {
  return data.labels.map((l, ri) => [
    l,
    ...data.series.flatMap(s => [String(s.means[ri] ?? ''), String(s.errors[ri] ?? '')]),
  ])
}

function buildColumns(seriesNames: string[]): SpreadsheetColumn[] {
  return [
    { header: 'グループ', type: 'text', bg: 'fixed', width: 80 },
    ...seriesNames.flatMap(name => [
      { header: `${name} 平均`, type: 'number' as const, bg: 'series' as const, width: 70 },
      { header: `${name} 誤差`, type: 'number' as const, bg: 'series' as const, width: 70, removable: false },
    ]),
  ]
}

function rowsToData(rows: string[][], seriesNames: string[]): ErrorBarData {
  const nonEmpty = rows.filter(r => r.some(v => v !== ''))
  return {
    labels: nonEmpty.map(r => r[0] || ''),
    series: seriesNames.map((name, si) => ({
      name,
      means:  nonEmpty.map(r => parseFloat(r[1 + si * 2] ?? '') || 0),
      errors: nonEmpty.map(r => parseFloat(r[2 + si * 2] ?? '') || 0),
    })),
  }
}

export default function ManualErrorBarInput({ initData, onChange }: Props) {
  const [rows, setRows] = useState<string[][]>(() => dataToRows(initData))
  const [seriesNames, setSeriesNames] = useState<string[]>(() => initData.series.map(s => s.name))

  const emit = (r: string[][], names: string[]) => onChange(rowsToData(r, names))

  const handleTableChange = (newRows: string[][]) => {
    setRows(newRows); emit(newRows, seriesNames)
  }

  const addSeries = () => {
    const newName = `Series ${seriesNames.length + 1}`
    const newNames = [...seriesNames, newName]
    const newRows = rows.map(r => [...r, '', ''])
    setSeriesNames(newNames); setRows(newRows); emit(newRows, newNames)
  }

  const removeSeries = (colIdx: number) => {
    if (seriesNames.length <= 1) return
    const si = Math.floor((colIdx - 1) / 2)
    const c1 = 1 + si * 2
    const c2 = c1 + 1
    const newNames = seriesNames.filter((_, i) => i !== si)
    const newRows = rows.map(r => r.filter((_, ci) => ci !== c1 && ci !== c2))
    setSeriesNames(newNames); setRows(newRows); emit(newRows, newNames)
  }

  const columns = buildColumns(seriesNames)

  return (
    <SpreadsheetTable
      columns={columns}
      rows={rows}
      onChange={handleTableChange}
      onAddColumn={addSeries}
      onRemoveColumn={seriesNames.length > 1 ? removeSeries : undefined}
    />
  )
}
