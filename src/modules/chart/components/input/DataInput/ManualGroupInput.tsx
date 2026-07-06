import { useState } from 'react'
import SpreadsheetTable, { type SpreadsheetColumn } from './SpreadsheetTable'

export interface GroupEntry {
  label: string
  rows: string[][]
}

interface Props {
  initGroups: GroupEntry[]
  onChange: (groups: GroupEntry[]) => void
  minGroups?: number
}

const COLUMNS: SpreadsheetColumn[] = [
  { header: '値', type: 'number', bg: 'series', width: 80 },
]

export default function ManualGroupInput({ initGroups, onChange, minGroups = 1 }: Props) {
  const [groups, setGroups] = useState<GroupEntry[]>(initGroups)

  const emit = (next: GroupEntry[]) => { setGroups(next); onChange(next) }

  const updateLabel = (i: number, label: string) => emit(groups.map((g, idx) => idx === i ? { ...g, label } : g))
  const updateRows  = (i: number, rows: string[][]) => emit(groups.map((g, idx) => idx === i ? { ...g, rows } : g))
  const addGroup    = () => emit([...groups, { label: `Group ${groups.length + 1}`, rows: [] }])
  const removeGroup = (i: number) => { if (groups.length > minGroups) emit(groups.filter((_, idx) => idx !== i)) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {groups.map((g, i) => (
        <div key={i} style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              value={g.label}
              onChange={e => updateLabel(i, e.target.value)}
              placeholder={`Group ${i + 1}`}
              style={{
                flex: 1, border: '1px solid #E5E7EB', borderRadius: 6,
                padding: '3px 8px', fontSize: 12, fontWeight: 600, outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#6C63FF' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB' }}
            />
            {groups.length > minGroups && (
              <button
                onClick={() => removeGroup(i)}
                style={{ fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}
              >削除</button>
            )}
          </div>
          <SpreadsheetTable columns={COLUMNS} rows={g.rows} onChange={rows => updateRows(i, rows)} />
          <span style={{ fontSize: 10, color: '#9CA3AF' }}>
            {g.rows.filter(r => r[0] !== '').length} 件
          </span>
        </div>
      ))}
      <button
        onClick={addGroup}
        style={{
          border: '1.5px dashed #C4B5FD', borderRadius: 8, padding: '6px 0', fontSize: 12,
          color: '#6C63FF', background: 'none', cursor: 'pointer', width: '100%',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#F5F3FF' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
      >
        + グループ追加
      </button>
    </div>
  )
}
