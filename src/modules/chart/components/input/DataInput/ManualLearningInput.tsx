import { useState } from 'react'
import SpreadsheetTable, { type SpreadsheetColumn } from './SpreadsheetTable'

export interface LearningSeriesConfig {
  name: string
  axis: 'left' | 'right'
}

interface Props {
  initRows: string[][]
  initSeries: LearningSeriesConfig[]
  onChange: (rows: string[][], series: LearningSeriesConfig[]) => void
}

function padRow(row: string[], len: number): string[] {
  const r = [...row]
  while (r.length < len) r.push('')
  return r.slice(0, len)
}

export default function ManualLearningInput({ initRows, initSeries, onChange }: Props) {
  const [rows, setRows] = useState<string[][]>(initRows)
  const [series, setSeries] = useState<LearningSeriesConfig[]>(initSeries)

  const nCols = 1 + series.length
  const columns: SpreadsheetColumn[] = [
    { header: 'Epoch', type: 'number', bg: 'fixed', width: 56 },
    ...series.map(s => ({ header: s.name, type: 'number' as const, bg: 'series' as const })),
  ]

  const emit = (r: string[][], s: LearningSeriesConfig[]) => {
    const nonEmpty = r.filter(row => row.some(v => v !== ''))
    onChange(nonEmpty.map(row => padRow(row, 1 + s.length)), s)
  }

  const handleTableChange = (newRows: string[][]) => {
    const padded = newRows.map(r => padRow(r, nCols))
    setRows(padded); emit(padded, series)
  }

  const handleAddSeries = () => {
    const newSeries = [...series, { name: `Series ${series.length + 1}`, axis: 'left' as const }]
    const newRows = rows.map(r => [...padRow(r, nCols), ''])
    setSeries(newSeries); setRows(newRows); emit(newRows, newSeries)
  }

  const handleRemoveSeries = (colIdx: number) => {
    const si = colIdx - 1
    if (series.length <= 1) return
    const newSeries = series.filter((_, i) => i !== si)
    const newRows = rows.map(r => r.filter((_, ci) => ci !== colIdx))
    setSeries(newSeries); setRows(newRows); emit(newRows, newSeries)
  }

  const toggleAxis = (si: number) => {
    const newSeries = series.map((s, i) =>
      i === si ? { ...s, axis: (s.axis === 'left' ? 'right' : 'left') as 'left' | 'right' } : s
    )
    setSeries(newSeries); emit(rows, newSeries)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SpreadsheetTable
        columns={columns}
        rows={rows}
        onChange={handleTableChange}
        onAddColumn={handleAddSeries}
        onRemoveColumn={series.length > 1 ? handleRemoveSeries : undefined}
      />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {series.map((s, i) => (
          <button
            key={i}
            onClick={() => toggleAxis(i)}
            title={`クリックで軸を切替`}
            style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
              background: s.axis === 'right' ? '#FF6584' : '#6C63FF',
              color: 'white', border: 'none',
            }}
          >
            {s.name}:{s.axis === 'left' ? '左軸' : '右軸'}
          </button>
        ))}
      </div>
    </div>
  )
}
