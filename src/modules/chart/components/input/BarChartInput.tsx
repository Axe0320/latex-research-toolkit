import { useState, useRef } from 'react'
import type { BarChartData } from '../../types/figures'
import { parseCsv, toNum } from './DataInput/parseCsv'
import CsvUploadButton from '../common/CsvUploadButton'
import ManualTableInput from './DataInput/ManualTableInput'
import InputModeToggle from './DataInput/InputModeToggle'

interface Props {
  data: BarChartData
  onChange: (data: BarChartData, seriesLabels?: string[]) => void
}

const SAMPLE: BarChartData = {
  labels: ['A', 'B', 'C', 'D'],
  values: [4.2, 7.8, 3.1, 6.5],
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  outline: 'none',
  transition: 'border-color 0.15s',
  fontSize: 12,
}

function dataToManualInit(data: BarChartData): { rows: string[][]; seriesNames: string[] } {
  const values = Array.isArray(data.values[0])
    ? data.values as number[][]
    : [data.values as number[]]
  const rows = data.labels.map((l, i) => [l, ...values.map(s => String(s[i] ?? ''))])
  const seriesNames = values.map((_, i) => `系列${i + 1}`)
  return { rows, seriesNames }
}

function manualToData(rows: string[][], seriesNames: string[]): { data: BarChartData; labels?: string[] } {
  const labels = rows.map(r => r[0] || '')
  if (seriesNames.length <= 1) {
    return { data: { labels, values: rows.map(r => parseFloat(r[1] ?? '') || 0) } }
  }
  return {
    data: { labels, values: seriesNames.map((_, si) => rows.map(r => parseFloat(r[si + 1] ?? '') || 0)) },
    labels: seriesNames,
  }
}

export default function BarChartInput({ data, onChange }: Props) {
  const pasteRef = useRef<HTMLTextAreaElement>(null)
  const [mode, setMode] = useState<'manual' | 'paste'>('manual')
  const [manualKey, setManualKey] = useState(0)

  const switchMode = (m: 'manual' | 'paste') => {
    if (m === 'manual') setManualKey(k => k + 1)
    setMode(m)
  }

  const handleManualChange = (rows: string[][], seriesNames: string[]) => {
    const { data: d, labels } = manualToData(rows, seriesNames)
    onChange(d, labels)
  }

  const handlePaste = () => {
    const text = pasteRef.current?.value ?? ''
    const rows = parseCsv(text)
    if (rows.length === 0) return

    let startRow = 0
    const seriesNames: string[] = []
    if (rows.length > 1 && isNaN(toNum(rows[0][1] ?? ''))) {
      seriesNames.push(...rows[0].slice(1))
      startRow = 1
    }

    const dataRows = rows.slice(startRow)
    const labels   = dataRows.map((r) => r[0])
    const nSeries  = (dataRows[0]?.length ?? 1) - 1

    if (nSeries <= 1) {
      const values = dataRows.map((r) => toNum(r[1] ?? '0'))
      onChange({ labels, values }, seriesNames.length ? seriesNames : undefined)
    } else {
      const values = Array.from({ length: nSeries }, (_, si) =>
        dataRows.map((r) => toNum(r[si + 1] ?? '0'))
      )
      onChange({ labels, values }, seriesNames.length ? seriesNames : undefined)
    }

    if (pasteRef.current) pasteRef.current.value = ''
  }

  const isGrouped = Array.isArray(data.values[0])
  const nSeries   = isGrouped ? (data.values as number[][]).length : 1
  const init      = dataToManualInit(data)

  return (
    <div className="space-y-3">
      <div
        className="text-xs text-gray-500 px-3 py-2 rounded-lg"
        style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}
      >
        {data.labels.length} カテゴリ × {nSeries} 系列
      </div>

      <InputModeToggle mode={mode} onSwitch={switchMode} />

      {mode === 'manual' && (
        <ManualTableInput
          key={manualKey}
          firstColHeader="カテゴリ" firstColType="text"
          initRows={init.rows} initSeriesNames={init.seriesNames}
          onChange={handleManualChange}
        />
      )}

      {mode === 'paste' && (
        <div>
          <p className="text-[10px] text-gray-400 mb-1">
            CSV / TSV を貼り付け（1列目: カテゴリ名、残り: 系列値）
          </p>
          <textarea
            ref={pasteRef}
            rows={5}
            className="w-full p-2 text-xs font-mono resize-y"
            style={{ ...inputStyle, borderRadius: 8 }}
            placeholder={'A\t4.2\nB\t7.8\nC\t3.1'}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF' }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = '#E5E7EB' }}
          />
          <div className="flex gap-2 mt-1">
            <CsvUploadButton onParse={(rows) => {
              if (rows.length === 0) return
              let startRow = 0; const sn: string[] = []
              if (rows.length > 1 && isNaN(toNum(rows[0][1] ?? ''))) { sn.push(...rows[0].slice(1)); startRow = 1 }
              const dr = rows.slice(startRow); const labels = dr.map(r => r[0]); const ns = (dr[0]?.length ?? 1) - 1
              if (ns <= 1) onChange({ labels, values: dr.map(r => toNum(r[1] ?? '0')) }, sn.length ? sn : undefined)
              else onChange({ labels, values: Array.from({ length: ns }, (_, si) => dr.map(r => toNum(r[si + 1] ?? '0'))) }, sn.length ? sn : undefined)
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
