import { useState, useRef } from 'react'
import type { StackedBarData } from '../../types/figures'
import { parseCsv, toNum } from './DataInput/parseCsv'
import CsvUploadButton from '../common/CsvUploadButton'
import ManualTableInput from './DataInput/ManualTableInput'
import InputModeToggle from './DataInput/InputModeToggle'

interface Props {
  data: StackedBarData
  onChange: (data: StackedBarData, seriesLabels?: string[]) => void
}

const SAMPLE: StackedBarData = {
  labels: ['A', 'B', 'C', 'D'],
  values: [[4.2, 7.8, 3.1, 6.5], [3.5, 6.1, 4.8, 5.2]],
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none',
  transition: 'border-color 0.15s', fontSize: 12,
}

function dataToManualInit(data: StackedBarData): { rows: string[][]; seriesNames: string[] } {
  const rows = data.labels.map((l, i) => [l, ...data.values.map(s => String(s[i] ?? ''))])
  const seriesNames = data.values.map((_, i) => `系列${i + 1}`)
  return { rows, seriesNames }
}

function parseRows(rows: string[][]): { data: StackedBarData; seriesNames: string[] } {
  let startRow = 0
  const seriesNames: string[] = []
  if (rows.length > 1 && isNaN(toNum(rows[0][1] ?? ''))) {
    seriesNames.push(...rows[0].slice(1))
    startRow = 1
  }
  const dataRows = rows.slice(startRow)
  const labels   = dataRows.map((r) => r[0])
  const nSeries  = (dataRows[0]?.length ?? 1) - 1
  const values   = Array.from({ length: Math.max(nSeries, 1) }, (_, si) =>
    dataRows.map((r) => toNum(r[si + 1] ?? '0'))
  )
  return { data: { labels, values }, seriesNames }
}

export default function StackedBarInput({ data, onChange }: Props) {
  const pasteRef = useRef<HTMLTextAreaElement>(null)
  const [mode, setMode] = useState<'manual' | 'paste'>('manual')
  const [manualKey, setManualKey] = useState(0)

  const switchMode = (m: 'manual' | 'paste') => {
    if (m === 'manual') setManualKey(k => k + 1)
    setMode(m)
  }

  const handleManualChange = (rows: string[][], seriesNames: string[]) => {
    const labels = rows.map(r => r[0] || '')
    const values = seriesNames.map((_, si) => rows.map(r => parseFloat(r[si + 1] ?? '') || 0))
    onChange({ labels, values }, seriesNames)
  }

  const handlePaste = () => {
    const rows = parseCsv(pasteRef.current?.value ?? '')
    if (rows.length === 0) return
    const { data: d, seriesNames } = parseRows(rows)
    onChange(d, seriesNames.length ? seriesNames : undefined)
    if (pasteRef.current) pasteRef.current.value = ''
  }

  const nSeries = data.values.length
  const nCats   = data.labels.length
  const init    = dataToManualInit(data)

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 px-3 py-2 rounded-lg" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
        {nCats} カテゴリ × {nSeries} 系列
      </div>

      <InputModeToggle mode={mode} onSwitch={switchMode} />

      {mode === 'manual' && (
        <ManualTableInput
          key={manualKey}
          firstColHeader="カテゴリ" firstColType="text"
          initRows={init.rows} initSeriesNames={init.seriesNames}
          onChange={handleManualChange}
          minSeries={1}
        />
      )}

      {mode === 'paste' && (
        <div>
          <p className="text-[10px] text-gray-400 mb-1">CSV / TSV を貼り付け（1列目: カテゴリ名、残り: 系列値）</p>
          <textarea
            ref={pasteRef}
            rows={5}
            className="w-full p-2 text-xs font-mono resize-y"
            style={{ ...inputStyle, borderRadius: 8 }}
            placeholder={'A\t4.2\t3.5\nB\t7.8\t6.1\nC\t3.1\t4.8'}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = '#E5E7EB' }}
          />
          <div className="flex gap-2 mt-1">
            <CsvUploadButton onParse={(rows) => {
              if (rows.length === 0) return
              const { data: d, seriesNames } = parseRows(rows)
              onChange(d, seriesNames.length ? seriesNames : undefined)
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
        onClick={() => onChange(SAMPLE, ['系列1', '系列2'])}
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
