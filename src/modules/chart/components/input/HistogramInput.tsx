import { useState, useRef } from 'react'
import { parseCsv, toNum } from './DataInput/parseCsv'
import CsvUploadButton from '../common/CsvUploadButton'
import SpreadsheetTable, { type SpreadsheetColumn } from './DataInput/SpreadsheetTable'
import InputModeToggle from './DataInput/InputModeToggle'

interface Props {
  data: number[]
  onChange: (data: number[]) => void
}

const SAMPLE = [
  2.1, 2.5, 2.8, 3.0, 3.2, 3.3, 3.5, 3.7, 3.8, 4.0,
  4.1, 4.2, 4.4, 4.5, 4.6, 4.8, 5.0, 5.1, 5.3, 5.5,
]

const inputStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  outline: 'none',
  transition: 'border-color 0.15s',
  fontSize: 12,
}

const COLS: SpreadsheetColumn[] = [
  { header: '値', bg: 'series', type: 'number', width: 80 },
]

function dataToRows(data: number[]): string[][] {
  return data.map(v => [String(v)])
}

export default function HistogramInput({ data, onChange }: Props) {
  const pasteRef = useRef<HTMLTextAreaElement>(null)
  const [mode, setMode] = useState<'manual' | 'paste'>('manual')
  const [manualKey, setManualKey] = useState(0)
  const [manualRows, setManualRows] = useState<string[][]>(() => dataToRows(data))

  const switchMode = (m: 'manual' | 'paste') => {
    if (m === 'manual') {
      setManualRows(dataToRows(data))
      setManualKey(k => k + 1)
    }
    setMode(m)
  }

  const handleManualChange = (rows: string[][]) => {
    setManualRows(rows)
    const nums = rows.map(r => parseFloat(r[0] ?? '')).filter(v => !isNaN(v))
    onChange(nums)
  }

  const handlePaste = () => {
    const text = pasteRef.current?.value ?? ''
    const rows = parseCsv(text)
    if (rows.length === 0) return
    const nums = rows.flatMap((r) => r.map(toNum)).filter((v) => !isNaN(v))
    if (nums.length > 0) onChange(nums)
    if (pasteRef.current) pasteRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      <div
        className="text-xs text-gray-500 px-3 py-2 rounded-lg"
        style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}
      >
        {data.length} 件
      </div>

      <InputModeToggle mode={mode} onSwitch={switchMode} />

      {mode === 'manual' && (
        <SpreadsheetTable key={manualKey} columns={COLS} rows={manualRows} onChange={handleManualChange} />
      )}

      {mode === 'paste' && (
        <div>
          <p className="text-[10px] text-gray-400 mb-1">数値を貼り付け（1列または複数行）</p>
          <textarea
            ref={pasteRef}
            rows={5}
            className="w-full p-2 text-xs font-mono resize-y"
            style={{ ...inputStyle, borderRadius: 8 }}
            placeholder={'2.1\n2.5\n2.8\n3.0'}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = '#E5E7EB' }}
          />
          <div className="flex gap-2 mt-1">
            <CsvUploadButton onParse={(rows) => {
              const nums = rows.flatMap(r => r.map(toNum)).filter(v => !isNaN(v))
              if (nums.length > 0) onChange(nums)
            }} />
            <button
              onClick={handlePaste}
              className="flex-1 py-1.5 text-xs font-semibold text-white rounded-lg transition-all"
              style={{ background: '#6C63FF' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#5a52e0' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#6C63FF' }}
            >
              データを適用
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => onChange(SAMPLE)}
        className="w-full py-1.5 text-xs rounded-lg transition-all"
        style={{ border: '1px solid #E5E7EB', color: '#6B7280', background: 'white' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#C4B5FD' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB' }}
      >
        サンプルデータを読み込む
      </button>
    </div>
  )
}
