import { useState, useRef, useEffect, useMemo } from 'react'

export interface SpreadsheetColumn {
  header: string
  type?: 'text' | 'number'
  bg?: 'fixed' | 'series'
  width?: number
  removable?: boolean  // false = hide × even when onRemoveColumn is provided
}

interface Props {
  columns: SpreadsheetColumn[]
  rows: string[][]
  onChange: (rows: string[][]) => void
  onAddColumn?: () => void
  onRemoveColumn?: (colIdx: number) => void
}

function stripTrailing(rows: string[][]): string[][] {
  const r = [...rows]
  while (r.length > 0 && r[r.length - 1].every(v => v === '')) r.pop()
  return r
}

export default function SpreadsheetTable({ columns, rows, onChange, onAddColumn, onRemoveColumn }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pendingFocus, setPendingFocus] = useState<[number, number] | null>(null)
  const nCols = columns.length

  const displayRows = useMemo(() => {
    const last = rows[rows.length - 1]
    const needTrailing = !last || last.some(v => v !== '')
    return needTrailing ? [...rows, Array(nCols).fill('')] : rows
  }, [rows, nCols])

  useEffect(() => {
    if (!pendingFocus) return
    const [r, c] = pendingFocus
    const el = containerRef.current?.querySelector<HTMLInputElement>(
      `input[data-r="${r}"][data-c="${c}"]`
    )
    if (el) { el.focus(); el.select(); el.scrollIntoView({ block: 'nearest' }) }
    setPendingFocus(null)
  }, [pendingFocus])

  const handleChange = (ri: number, ci: number, val: string) => {
    const next = displayRows.map((row, r) =>
      r === ri ? row.map((v, c) => (c === ci ? val : v)) : [...row]
    )
    onChange(stripTrailing(next))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, ri: number, ci: number) => {
    const nRows = displayRows.length
    if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) {
        if (ci > 0) setPendingFocus([ri, ci - 1])
        else if (ri > 0) setPendingFocus([ri - 1, nCols - 1])
      } else {
        if (ci < nCols - 1) setPendingFocus([ri, ci + 1])
        else if (ri + 1 < nRows) setPendingFocus([ri + 1, 0])
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        if (ri > 0) setPendingFocus([ri - 1, ci])
      } else {
        setPendingFocus([Math.min(ri + 1, nRows - 1), ci])
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startR: number, startC: number) => {
    const text = e.clipboardData.getData('text')
    const lines = text.split('\n').map(l => l.replace(/\r$/, ''))
    if (lines.length === 1 && !text.includes('\t')) return
    e.preventDefault()
    const next = displayRows.map(r => [...r])
    lines.forEach((line, ri) => {
      const tr = startR + ri
      while (next.length <= tr) next.push(Array(nCols).fill(''))
      line.split('\t').forEach((val, ci) => {
        const tc = startC + ci
        if (tc < nCols) next[tr][tc] = val
      })
    })
    onChange(stripTrailing(next))
  }

  const handleAddRow = () => {
    const next = [...displayRows, Array(nCols).fill('')]
    onChange(next)
    setPendingFocus([displayRows.length - 1, 0])
  }

  return (
    <div ref={containerRef} style={{ overflowX: 'auto', borderRadius: 6, border: '1px solid #E5E7EB' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>
            {columns.map((col, ci) => {
              const isFixed = col.bg === 'fixed'
              const showRemove = col.removable !== false && !isFixed && !!onRemoveColumn
              return (
                <th
                  key={ci}
                  style={{
                    padding: '3px 6px', fontSize: 10, fontWeight: 700,
                    border: '1px solid #E5E7EB', textAlign: 'left',
                    background: isFixed ? '#F3F4F6' : '#EDE9FE',
                    color: isFixed ? '#6B7280' : '#5B21B6',
                    minWidth: col.width ?? 60, whiteSpace: 'nowrap', userSelect: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span style={{ flex: 1 }}>{col.header}</span>
                    {showRemove && (
                      <button
                        onClick={() => onRemoveColumn!(ci)}
                        title="この列を削除"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#EF4444', fontSize: 10, lineHeight: 1, padding: 0,
                        }}
                      >×</button>
                    )}
                  </div>
                </th>
              )
            })}
            {onAddColumn && (
              <th
                onClick={onAddColumn}
                title="系列を追加"
                style={{
                  padding: '3px 8px', border: '1px solid #E5E7EB',
                  background: '#F5F3FF', color: '#6C63FF', cursor: 'pointer',
                  textAlign: 'center', fontSize: 14, fontWeight: 600, lineHeight: 1,
                  minWidth: 28, userSelect: 'none',
                }}
              >＋</th>
            )}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, ri) => (
            <tr key={ri}>
              {columns.map((col, ci) => {
                const isFixed = col.bg === 'fixed'
                return (
                  <td key={ci} style={{ padding: 0, border: '1px solid #E5E7EB' }}>
                    <input
                      data-r={ri}
                      data-c={ci}
                      value={row[ci] ?? ''}
                      onChange={e => handleChange(ri, ci, e.target.value)}
                      onKeyDown={e => handleKeyDown(e, ri, ci)}
                      onPaste={e => handlePaste(e, ri, ci)}
                      inputMode={col.type === 'number' ? 'decimal' : 'text'}
                      style={{
                        display: 'block', width: '100%', padding: '3px 5px',
                        border: 'none', outline: 'none', fontSize: 11,
                        fontFamily: 'monospace',
                        background: isFixed ? '#FAFAFA' : 'white',
                        boxSizing: 'border-box', minWidth: col.width ?? 60,
                      }}
                      onFocus={e => { e.currentTarget.style.background = '#EEF2FF' }}
                      onBlur={e => { e.currentTarget.style.background = isFixed ? '#FAFAFA' : 'white' }}
                    />
                  </td>
                )
              })}
              {onAddColumn && <td style={{ border: '1px solid #E5E7EB', background: '#FAFAFA' }} />}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ textAlign: 'right', borderTop: '1px solid #E5E7EB', padding: '2px 4px' }}>
        <button
          onClick={handleAddRow}
          style={{ fontSize: 10, color: '#6C63FF', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontWeight: 600 }}
        >
          ＋ 行を追加
        </button>
      </div>
    </div>
  )
}
