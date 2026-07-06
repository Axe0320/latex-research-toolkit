import { useState } from 'react'
import SpreadsheetTable, { type SpreadsheetColumn } from './SpreadsheetTable'

export interface SeriesEntry {
  label: string
  rows: string[][]
  scalar?: string
}

interface Props {
  col1Header: string
  col2Header: string
  scalarLabel?: string
  initSeries: SeriesEntry[]
  onChange: (series: SeriesEntry[]) => void
  minSeries?: number
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB', borderRadius: 6, outline: 'none',
  padding: '3px 8px', fontSize: 11, boxSizing: 'border-box',
}

export default function ManualSeriesInput({
  col1Header, col2Header, scalarLabel, initSeries, onChange, minSeries = 1,
}: Props) {
  const [list, setList] = useState<SeriesEntry[]>(initSeries)

  const emit = (next: SeriesEntry[]) => { setList(next); onChange(next) }

  const updateRows  = (i: number, rows: string[][]) => emit(list.map((s, idx) => idx === i ? { ...s, rows } : s))
  const updateScalar = (i: number, scalar: string)  => emit(list.map((s, idx) => idx === i ? { ...s, scalar } : s))
  const updateLabel  = (i: number, label: string)   => emit(list.map((s, idx) => idx === i ? { ...s, label } : s))
  const addSeries    = () => emit([...list, { label: `Class ${list.length}`, rows: [], scalar: '0' }])
  const removeSeries = (i: number) => { if (list.length > minSeries) emit(list.filter((_, idx) => idx !== i)) }

  const columns: SpreadsheetColumn[] = [
    { header: col1Header, type: 'number', bg: 'fixed', width: 64 },
    { header: col2Header, type: 'number', bg: 'series', width: 64 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {list.map((s, i) => (
        <div key={i} style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              value={s.label}
              onChange={e => updateLabel(i, e.target.value)}
              placeholder={`系列 ${i + 1}`}
              style={{ ...inputStyle, flex: 1, fontSize: 12, fontWeight: 600 }}
              onFocus={e => { e.currentTarget.style.borderColor = '#6C63FF' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB' }}
            />
            {list.length > minSeries && (
              <button
                onClick={() => removeSeries(i)}
                style={{ fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, whiteSpace: 'nowrap' }}
              >削除</button>
            )}
          </div>
          {scalarLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 11, color: '#6B7280', whiteSpace: 'nowrap' }}>{scalarLabel}</label>
              <input
                type="number" value={s.scalar ?? '0'}
                onChange={e => updateScalar(i, e.target.value)}
                step={0.001} min={0} max={1}
                style={{ ...inputStyle, width: 90 }}
                onFocus={e => { e.currentTarget.style.borderColor = '#6C63FF' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB' }}
              />
            </div>
          )}
          <SpreadsheetTable columns={columns} rows={s.rows} onChange={rows => updateRows(i, rows)} />
        </div>
      ))}
      <button
        onClick={addSeries}
        style={{
          border: '1px dashed #C4B5FD', borderRadius: 8, padding: '6px 0', fontSize: 12,
          color: '#6C63FF', background: 'none', cursor: 'pointer', width: '100%', fontWeight: 600,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#F5F3FF' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
      >
        ＋ 系列を追加
      </button>
    </div>
  )
}
